// Debug configuration
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AI Comment Generator]', ...args);

// Function to create comment modal
function createCommentModal() {
    const modal = document.createElement('div');
    modal.className = 'comment-modal linkedin hidden';
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

// Function to handle comment generation
async function handleCommentGeneration(button) {
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

        const comments = await window.CommentAPI.generateComments(postText, 'linkedin');
        
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
            const button = document.querySelector('.ai-comment-generator-btn');
            const postText = getPostText(button);
            
            // Update loading text
            const loadingText = loadingContainer.querySelector('.loading-text');
            loadingText.textContent = 'Regenerating comments...';
            
            // Show loading state
            loadingContainer.classList.remove('hidden');
            commentsList.innerHTML = '';
            
            // Generate new comments
            const newComments = await window.CommentAPI.generateComments(postText, 'linkedin');
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

// Function to get post text
function getPostText(button) {
    try {
        // Find the post container
        const postContainer = button.closest('.feed-shared-update-v2') || 
                            button.closest('.feed-shared-post') ||
                            button.closest('.feed-shared-update');
                            
        if (!postContainer) {
            throw new Error('Could not find post container');
        }

        // Try different possible post content selectors
        const contentSelectors = [
            '.feed-shared-update-v2__description',
            '.feed-shared-text-view',
            '.feed-shared-inline-show-more-text',
            '.feed-shared-update__description',
            '.update-components-text',
            '.feed-shared-text',
            '.feed-shared-article'
        ];
        
        for (const selector of contentSelectors) {
            const element = postContainer.querySelector(selector);
            if (element) {
                const text = element.textContent.trim();
                if (text) {
                    return text;
                }
            }
        }

        throw new Error('Could not find text container');
    } catch (error) {
        log('Error in getPostText:', error);
        throw error;
    }
}

// Function to insert comment
function insertComment(field, text) {
    if (!field || !text) return;
    
    // Set the value and dispatch input event
    field.value = text;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Focus the field
    field.focus();
}

// Function to find comment field
function findCommentField(modal) {
    const button = document.querySelector('.ai-comment-generator-btn');
    if (!button) return null;
    
    // Find the closest comment field
    return button.closest('.comments-comment-box')?.querySelector('.comments-comment-box-comment__text-editor') || null;
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

// Function to check if button should be injected
function shouldInjectButton(commentField) {
    // Skip if no comment field
    if (!commentField) return false;

    // Skip if field is not visible
    if (commentField.offsetParent === null) return false;

    // Skip if field is not editable
    if (commentField.getAttribute('contenteditable') !== 'true' && 
        !commentField.matches('.ql-editor') &&
        !commentField.matches('.comments-comment-box__input') &&
        !commentField.matches('.comments-comment-texteditor__input')) {
        return false;
    }

    return true;
}

// Function to inject button for comment field
function injectButtonForCommentField(commentField) {
    if (!shouldInjectButton(commentField)) {
        log('Skipping button injection - conditions not met');
        return;
    }
    
    log('Injecting button for comment field:', commentField);
    
    // Try multiple possible parent containers
    const container = 
        commentField.closest('.comments-comment-box') ||
        commentField.closest('.editor-container') ||
        commentField.closest('.comments-comment-texteditor') ||
        commentField.closest('.feed-shared-update-v2__comments-container') ||
        commentField.parentElement;
        
    if (!container) {
        log('Could not find suitable container for button');
        return;
    }
    
    // Look for existing button
    const existingButton = container.querySelector('.ai-comment-generator-btn');
    if (existingButton) {
        log('Button already exists');
        return;
    }
    
    // Look for or create toolbar
    let toolbar = container.querySelector('.editor-toolbar') ||
                 container.querySelector('.comments-comment-box__controls') ||
                 container.querySelector('.comments-comment-box-comment__controls');
                 
    if (!toolbar) {
        log('Creating new toolbar');
        toolbar = document.createElement('div');
        toolbar.className = 'editor-toolbar';
        commentField.parentElement.insertBefore(toolbar, commentField);
    }
    
    // Create and inject button
    const button = createCommentButton();
    button.addEventListener('click', () => handleCommentGeneration(button));
    toolbar.insertBefore(button, toolbar.firstChild);
    log('Button injected successfully');
}

// Function to create comment button
function createCommentButton() {
    const button = document.createElement('button');
    button.className = 'ai-comment-generator-btn';
    button.innerHTML = 'Generate Comment';
    button.style.marginRight = '8px';
    return button;
}

// Initialize button injection
function initializeButtonInjection() {
    const commentSelectors = [
        '.ql-editor',  // Quill editor
        '[contenteditable="true"][role="textbox"]',
        'div[data-placeholder="Add a comment…"]',
        '.comments-comment-box__input',
        '.comments-comment-texteditor__input'
    ];
    
    const selectorString = commentSelectors.join(', ');
    
    // Initial scan
    document.querySelectorAll(selectorString).forEach(injectButtonForCommentField);
    
    // Watch for new editors using MutationObserver
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Handle added nodes
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Check if the added node is an editor
                    if (node.matches?.(selectorString)) {
                        injectButtonForCommentField(node);
                    }
                    // Check child nodes
                    node.querySelectorAll?.(selectorString)?.forEach(injectButtonForCommentField);
                }
            });
            
            // Handle attribute changes that might reveal editors
            if (mutation.type === 'attributes' && 
                mutation.target.nodeType === Node.ELEMENT_NODE &&
                mutation.target.matches?.(selectorString)) {
                injectButtonForCommentField(mutation.target);
            }
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['contenteditable', 'data-placeholder', 'class']
    });
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtonInjection);
} else {
    initializeButtonInjection();
}
