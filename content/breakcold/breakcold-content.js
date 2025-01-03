// Debug configuration
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AI Comment Generator]', ...args);

// Platform-specific styles
const platformStyles = document.createElement('style');
platformStyles.textContent = `
    .comment-generator-button {
        background: transparent;
        border: none;
        color: rgb(100 116 139);
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        width: 32px;
        height: 32px;
    }

    .comment-generator-button:hover {
        background-color: rgba(100, 116, 139, 0.1);
    }

    .comment-generator-container {
        position: absolute;
        right: 45px;
        bottom: 8px;
        display: flex;
        align-items: center;
    }
`;

document.head.appendChild(platformStyles);

// Function to get post text
function getPostText(button) {
    try {
        // Find the comment field container
        const commentField = button.closest('.comment-generator-container')?.parentElement;
        if (!commentField) {
            throw new Error('Could not find comment field');
        }

        // Find the post container
        let currentElement = commentField;
        let postContainer = null;

        while (currentElement && !postContainer) {
            if (currentElement.matches('article') || 
                currentElement.matches('.flex.flex-col')) {
                postContainer = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }

        if (!postContainer) {
            throw new Error('Could not find post container');
        }

        // Get the post content
        const contentContainer = postContainer.querySelector('.line-clamp-none') || 
                               postContainer.querySelector('[class*="text-black dark:text-white text-sm break-words"]');

        if (!contentContainer) {
            throw new Error('Could not find content container');
        }

        // Extract text content
        const textContent = Array.from(contentContainer.childNodes)
            .filter(node => {
                if (node.nodeType === Node.TEXT_NODE) return true;
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return !node.matches('button, a, [class*="cursor-pointer"]');
                }
                return false;
            })
            .map(node => node.textContent.trim())
            .filter(text => text)
            .join(' ');

        // Get image if present
        const image = postContainer.querySelector('img:not([alt=""])');
        const imageAlt = image ? image.alt : '';

        // Combine text content and image description
        const postText = [textContent, imageAlt].filter(Boolean).join(' ').trim();

        if (!postText) {
            throw new Error('Could not find post content');
        }

        log('Successfully extracted post text:', postText);
        return postText;
    } catch (error) {
        log('Error in getPostText:', error);
        throw error;
    }
}

// Function to create comment button
function createCommentButton() {
    const button = document.createElement('button');
    button.className = 'comment-generator-button';
    button.innerHTML = '<span class="icon">✨</span>';
    button.addEventListener('click', handleCommentGeneration);
    return button;
}

// Function to inject button for comment fields
function injectButtonForCommentField(commentField) {
    // Check if it's a Breakcold comment field
    if (!commentField.matches('textarea[placeholder*="Add a comment"]')) return;
    
    // Get the parent container
    const container = commentField.closest('.w-full.flex.relative');
    if (!container) return;
    
    // Check if button already exists
    const existingButton = container.querySelector('.comment-generator-button');
    if (existingButton) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'comment-generator-container';
    
    const button = createCommentButton();
    buttonContainer.appendChild(button);
    
    // Find the emoji button container
    const emojiButton = container.querySelector('button[aria-haspopup="dialog"]');
    if (emojiButton) {
        emojiButton.parentElement.insertBefore(buttonContainer, emojiButton);
    } else {
        container.appendChild(buttonContainer);
    }
}

// Function to handle comment generation
async function handleCommentGeneration(event, isRegeneration = false) {
    try {
        // Get the target button
        let targetButton;
        if (isRegeneration) {
            const modal = document.querySelector('.comment-modal.breakcold');
            targetButton = modal.dataset.originalButton ? 
                document.querySelector(modal.dataset.originalButton) : 
                modal.querySelector('.comment-generator-button');
        } else {
            targetButton = event?.target?.closest('.comment-generator-button') || event;
        }

        if (!targetButton) {
            console.error('No target button found');
            return;
        }

        // Create modal if it doesn't exist
        let modal = document.querySelector('.comment-modal.breakcold');
        if (!modal) {
            modal = createCommentModal(targetButton);
            document.body.appendChild(modal);
        }

        const loadingContainer = modal.querySelector('.loading-container');
        const commentsList = modal.querySelector('.comments-list');
        const errorMessage = modal.querySelector('.error-message');

        if (!loadingContainer || !commentsList || !errorMessage) {
            throw new Error('Modal elements not found');
        }

        // Show modal and loading state
        modal.classList.remove('hidden');
        loadingContainer.style.display = 'block';
        commentsList.style.display = 'none';
        errorMessage.classList.add('hidden');

        // Get post info
        const postInfo = await getPostInfo(targetButton);
        if (!postInfo || !postInfo.text) {
            throw new Error('Could not extract post content');
        }

        // Store current comments before regeneration
        const previousComments = isRegeneration ? getPreviousComments(modal) : [];
        const regenerationId = isRegeneration ? crypto.randomUUID() : undefined;

        // Generate comments using CommentAPI with CORS handling
        try {
            const comments = await window.CommentAPI.generateComments(postInfo.text, 'breakcold', {
                mode: 'cors',
                credentials: 'include',
                headers: {
                    'Origin': 'https://app.breakcold.com',
                    'Access-Control-Allow-Origin': '*'
                }
            });

            if (!comments || comments.length === 0) {
                throw new Error('No comments were generated');
            }

            // Store generation state
            sessionStorage.setItem('currentPostId', postInfo.postId);
            sessionStorage.setItem('currentPostText', postInfo.text);
            sessionStorage.setItem('generatedComments', JSON.stringify(comments));
            if (isRegeneration) {
                sessionStorage.setItem('previousComments', JSON.stringify(previousComments));
                sessionStorage.setItem('regenerationId', regenerationId);
            }

            // Track the generation event
            if (window.analyticsObserver) {
                window.analyticsObserver.trackCommentGeneration('breakcold', postInfo.text, comments, {
                    postId: postInfo.postId,
                    isRegeneration,
                    previousComments,
                    regenerationId
                });
            }

            loadingContainer.style.display = 'none';
            commentsList.style.display = 'block';

            // Display comments with proper structure and type
            const formattedComments = comments.map(comment => {
                // Extract the tone from the comment
                let type = 'Neutral';
                if (typeof comment === 'object' && comment.type) {
                    // Handle detailed tone format like "Friendly (Informational)"
                    const toneMatch = comment.type.match(/^(\w+)/);
                    type = toneMatch ? toneMatch[1] : comment.type;
                } else if (typeof comment === 'object' && comment.tone) {
                    type = comment.tone;
                }

                return {
                    text: typeof comment === 'object' ? comment.text : comment,
                    type: type
                };
            });

            displayCommentOptions(formattedComments, modal, targetButton, postInfo.postId, isRegeneration);
        } catch (error) {
            console.error('CORS Error:', error);
            // Try fallback method with no-cors mode
            const comments = await window.CommentAPI.generateComments(postInfo.text, 'breakcold', {
                mode: 'no-cors',
                credentials: 'omit'
            });

            if (!comments || comments.length === 0) {
                throw new Error('Failed to generate comments. Please try again.');
            }

            // Process comments as before...
            loadingContainer.style.display = 'none';
            commentsList.style.display = 'block';
            displayCommentOptions(comments, modal, targetButton, postInfo.postId, isRegeneration);
        }
    } catch (error) {
        console.error('Error generating comments:', error);
        const modal = document.querySelector('.comment-modal.breakcold');
        if (modal) {
            const loadingContainer = modal.querySelector('.loading-container');
            const errorMessage = modal.querySelector('.error-message');
            
            if (loadingContainer) loadingContainer.style.display = 'none';
            if (errorMessage) {
                errorMessage.classList.remove('hidden');
                const errorText = errorMessage.querySelector('p');
                if (errorText) {
                    errorText.textContent = error.message || 'Failed to generate comments. Please try again.';
                }
            }
        }
    }
}

// Function to create comment modal
function createCommentModal(button) {
    const modal = document.createElement('div');
    modal.className = 'comment-modal breakcold hidden';
    
    // Store a unique selector for the original button
    if (button) {
        const buttonId = `comment-btn-${crypto.randomUUID()}`;
        button.id = buttonId;
        modal.dataset.originalButton = `#${buttonId}`;
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Generated Comments</h2>
                <div class="header-buttons">
                    <button class="regenerate-btn" title="Regenerate Comments">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerate</span>
                    </button>
                    <button class="modal-close" aria-label="Close">×</button>
                </div>
            </div>
            <div class="loading-container hidden">
                <div class="loading-spinner">
                    <div class="spinner"></div>
                </div>
                <div class="loading-text">Generating comments...</div>
            </div>
            <div class="error-message hidden"></div>
            <div class="comments-list"></div>
        </div>
    `;

    // Close button handler
    modal.querySelector('.modal-close').addEventListener('click', () => {
        // Dispatch close event before hiding modal
        const closeEvent = new CustomEvent('popupClose', {
            detail: {
                postId: sessionStorage.getItem('currentPostId'),
                closeType: 'close_button'
            }
        });
        document.dispatchEvent(closeEvent);

        modal.classList.add('hidden');
        setTimeout(() => {
            modal.remove();
        }, 300); // Match transition duration
    });

    // Regenerate button handler
    modal.querySelector('.regenerate-btn').addEventListener('click', async () => {
        try {
            await handleCommentGeneration(null, true);
        } catch (error) {
            console.error('Error regenerating comments:', error);
            const errorMessage = modal.querySelector('.error-message');
            errorMessage.classList.remove('hidden');
        }
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // Dispatch outside click event before closing
            const clickEvent = new CustomEvent('popupOutsideClick', {
                detail: {
                    postId: sessionStorage.getItem('currentPostId'),
                    closeType: 'outside_click'
                }
            });
            document.dispatchEvent(clickEvent);

            modal.querySelector('.modal-close').click();
        }
    });

    document.body.appendChild(modal);
    return modal;
}

// Function to display comment options
function displayCommentOptions(comments, modal, button, postId, isRegeneration = false) {
    const commentsList = modal.querySelector('.comments-list');
    commentsList.innerHTML = '';
    
    comments.forEach((comment, index) => {
        const commentOption = document.createElement('div');
        commentOption.className = 'comment-option';
        
        // Get the tone from the type field, handle both formats
        let tone = 'Neutral';
        let toneClass = 'neutral';
        
        if (typeof comment === 'object') {
            if (comment.type) {
                // Handle detailed tone format like "Friendly (Informational)"
                const toneMatch = comment.type.match(/^(\w+)/);
                tone = comment.type; // Use full tone description
                toneClass = toneMatch ? toneMatch[1].toLowerCase() : 'neutral';
            } else if (comment.tone) {
                tone = comment.tone;
                toneClass = comment.tone.toLowerCase();
            }
        } else if (typeof comment === 'string') {
            // If it's a string, try to extract type from sessionStorage
            const storedComments = JSON.parse(sessionStorage.getItem('generatedComments') || '[]');
            const storedComment = storedComments[index];
            if (storedComment && storedComment.type) {
                tone = storedComment.type;
                const toneMatch = tone.match(/^(\w+)/);
                toneClass = toneMatch ? toneMatch[1].toLowerCase() : 'neutral';
            }
        }
        
        const commentText = typeof comment === 'object' ? comment.text : comment;
        
        commentOption.innerHTML = `
            <div class="comment-header">
                <span class="comment-tone ${toneClass}">${tone}</span>
            </div>
            <div class="comment-text">${commentText}</div>
            <button class="use-comment-button">Use this comment</button>
        `;
        
        const useButton = commentOption.querySelector('.use-comment-button');
        useButton.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            try {
                const commentText = this.parentElement.querySelector('.comment-text').textContent;
                const commentType = this.parentElement.querySelector('.comment-tone').textContent;
                
                // Find the comment box
                const commentBox = findCommentBox(button);
                if (!commentBox) {
                    showNotification('Could not find comment field. Please try again.', 'error');
                    return;
                }

                // Track comment usage
                if (window.analyticsObserver) {
                    window.analyticsObserver.trackCommentUsage('breakcold', {
                        postId,
                        commentIndex: index,
                        commentText,
                        commentType,
                        isRegenerated: isRegeneration
                    });
                }

                // Set the comment text
                commentBox.value = commentText;
                commentBox.dispatchEvent(new Event('input', { bubbles: true }));
                commentBox.focus();

                // Close the modal
                modal.classList.add('hidden');
                
                // Show success notification
                showNotification('Comment added successfully!', 'success');

            } catch (error) {
                console.error('Error using comment:', error);
                showNotification('Failed to use comment. Please try again.', 'error');
            }
        });
        
        commentsList.appendChild(commentOption);
    });
    
    if (!isRegeneration) {
        modal.classList.remove('hidden');
    }
}

// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles dynamically
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    });
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Function to find comment box
function findCommentBox(button) {
    if (!button) return null;
    
    // Try to find the comment box in various containers
    const containers = [
        button.closest('.relative'),
        button.closest('.comment-generator-container')?.parentElement,
        button.closest('.post-container, .feed-item')
    ].filter(Boolean);
    
    for (const container of containers) {
        const textarea = container.querySelector('textarea[placeholder*="comment" i], textarea[placeholder*="reply" i], textarea.comment-box');
        if (textarea) return textarea;
    }
    
    return null;
}

// Function to get post info
async function getPostInfo(button) {
    try {
        const postText = await getPostText(button);
        const postContainer = button instanceof Element ? 
            button.closest('.post-container, .feed-item') : 
            document.querySelector('.post-container, .feed-item');
        
        const postId = postContainer?.getAttribute('data-post-id') || crypto.randomUUID();
        
        if (!postText) {
            throw new Error('Could not extract post content');
        }

        return { text: postText, postId };
    } catch (error) {
        console.error('[AI Comment Generator] Error in getPostInfo:', error);
        throw error;
    }
}

// Function to get previous comments
function getPreviousComments(modal) {
    if (!modal) return [];
    
    const commentsList = modal.querySelector('.comments-list');
    if (!commentsList) return [];

    return Array.from(commentsList.querySelectorAll('.comment-option'))
        .map(option => ({
            text: option.querySelector('.comment-text')?.textContent || '',
            type: option.querySelector('.comment-tone')?.textContent || 'Neutral'
        }))
        .filter(comment => comment.text);
}

// Initialize button injection
function initializeButtonInjection() {
    // Initial injection
    document.querySelectorAll('textarea[placeholder*="Add a comment"]').forEach(injectButtonForCommentField);

    // Watch for new comment fields
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('textarea[placeholder*="Add a comment"]')) {
                            injectButtonForCommentField(node);
                        } else {
                            node.querySelectorAll('textarea[placeholder*="Add a comment"]').forEach(injectButtonForCommentField);
                        }
                    }
                });
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtonInjection);
} else {
    initializeButtonInjection();
}
