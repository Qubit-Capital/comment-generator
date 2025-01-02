// Debug configuration
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AI Comment Generator]', ...args);

// Function to create modal HTML
function createModalHTML() {
    const modal = document.createElement('div');
    modal.className = 'ai-comment-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Generated Comments</h2>
                <div class="header-actions">
                    <button class="analytics-btn" title="View Analytics">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        Analytics
                    </button>
                    <button class="close-modal">×</button>
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
    return modal;
}

// Function to create comment modal
function createCommentModal() {
    const modal = document.createElement('div');
    modal.className = 'comment-modal linkedin hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Generated Comments</h2>
                <div class="header-buttons">
                    <button class="analytics-btn" title="View Analytics">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                        <span>Analytics</span>
                    </button>
                    <button class="modal-close" aria-label="Close">×</button>
                </div>
            </div>
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">Generating comments...</div>
            </div>
            <div class="error-message hidden">
                Failed to generate comments. Please try again.
            </div>
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
        }, 300);
    });

    // Analytics button handler
    modal.querySelector('.analytics-btn').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'OPEN_ANALYTICS' });
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

// Function to handle comment generation
async function handleCommentGeneration(button) {
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
        const comments = await window.CommentAPI.generateComments(postText, 'linkedin');
        
        // Track comment generation
        await window.analyticsObserver.trackCommentGeneration('linkedin', postText, comments);
        
        loadingContainer.style.display = 'none';
        commentsList.style.display = 'block';
        
        displayCommentOptions(comments, modal, button);
        
    } catch (error) {
        console.error('Error generating comments:', error);
        const modal = document.querySelector('.comment-modal.linkedin');
        if (modal) {
            const loadingContainer = modal.querySelector('.loading-container');
            const errorMessage = modal.querySelector('.error-message');
            
            loadingContainer.style.display = 'none';
            errorMessage.classList.remove('hidden');
        }
    }
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
        useButton.addEventListener('click', () => {
            const commentField = findCommentField(button);
            if (commentField) {
                insertComment(commentField, comment.text || comment);
                modal.classList.add('hidden');
                showNotification('Comment added successfully!', 'success');
                
                // Track comment usage
                window.analyticsObserver.trackCommentUsage('linkedin', index, comment.text || comment);
            } else {
                showNotification('Could not find comment field. Please try again.', 'error');
            }
        });
        
        commentsList.appendChild(option);
    });
    
    modal.classList.remove('hidden');
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

// Function to insert comment into the comment field
function insertComment(commentField, text) {
    if (!commentField || !text) return;

    // Set the text content
    commentField.textContent = text;
    
    // Dispatch necessary events to trigger LinkedIn's internal handlers
    commentField.dispatchEvent(new Event('input', { bubbles: true }));
    commentField.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Focus the field to make it ready for posting
    commentField.focus();
}

// Function to find comment field
function findCommentField(button) {
    // First try to find the comment field within the post container
    const postContainer = button.closest('.feed-shared-update-v2') || 
                         button.closest('.feed-shared-post') ||
                         button.closest('.feed-shared-update');
                         
    if (!postContainer) return null;

    // Try different selectors for the comment field
    const commentFieldSelectors = [
        'div[contenteditable="true"]',
        'div[role="textbox"]',
        '.comments-comment-box__form-container div[contenteditable="true"]',
        '.comments-comment-texteditor__content',
        '.comments-comment-box-comment__text-editor',
        'div[data-placeholder="Add a comment…"]',
        '.ql-editor'
    ];

    for (const selector of commentFieldSelectors) {
        const field = postContainer.querySelector(selector);
        if (field) return field;
    }

    return null;
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
