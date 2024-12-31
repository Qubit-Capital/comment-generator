// Debug configuration
const DEBUG = true;
const log = (...args) => DEBUG && console.log('[AI Comment Generator]', ...args);

// Copy the entire content.js from linkedin-comment-generator
const style = document.createElement('style');
style.textContent = `
    .comment-button {
        background-color: #0a66c2;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 14px;
        margin-right: 8px;
        margin-bottom: 8px;
    }
    
    .comment-button:hover {
        background-color: #004182;
    }

    .comment-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }

    .comment-modal.hidden {
        display: none;
    }

    .modal-content {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 18px;
        color: #333;
    }

    .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }

    .comment-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .comment-option {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .comment-option:hover {
        background-color: #f5f5f5;
    }

    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 8px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

document.head.appendChild(style);

// Function to create comment modal
function createCommentModal() {
    const modal = document.createElement('div');
    modal.className = 'comment-modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Choose a Comment</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="comment-options"></div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    return modal;
}

// Function to display comment options
function displayCommentOptions(comments, modal, commentField) {
    const optionsContainer = modal.querySelector('.comment-options');
    optionsContainer.innerHTML = '';

    comments.forEach((comment) => {
        const option = document.createElement('div');
        option.className = 'comment-option';
        
        // Create type badge
        const typeBadge = document.createElement('span');
        typeBadge.className = 'comment-type';
        typeBadge.textContent = comment.type;
        
        // Create comment text
        const textSpan = document.createElement('span');
        textSpan.className = 'comment-text';
        textSpan.textContent = comment.text;
        
        // Add badge and text to option
        option.appendChild(typeBadge);
        option.appendChild(textSpan);
        
        option.addEventListener('click', () => {
            // Insert into Quill editor if it's the active editor
            if (commentField.classList.contains('ql-editor')) {
                const quill = Quill.find(commentField);
                if (quill) {
                    quill.clipboard.dangerouslyPasteHTML(0, comment.text);
                    quill.root.dispatchEvent(new Event('input', { bubbles: true }));
                }
            } else {
                // For regular input fields
                commentField.value = comment.text;
                commentField.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            modal.classList.add('hidden');

            // Focus the comment field
            commentField.focus();
        });
        
        optionsContainer.appendChild(option);
    });

    // Show the modal
    modal.classList.remove('hidden');

    // Add styles for the new elements if not already present
    if (!document.querySelector('#comment-option-styles')) {
        const style = document.createElement('style');
        style.id = 'comment-option-styles';
        style.textContent = `
            .comment-option {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding: 12px;
                border-bottom: 1px solid #e0e0e0;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .comment-option:hover {
                background-color: #f5f5f5;
            }
            
            .comment-type {
                font-size: 12px;
                font-weight: 600;
                color: #0a66c2;
                text-transform: uppercase;
            }
            
            .comment-text {
                font-size: 14px;
                color: #333;
                line-height: 1.4;
            }

            .comment-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            
            .comment-modal.hidden {
                display: none;
            }
            
            .modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .modal-header h2 {
                margin: 0;
                font-size: 18px;
                color: #333;
            }
            
            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to find active Quill editor
function findActiveQuillEditor() {
    log('Finding active Quill editor...');
    // Try to find the focused editor first
    const activeElement = document.activeElement;
    if (activeElement?.classList?.contains('ql-editor')) {
        log('Found active Quill editor through focus');
        return activeElement;
    }

    // Look for visible editors
    const editors = document.querySelectorAll('.ql-editor');
    for (const editor of editors) {
        const style = window.getComputedStyle(editor);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
            log('Found visible Quill editor');
            return editor;
        }
    }

    log('No active Quill editor found');
    return null;
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
    const existingButton = container.querySelector('.comment-button');
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
    button.addEventListener('click', () => handleCommentGeneration(commentField));
    toolbar.insertBefore(button, toolbar.firstChild);
    log('Button injected successfully');
}

// Function to check if we should inject button
function shouldInjectButton(field) {
    if (!field || !field.isConnected) {
        log('Field is invalid or not connected to DOM');
        return false;
    }

    // Check if field is visible
    const style = window.getComputedStyle(field);
    if (style.display === 'none' || style.visibility === 'hidden') {
        log('Field is not visible');
        return false;
    }

    // Check if field is editable
    if (field.getAttribute('contenteditable') === 'false' || field.disabled) {
        log('Field is not editable');
        return false;
    }

    // Check if button already exists
    const container = field.closest('.comments-comment-box') || 
                     field.closest('.editor-container') ||
                     field.parentElement;
    
    if (container?.querySelector('.comment-button')) {
        log('Button already exists for this field');
        return false;
    }

    return true;
}

// Function to create comment button
function createCommentButton() {
    const button = document.createElement('button');
    button.className = 'comment-button';
    button.innerHTML = 'Generate Comment';
    button.style.marginRight = '8px';
    return button;
}

// Function to handle comment generation
async function handleCommentGeneration(target) {
    log('Starting comment generation for:', target);
    
    const commentField = target.classList.contains('ql-editor') ? target : findActiveQuillEditor();
    if (!commentField) {
        log('Could not find comment field');
        showNotification('Could not find comment field. Please try again.', 'error');
        return;
    }

    const button = commentField.closest('.editor-container')?.querySelector('.comment-button') ||
                  commentField.closest('.comments-comment-box')?.querySelector('.comment-button');
    
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="loading-spinner"></span>Generating...';
    }

    try {
        // Find the post content
        const postElement = findPostElement(commentField);
        if (!postElement) {
            throw new Error('Could not find post content');
        }

        // Get the post text
        const postText = await getPostText(postElement);
        if (!postText) {
            throw new Error('Could not extract post text');
        }

        log('Extracted post text:', postText);

        // Get comment suggestions
        const comments = await fetchCommentSuggestions(postText);
        
        // Get or create modal
        const modal = createOrGetModal();
        
        // Display comments in modal
        displayCommentOptions(comments, modal, commentField);
        
        // Show the modal explicitly
        modal.classList.remove('hidden');

    } catch (error) {
        log('Error during comment generation:', error);
        showNotification(error.message || 'Failed to generate comments. Please try again.', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = 'Generate Comment';
        }
    }
}

// Function to find post element
function findPostElement(commentField) {
    log('Finding post element...');
    const possibleContainers = [
        // Main post containers
        '.feed-shared-update-v2',
        'article[data-id]',  // LinkedIn article posts
        '.feed-shared-update-v2__content',
        
        // Specific content type containers
        '.feed-shared-article',
        '.feed-shared-external-video',
        '.feed-shared-image',
        '.feed-shared-poll',
        '.feed-shared-document',
        '.feed-shared-update-v2__content-wrapper',
        
        // Generic containers
        'article',
        '.feed-shared-update'
    ];

    for (const selector of possibleContainers) {
        const container = commentField.closest(selector);
        if (container) {
            log('Found post container:', selector);
            // If we found a child container, try to get the main post container
            const mainContainer = container.closest('.feed-shared-update-v2') || container;
            log('Using container:', mainContainer.className);
            return mainContainer;
        }
    }

    // Fallback: try to find the closest article-like container
    log('No standard post container found, trying fallback method');
    let element = commentField.parentElement;
    while (element && element !== document.body) {
        if (element.querySelector('.feed-shared-text') || 
            element.querySelector('.feed-shared-update-v2__description') ||
            element.querySelector('.update-components-text')) {
            log('Found post container via fallback method');
            return element;
        }
        element = element.parentElement;
    }

    log('No post container found');
    return null;
}

// Utility function to wait for content to load
async function waitForContent(element, maxAttempts = 10, interval = 1000) {
    log('Waiting for content to load...');
    for (let i = 0; i < maxAttempts; i++) {
        const hasContent = element.textContent.trim().length > 0;
        if (hasContent) {
            log('Content loaded successfully');
            return true;
        }
        log(`Attempt ${i + 1}/${maxAttempts}: Waiting for content...`);
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    log('Content loading timed out');
    return false;
}

// Function to safely load extension resources
function loadExtensionResource(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => {
            log(`Failed to load resource: ${url}`);
            resolve(null); // Resolve with null instead of rejecting to prevent error spam
        };
        img.src = url;
    });
}

// Function to get post text
async function getPostText(postElement) {
    log('Extracting post text from:', postElement);
    
    // Wait for content to load
    const contentLoaded = await waitForContent(postElement);
    if (!contentLoaded) {
        log('Warning: Content did not load within timeout period');
    }
    
    // Define priority ordered selectors for main post content
    const mainContentSelectors = [
        // Main post text selectors (most specific first)
        '.feed-shared-update-v2__description-wrapper',
        '.feed-shared-update-v2__commentary',
        '.feed-shared-text-view span[dir="ltr"]',
        '.feed-shared-text',
        '.update-components-text',
        
        // Article content
        '.feed-shared-article__description',
        '.feed-shared-article__title',
        
        // Document content
        '.feed-shared-document__description',
        '.feed-shared-document__title',
        
        // Other content types
        '.feed-shared-poll__question',
        '.feed-shared-mini-update-v2__description',
        '.feed-shared-update-v2__update-content-text'
    ];
    
    let postText = '';
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!postText && attempts < maxAttempts) {
        attempts++;
        log(`Extraction attempt ${attempts}/${maxAttempts}`);
        
        // Try each selector in priority order
        for (const selector of mainContentSelectors) {
            try {
                const elements = postElement.querySelectorAll(selector);
                log(`Checking selector "${selector}": found ${elements.length} elements`);
                
                for (const element of elements) {
                    // Skip hidden elements
                    if (!isElementVisible(element)) continue;
                    
                    // Get text content while filtering out unwanted elements
                    const textNodes = Array.from(element.childNodes)
                        .filter(node => {
                            // Keep text nodes
                            if (node.nodeType === Node.TEXT_NODE) return true;
                            
                            // For element nodes, filter out unwanted elements
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Skip buttons, links, images, and other interactive elements
                                const isUnwanted = node.matches(
                                    'button, a, img, [role="button"], ' +
                                    '[class*="cursor-pointer"], [class*="button"], ' +
                                    '[class*="icon"], [class*="emoji"], [class*="reaction"]'
                                );
                                
                                // Skip elements with specific alt texts
                                const altText = node.getAttribute('alt') || '';
                                const hasUnwantedAlt = altText.includes('emoji') || 
                                                     altText.includes('view') || 
                                                     altText.includes('image');
                                
                                return !(isUnwanted || hasUnwantedAlt);
                            }
                            return false;
                        })
                        .map(node => node.textContent.trim())
                        .filter(text => {
                            // Filter out common UI text and unwanted content
                            const unwantedPhrases = [
                                'Activate to view',
                                'Click to view',
                                'View full post',
                                'Show more',
                                'Show less',
                                'reactions',
                                'comment',
                                'like',
                                'share'
                            ];
                            return text && !unwantedPhrases.some(phrase => 
                                text.toLowerCase().includes(phrase.toLowerCase())
                            );
                        });
                    
                    const elementText = textNodes.join(' ');
                    if (elementText) {
                        log(`Found text in "${selector}":`, elementText.substring(0, 50) + '...');
                        postText += ' ' + elementText;
                    }
                }
                
                if (postText.trim()) {
                    break;
                }
            } catch (error) {
                log(`Error checking selector "${selector}":`, error);
                continue;
            }
        }
        
        if (!postText.trim() && attempts < maxAttempts) {
            log('No text found, waiting before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Clean up the text
    postText = postText.trim()
        .replace(/\s+/g, ' ')
        .replace(/[^\S\r\n]+/g, ' ')
        .replace(/\n+/g, ' ')
        .substring(0, 1000);
    
    log('Final extracted text length:', postText.length);
    if (postText.length > 0) {
        log('Text preview:', postText.substring(0, 100) + '...');
    } else {
        log('Warning: No text could be extracted from the post');
    }
    
    return postText;
}

// Helper function to check if an element is visible
function isElementVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetParent !== null;
}

// Function to preprocess post text
function preprocessPostText(text) {
    // Remove URLs
    text = text.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
    
    // Remove hashtags
    text = text.replace(/#\w+/g, '');
    
    // Remove mentions
    text = text.replace(/@\w+/g, '');
    
    // Remove multiple spaces and newlines
    text = text.replace(/\s+/g, ' ');
    
    // Trim and limit length
    text = text.trim().substring(0, 500);
    
    return text;
}

// Function to fetch comment suggestions
async function fetchCommentSuggestions(postText) {
    const API_CONFIG = {
        studioId: 'e24e0d8f-55bc-42b3-b4c0-ef86b7f9746c',
        projectId: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
        baseUrl: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios'
    };
    
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.studioId}/trigger_limited`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    params: {
                        linked_in_post: postText
                    },
                    project: API_CONFIG.projectId
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            log('API Response:', data);

            if (!data.output || !data.output.answer) {
                throw new Error('Invalid API response format');
            }

            let parsedAnswer = JSON.parse(data.output.answer.replace(/```json\n?|\n?```/g, '').trim());
            log('Parsed Answer:', parsedAnswer);

            if (!parsedAnswer || !Array.isArray(parsedAnswer.comments)) {
                throw new Error('Invalid comments data format');
            }

            return parsedAnswer.comments;

        } catch (error) {
            log(`Error in attempt ${attempt}:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

// Function to create or get modal
function createOrGetModal() {
    let modal = document.querySelector('.comment-modal');
    if (!modal) {
        modal = createCommentModal();
    }
    return modal;
}

// Function to show notification
function showNotification(message, type = 'info') {
    // You can implement a custom notification UI here
    console.log(`${type.toUpperCase()}: ${message}`);
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
