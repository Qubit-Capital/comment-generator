// Debug configuration
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AI Comment Generator]', ...args);

// Function to create modal HTML
function createModalHTML() {
    const modal = document.createElement('div');
    modal.className = 'comment-modal linkedin';
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
            <div class="loading-container">
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

// Function to create and show modal
function showModal(button) {
    // Remove any existing modals
    const existingModal = document.querySelector('.comment-modal.linkedin');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = createModalHTML();
    document.body.appendChild(modal);

    // Store a reference to the button that opened the modal
    modal.dataset.buttonId = button.id || `comment-btn-${Date.now()}`;
    if (!button.id) {
        button.id = modal.dataset.buttonId;
    }

    // Add event listeners
    const closeBtn = modal.querySelector('.close-modal');
    const regenerateBtn = modal.querySelector('.regenerate-btn');
    const retryBtn = modal.querySelector('.retry-btn');

    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    regenerateBtn.addEventListener('click', async () => {
        try {
            await handleCommentGeneration(button, true);
        } catch (error) {
            console.error('Error regenerating comments:', error);
            const errorMessage = modal.querySelector('.error-message');
            errorMessage.classList.remove('hidden');
            errorMessage.querySelector('p').textContent = 'Failed to regenerate comments. Please try again.';
        }
    });

    retryBtn.addEventListener('click', async () => {
        const errorMessage = modal.querySelector('.error-message');
        errorMessage.classList.add('hidden');
        await handleCommentGeneration(button, false);
    });

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
    log('Getting post info...');
    try {
        let text = '';
        let postId = '';
        let linkedinUrn = '';
        let targetProfileUrl = '';

        // Find the post container
        const postContainer = button.closest('.feed-shared-update-v2') || 
                            button.closest('.feed-shared-post') ||
                            button.closest('.feed-shared-update');
                         
        log('Post container found:', !!postContainer);
        
        if (!postContainer) {
            throw new Error('Could not find post container');
        }

        // Extract full URN and numeric part
        const fullUrn = postContainer.getAttribute('data-urn') || 
                        postContainer.getAttribute('data-id') || 
                        `post_${Date.now()}`;
        
        // Extract numeric part of URN using regex
        const urnMatch = fullUrn.match(/\d+$/);
        linkedinUrn = urnMatch ? urnMatch[0] : '';
        
        log('Full URN:', fullUrn);
        log('Extracted LinkedIn URN:', linkedinUrn);

        // Find post text (kept for potential future use or fallback)
        const textContainer = postContainer.querySelector('.feed-shared-text') || 
                            postContainer.querySelector('.feed-shared-text-view') ||
                            postContainer.querySelector('.feed-shared-inline-show-more-text');

        log('Text container found:', !!textContainer);
        
        if (textContainer) {
            text = textContainer.textContent.trim();
            log('Text content length:', text.length);
        }

        // If no text found, try other selectors
        if (!text) {
            log('No text found in primary container, trying alternates...');
            const alternateTextContainer = postContainer.querySelector('.feed-shared-update-v2__description-wrapper') ||
                                        postContainer.querySelector('.feed-shared-update__description-wrapper');
            if (alternateTextContainer) {
                text = alternateTextContainer.textContent.trim();
                log('Alternate text content length:', text.length);
            }
        }

        // If still no text, use a default message
        if (!text) {
            log('No text found in any container');
            text = 'No post text found. Please generate a general comment.';
        }

        // Extract the target profile URL
        const targetProfileElement = postContainer.querySelector('a.update-components-actor__meta-link');
        targetProfileUrl = targetProfileElement ? targetProfileElement.href : null;

        return { 
            text, 
            postId: fullUrn, 
            linkedinUrn, 
            targetProfileUrl 
        };
    } catch (error) {
        log('Error getting post info:', error);
        return {
            text: 'No post text found. Please generate a general comment.',
            postId: `post_${Date.now()}`,
            linkedinUrn: '',
            targetProfileUrl: null
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

    // Try to find the comment field
    const commentField = postContainer.querySelector('[contenteditable="true"][role="textbox"]') ||
                        postContainer.querySelector('[contenteditable="true"].comments-comment-box__text-editor');
    
    return commentField;
}

// Function to handle comment generation
async function handleCommentGeneration(button, isRegeneration = false) {
    let modal = document.querySelector('.comment-modal.linkedin');
    
    try {
        // Create modal if it doesn't exist
        if (!modal) {
            modal = createModalHTML();
            document.body.appendChild(modal);
        }

        // Show modal and set initial state
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.classList.add('loading');

        const loadingContainer = modal.querySelector('.loading-container');
        const errorMessage = modal.querySelector('.error-message');
        const commentsList = modal.querySelector('.comments-list');

        if (!loadingContainer || !errorMessage || !commentsList) {
            throw new Error('Modal elements not properly initialized');
        }

        // Reset modal state
        loadingContainer.style.display = 'flex';
        commentsList.style.display = 'none';
        commentsList.classList.remove('visible');
        errorMessage.classList.remove('visible');

        // Get post info
        log('Getting post info...');
        const { text: postText, postId, linkedinUrn, targetProfileUrl } = await getPostInfo(button);
        log('Post info:', { postText: postText.substring(0, 100) + '...', postId, linkedinUrn, targetProfileUrl });
        
        if (!window.CommentAPI) {
            throw new Error('Comment API not initialized');
        }

        // Gather interaction data and send to background
        const interactionData = {
            postMeta: { 
                postText, 
                postId, 
                linkedinUrn,
                targetProfileUrl 
            },
            platform: 'linkedin',
            timestamp: Date.now()
        };
        
        // Call the server interaction function
        sendLinkedinInteraction(interactionData);
        
        log('server testing:', interactionData);
        chrome.runtime.sendMessage({ type: 'GENERATE_COMMENTS', data: interactionData }, (response) => {
            console.log('Interaction data sent', response);
        });

        // Generate comments
        log('Generating comments...');
        const result = await window.CommentAPI.generateComments(
            postText, 
            'linkedin', 
            linkedinUrn
        );

        if (!result.success || !Array.isArray(result.comments)) {
            throw new Error(result.error || 'Failed to generate comments');
        }

        // Hide loading state and show comments
        loadingContainer.style.display = 'none';
        commentsList.style.display = 'block';
        commentsList.classList.add('visible');

        // Display comments
        log('Comments generated:', result.comments);
        displayCommentOptions(result.comments, modal, button, postId, isRegeneration);

    } catch (error) {
        log('Comment generation error:', error);
        
        if (modal) {
            const loadingContainer = modal.querySelector('.loading-container');
            const errorMessage = modal.querySelector('.error-message');
            
            if (loadingContainer) {
                loadingContainer.style.display = 'none';
            }
            
            if (errorMessage) {
                errorMessage.classList.add('visible');
                errorMessage.innerHTML = `
                    <p>${error.message || 'Failed to generate comments. Please try again.'}</p>
                    <button class="retry-btn">Retry</button>
                `;

                // Add retry button handler
                const retryBtn = errorMessage.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', () => {
                        errorMessage.classList.remove('visible');
                        handleCommentGeneration(button, isRegeneration);
                    });
                }
            }
        }

        // Show notification
        showNotification(
            error.message || 'Failed to generate comments', 
            'error'
        );
    } finally {
        // Remove loading state but keep modal visible
        if (modal) {
            modal.classList.remove('loading');
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
        
        // Get CSS class for tone (convert to lowercase and handle spaces)
        const toneClass = comment.type.toLowerCase().replace(/\s+/g, '-');
        
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
            const commentField = findCommentField(button);
            if (commentField) {
                insertComment(commentField, comment.text);
                modal.classList.add('hidden');
                modal.classList.remove('active');

                // Show success notification
                showNotification('Comment added successfully!', 'success');
            } else {
                showNotification('Could not find comment field. Please try again.', 'error');
            }
        });

        commentsList.appendChild(commentOption);
    });

    // Add regenerate button if not already present
    let headerActions = modal.querySelector('.header-actions');
    if (!headerActions) {
        headerActions = document.createElement('div');
        headerActions.className = 'header-actions';
        modal.querySelector('.modal-header').appendChild(headerActions);
    }

    // Check if regenerate button exists
    if (!headerActions.querySelector('.regenerate-btn')) {
        const regenerateBtn = document.createElement('button');
        regenerateBtn.className = 'regenerate-btn';
        regenerateBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Regenerate</span>
        `;
        regenerateBtn.addEventListener('click', () => {
            handleCommentGeneration(button, true);
        });
        headerActions.insertBefore(regenerateBtn, headerActions.firstChild);
    }

    // Add close button if not present
    if (!headerActions.querySelector('.close-modal')) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-modal';
        closeBtn.textContent = '×';
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            modal.classList.remove('active');
        });
        headerActions.appendChild(closeBtn);
    }
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
    button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        log('Generate comment button clicked');
        
        try {
            // First create and show the modal
            const modal = showModal(button);
            // Ensure modal is visible
            modal.style.display = 'flex';
            // Then start comment generation
            await handleCommentGeneration(button);
        } catch (error) {
            log('Error in button click handler:', error);
            showNotification('Failed to generate comments. Please try again.', 'error');
        }
    });
    toolbar.insertBefore(button, toolbar.firstChild);
    log('Button injected successfully');
}

// Function to create comment button
function createCommentButton() {
    const button = document.createElement('button');
    button.className = 'ai-comment-generator-btn';
    button.innerHTML = `
        <span class="btn-icon">✨</span>
        <span>Generate Comment</span>
    `;
    
    return button;
}

// Function to get user profile URL
function getTargetProfileUrl() {
    const profileLink = document.querySelector('a[data-control-name="nav_profile"]');
    return profileLink ? profileLink.href : null;
}

// Initialize button injection using MutationObserver
function initializeButtonInjection() {
    const config = { childList: true, subtree: true };
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const commentFields = node.querySelectorAll('[contenteditable="true"][role="textbox"]');
                    commentFields.forEach((field) => {
                        if (shouldInjectButton(field)) {
                            injectButtonForCommentField(field);
                        }
                    });
                }
            });
        });
    });

    // Start observing
    observer.observe(document.body, config);

    // Initial scan for existing comment fields
    const commentFields = document.querySelectorAll('[contenteditable="true"][role="textbox"]');
    commentFields.forEach((field) => {
        if (shouldInjectButton(field)) {
            injectButtonForCommentField(field);
        }
    });
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtonInjection);
} else {
    initializeButtonInjection();
}
