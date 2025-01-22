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
                    <button class="regenerate-btn" title="Regenerate Comments">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Regenerate</span>
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
            <div class="error-message hidden">
                <p>Sorry, there was an error generating comments. Please try again.</p>
                <button class="retry-btn">Retry</button>
            </div>
            <div class="comments-list"></div>
        </div>
    `;
    return modal;
}

// Function to create comment modal
function createCommentModal(button) {
    const modal = document.createElement('div');
    modal.className = 'comment-modal linkedin hidden';
    
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
        modal.classList.add('hidden');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });

    // Regenerate button handler
    modal.querySelector('.regenerate-btn').addEventListener('click', async () => {
        try {
            const originalButton = document.querySelector(modal.dataset.originalButton);
            await handleCommentGeneration(originalButton || modal.querySelector('.comment-generator-button'), true);
        } catch (error) {
            console.error('Error regenerating comments:', error);
            const errorMessage = modal.querySelector('.error-message');
            errorMessage.textContent = error.message || 'Failed to regenerate comments. Please try again.';
            errorMessage.classList.remove('hidden');
        }
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

// Function to get post text and ID
async function getPostInfo(button) {
    try {
        let text = '';
        let postId = '';

        // Find the post container
        const postContainer = button.closest('.feed-shared-update-v2') || 
                            button.closest('.feed-shared-post') ||
                            button.closest('.feed-shared-update');

        if (!postContainer) {
            throw new Error('Could not find post container');
        }

        // Get post ID
        postId = postContainer.getAttribute('data-id') || 
                postContainer.getAttribute('data-urn') || 
                `post_${Date.now()}`;

        // Find post text
        const textContainer = postContainer.querySelector('.feed-shared-text') || 
                            postContainer.querySelector('.feed-shared-text-view') ||
                            postContainer.querySelector('.feed-shared-inline-show-more-text');

        if (textContainer) {
            text = textContainer.textContent.trim();
        }

        // If no text found, try other selectors
        if (!text) {
            const alternateTextContainer = postContainer.querySelector('.feed-shared-update-v2__description-wrapper') ||
                                        postContainer.querySelector('.feed-shared-update__description-wrapper');
            if (alternateTextContainer) {
                text = alternateTextContainer.textContent.trim();
            }
        }

        // If still no text, use a default message
        if (!text) {
            text = 'No post text found. Please generate a general comment.';
        }

        return { text, postId };
    } catch (error) {
        console.error('Error getting post info:', error);
        return {
            text: 'No post text found. Please generate a general comment.',
            postId: `post_${Date.now()}`
        };
    }
}

// Function to get previous comments from modal
function getPreviousComments(modal) {
    const commentsList = modal.querySelector('.comments-list');
    if (!commentsList) return [];

    return Array.from(commentsList.querySelectorAll('.comment-option'))
        .map(option => ({
            text: option.querySelector('.comment-text').textContent,
            type: option.querySelector('.comment-tone').textContent
        }));
}

// Function to handle comment generation
async function handleCommentGeneration(button, isRegeneration = false) {
    const modal = document.querySelector('.comment-modal.linkedin');
    if (!modal) return;

    const loadingContainer = modal.querySelector('.loading-container');
    const errorMessage = modal.querySelector('.error-message');
    const commentsList = modal.querySelector('.comments-list');

    try {
        // Reset state
        loadingContainer.style.display = 'block';
        commentsList.style.display = 'none';
        errorMessage.classList.add('hidden');

        // Get post info
        const { text: postText, postId } = await getPostInfo(button);

        // Generate comments using CommentAPI
        const comments = await window.CommentAPI.generateComments(postText, 'linkedin');
        
        if (!comments.success) {
            throw new Error(comments.error || 'Failed to generate comments');
        }

        loadingContainer.style.display = 'none';
        commentsList.style.display = 'block';
        
        // Display comments with proper structure and type
        const formattedComments = comments.comments.map(comment => {
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

        displayCommentOptions(formattedComments, modal, button, postId, isRegeneration);
        
    } catch (error) {
        console.error('Error generating comments:', error);
        if (modal) {
            loadingContainer.style.display = 'none';
            errorMessage.classList.remove('hidden');
            errorMessage.textContent = error.message || 'Failed to generate comments. Please try again.';
        }
    }
}

// Function to display comment options
function displayCommentOptions(comments, modal, button, postId, isRegeneration = false) {
    const commentsList = modal.querySelector('.comments-list');
    commentsList.innerHTML = '';

    comments.forEach((comment, index) => {
        const commentOption = document.createElement('div');
        commentOption.className = 'comment-option';
        
        // Get CSS class for tone
        const toneClass = comment.type.toLowerCase();
        
        commentOption.innerHTML = `
            <div class="comment-header">
                <span class="comment-tone ${toneClass}">${comment.type}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
            <div class="comment-actions">
                <button class="use-comment-btn">Use this comment</button>
            </div>
        `;

        // Handle comment selection
        const useButton = commentOption.querySelector('.use-comment-btn');
        useButton.addEventListener('click', async () => {
            try {
                const commentField = findCommentField(button);
                if (commentField) {
                    insertComment(commentField, comment.text);
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

        commentsList.appendChild(commentOption);
    });
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
    button.addEventListener('click', async () => {
        // Create modal if it doesn't exist
        let modal = document.querySelector('.comment-modal.linkedin');
        if (!modal) {
            modal = createCommentModal(button);
            document.body.appendChild(modal);
        }
        handleCommentGeneration(button);
    });
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
