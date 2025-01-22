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
    let targetButton;
    if (isRegeneration) {
        const modal = document.querySelector('.comment-modal.breakcold');
        targetButton = modal.dataset.originalButton ? 
            document.querySelector(modal.dataset.originalButton) : 
            modal.querySelector('.comment-generator-button');
    } else {
        targetButton = event?.target?.closest('.comment-generator-button');
    }
    if (!targetButton && !isRegeneration) return;

    try {
        const modal = isRegeneration ? document.querySelector('.comment-modal.breakcold') : createCommentModal(targetButton);
        if (!isRegeneration) {
            modal.classList.remove('hidden');
        }
        
        const loadingContainer = modal.querySelector('.loading-container');
        const commentsList = modal.querySelector('.comments-list');
        const errorMessage = modal.querySelector('.error-message');
        
        loadingContainer.style.display = 'flex';
        if (!isRegeneration) {
            commentsList.style.display = 'none';
        }
        errorMessage.classList.add('hidden');
        
        const postText = getPostText(targetButton);
        const comments = await window.CommentAPI.generateComments(postText, 'breakcold');
        
        if (!comments.success) {
            throw new Error(comments.error || 'Failed to generate comments');
        }
        
        loadingContainer.style.display = 'none';
        commentsList.style.display = 'block';
        
        displayCommentOptions(comments.comments, modal, targetButton, isRegeneration);
        
    } catch (error) {
        console.error('Error generating comments:', error);
        const modal = document.querySelector('.comment-modal.breakcold');
        if (modal) {
            const loadingContainer = modal.querySelector('.loading-container');
            const errorMessage = modal.querySelector('.error-message');
            
            loadingContainer.style.display = 'none';
            errorMessage.classList.remove('hidden');
            errorMessage.textContent = error.message || 'Failed to generate comments. Please try again.';
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
function displayCommentOptions(comments, modal, button, isRegeneration = false) {
    const commentsList = modal.querySelector('.comments-list');
    commentsList.innerHTML = '';
    
    comments.forEach((comment, index) => {
        const option = document.createElement('div');
        option.className = 'comment-option';
        
        // Get the tone from the type field, handle both formats
        let tone = '';
        let toneClass = '';
        
        if (comment.type) {
            // Handle detailed tone format like "Friendly (Informational)"
            const toneMatch = comment.type.match(/^(\w+)/);
            tone = comment.type; // Use full tone description
            toneClass = toneMatch ? toneMatch[1].toLowerCase() : 'neutral';
        } else {
            tone = 'Neutral';
            toneClass = 'neutral';
        }
        
        option.innerHTML = `
            <div class="comment-header">
                <span class="comment-tone ${toneClass}">${tone}</span>
            </div>
            <div class="comment-text">${comment.text || comment}</div>
            <button class="use-comment-btn">Use this comment</button>
        `;
        
        const useButton = option.querySelector('.use-comment-btn');
        useButton.addEventListener('click', async () => {
            try {
                const commentField = findCommentField(button);
                if (commentField) {
                    insertComment(commentField, comment.text || comment);
                    modal.classList.add('hidden');
                    showNotification('Comment added successfully!', 'success');
                } else {
                    showNotification('Could not find comment field. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error using comment:', error);
                showNotification('Failed to use comment. Please try again.', 'error');
            }
        });
        
        commentsList.appendChild(option);
    });
    
    if (!isRegeneration) {
        modal.classList.remove('hidden');
    }
}

// Function to find comment field
function findCommentField(button) {
    // First try to find the textarea within the closest relative container
    const relativeContainer = button.closest('.relative');
    if (relativeContainer) {
        const textarea = relativeContainer.querySelector('textarea');
        if (textarea) return textarea;
    }

    // Fallback: Look for the closest comment field container
    const commentContainer = button.closest('.comment-generator-container')?.parentElement;
    if (commentContainer) {
        const textarea = commentContainer.querySelector('textarea');
        if (textarea) return textarea;
    }

    // Final fallback: Look for any textarea in the post container
    const postContainer = button.closest('.post-container, .feed-item');
    if (postContainer) {
        const textarea = postContainer.querySelector('textarea');
        if (textarea) return textarea;
    }

    return null;
}

// Function to insert comment
function insertComment(field, text) {
    if (!field || !text) return;
    
    // Set the value
    field.value = text;
    
    // Create and dispatch input event
    field.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Create and dispatch change event
    field.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Focus the field
    field.focus();
}

// Function to show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
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
