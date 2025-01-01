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
async function handleCommentGeneration(event) {
    const button = event.target.closest('.comment-generator-button');
    if (!button) return;

    try {
        const modal = createCommentModal();
        modal.classList.remove('hidden');
        
        const loadingContainer = modal.querySelector('.loading-container');
        const commentsList = modal.querySelector('.comments-list');
        const errorMessage = modal.querySelector('.error-message');
        
        loadingContainer.style.display = 'flex';
        commentsList.style.display = 'none';
        errorMessage.classList.add('hidden');
        
        const postText = getPostText(button);
        const comments = await window.CommentAPI.generateComments(postText, 'breakcold');
        
        // Track comment generation
        await window.analyticsObserver.trackCommentGeneration('breakcold', postText, comments);
        
        loadingContainer.style.display = 'none';
        commentsList.style.display = 'block';
        
        displayCommentOptions(comments, modal, button);
        
    } catch (error) {
        console.error('Error generating comments:', error);
        const modal = document.querySelector('.comment-modal.breakcold');
        if (modal) {
            const loadingContainer = modal.querySelector('.loading-container');
            const errorMessage = modal.querySelector('.error-message');
            
            loadingContainer.style.display = 'none';
            errorMessage.classList.remove('hidden');
        }
    }
}

// Function to create comment modal
function createCommentModal() {
    const modal = document.createElement('div');
    modal.className = 'comment-modal breakcold hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Generated Comments</h2>
                <div class="header-buttons">
                    <button class="analytics-btn" title="View Analytics">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Analytics
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
        modal.classList.add('hidden');
        setTimeout(() => {
            modal.remove();
        }, 300); // Match transition duration
    });

    // Analytics button handler
    modal.querySelector('.analytics-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ 
            type: 'OPEN_ANALYTICS',
            data: { platform: 'breakcold' }
        });
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.querySelector('.modal-close').click();
        }
    });

    document.body.appendChild(modal);
    return modal;
}

// Function to display comment options
function displayCommentOptions(comments, modal, button) {
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
                // Track comment usage
                await window.analyticsObserver.trackCommentUsage('breakcold', index, comment.text || comment);
                
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
            }
        });
        
        commentsList.appendChild(option);
    });
    
    modal.classList.remove('hidden');
}

// Function to insert comment into the comment field
function insertComment(commentField, text) {
    if (!commentField || !text) return;
    
    // Set the text content
    commentField.textContent = text;
    
    // Dispatch necessary events
    commentField.dispatchEvent(new Event('input', { bubbles: true }));
    commentField.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Focus the field
    commentField.focus();
}

// Function to find comment field
function findCommentField(button) {
    const commentField = button.closest('.relative')?.querySelector('textarea');
    return commentField;
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
