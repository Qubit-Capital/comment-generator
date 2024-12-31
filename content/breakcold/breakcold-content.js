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
        document.body.appendChild(modal);
        
        // Force reflow to trigger animation
        modal.offsetHeight;
        modal.classList.remove('hidden');

        const loadingContainer = modal.querySelector('.loading-container');
        const errorMessage = modal.querySelector('.error-message');
        
        loadingContainer.classList.remove('hidden');
        errorMessage.classList.add('hidden');

        const postText = getPostText(button);
        log('Successfully extracted post text:', postText);

        const comments = await window.CommentAPI.generateComments(postText, 'breakcold');
        
        loadingContainer.classList.add('hidden');
        displayCommentOptions(comments, modal);
        
    } catch (error) {
        log('Error generating comments:', error);
        const modal = document.querySelector('.comment-modal');
        if (modal) {
            const loadingContainer = modal.querySelector('.loading-container');
            const errorMessage = modal.querySelector('.error-message');
            
            loadingContainer.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            errorMessage.innerHTML = `
                <svg class="error-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                </svg>
                <span>Failed to generate comments. Please try again.</span>
            `;
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
                <button class="modal-close" aria-label="Close">×</button>
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
function displayCommentOptions(comments, modal) {
    const loadingContainer = modal.querySelector('.loading-container');
    const commentsList = modal.querySelector('.comments-list');
    const errorMessage = modal.querySelector('.error-message');
    
    // Hide loading and error states
    loadingContainer.classList.add('hidden');
    errorMessage.classList.add('hidden');
    commentsList.innerHTML = '';
    
    // Add regenerate button
    const actionButtons = document.createElement('div');
    actionButtons.className = 'action-buttons';
    actionButtons.innerHTML = `
        <button class="regenerate-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C9.29583 2 10.4957 2.40132 11.5 3.0863" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 3V8H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Regenerate Comments
        </button>
    `;

    // Add regenerate functionality
    const regenerateBtn = actionButtons.querySelector('.regenerate-btn');
    regenerateBtn.addEventListener('click', async () => {
        try {
            // Get post text again
            const button = document.querySelector('.comment-generator-button');
            const postText = getPostText(button);
            
            // Update loading text
            const loadingText = loadingContainer.querySelector('.loading-text');
            loadingText.textContent = 'Regenerating comments...';
            
            // Show loading state
            loadingContainer.classList.remove('hidden');
            commentsList.innerHTML = '';
            
            // Generate new comments
            const newComments = await window.CommentAPI.generateComments(postText, 'breakcold');
            displayCommentOptions(newComments, modal);
            
        } catch (error) {
            console.error('Error regenerating comments:', error);
            showNotification('Failed to regenerate comments', 'error');
        }
    });

    commentsList.appendChild(actionButtons);
    
    // Display comments
    comments.forEach((comment, index) => {
        const option = document.createElement('div');
        option.className = 'comment-option';
        
        option.innerHTML = `
            <div class="comment-text">${comment.text || comment}</div>
            <button class="use-comment-btn">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3332 4L5.99984 11.3333L2.6665 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Use this comment
            </button>
        `;
        
        const useButton = option.querySelector('.use-comment-btn');
        useButton.addEventListener('click', () => {
            const commentField = findCommentField(modal);
            if (commentField) {
                insertComment(commentField, comment.text || comment);
                // Add hidden class to trigger transition
                modal.classList.add('hidden');
                setTimeout(() => {
                    modal.remove();
                }, 300);
                showNotification('Comment added successfully!', 'success');
            } else {
                showNotification('Could not find comment field', 'error');
            }
        });
        
        commentsList.appendChild(option);
    });
}

// Function to insert comment
function insertComment(field, text) {
    if (!field || !text) return;
    
    // Set the value and dispatch input event
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Focus the field
    field.focus();
}

// Function to find comment field
function findCommentField(modal) {
    const button = document.querySelector('.comment-generator-button');
    if (!button) return null;
    
    // Find the closest input or textarea
    return button.closest('.relative')?.querySelector('textarea') || null;
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
