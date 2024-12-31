// Copy the entire content.js from breakcold-comment-generator
const style = document.createElement('style');
style.textContent = `
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

    .modal-close:hover {
        color: #333;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
    }

    .loading-container.hidden {
        display: none;
    }

    .loading-spinner {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }

    .spinner-dot {
        width: 8px;
        height: 8px;
        background-color: #0a66c2;
        border-radius: 50%;
        animation: bounce 0.5s infinite alternate;
    }

    .spinner-dot:nth-child(2) {
        animation-delay: 0.1s;
    }

    .spinner-dot:nth-child(3) {
        animation-delay: 0.2s;
    }

    .spinner-dot:nth-child(4) {
        animation-delay: 0.3s;
    }

    @keyframes bounce {
        to {
            transform: translateY(-8px);
        }
    }

    .loading-text {
        color: #666;
        font-size: 14px;
    }

    .error-message {
        color: #d32f2f;
        padding: 12px;
        text-align: center;
        margin: 12px 0;
        background-color: #ffebee;
        border-radius: 4px;
    }

    .error-message.hidden {
        display: none;
    }

    .comments-container {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .comment-option {
        background-color: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    .comment-option:hover {
        background-color: #e0e0e0;
    }

    .comment-text {
        margin: 0;
        color: #333;
        font-size: 14px;
        line-height: 1.5;
    }

    .action-buttons {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        justify-content: flex-end;
    }

    .action-button {
        padding: 8px 16px;
        border: none;
        border-radius: 16px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
    }

    .regenerate-button {
        background-color: #0a66c2;
        color: white;
    }

    .regenerate-button:hover {
        background-color: #004182;
    }

    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .notification.info {
        background-color: #0a66c2;
    }

    .notification.error {
        background-color: #d32f2f;
    }

    .notification.success {
        background-color: #2e7d32;
    }
`;

document.head.appendChild(style);

// Function to get post text
function getPostText(button) {
    try {
        // Find the comment field container (parent of the button)
        const commentField = button.parentElement;
        if (!commentField) {
            throw new Error('Could not find comment field');
        }

        // Find the post container (the main post content)
        let currentElement = commentField;
        let postContainer = null;

        // Keep traversing up until we find the main post container
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
                // Keep text nodes
                if (node.nodeType === Node.TEXT_NODE) return true;
                // Skip buttons and interactive elements
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return !node.matches('button, a, [class*="cursor-pointer"]');
                }
                return false;
            })
            .map(node => node.textContent.trim())
            .filter(text => text)
            .join(' ');

        return textContent;
    } catch (error) {
        console.error('Error getting post text:', error);
        throw error;
    }
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
            console.log('API Response:', data);

            if (!data.output || !data.output.answer) {
                throw new Error('Invalid API response format');
            }

            let parsedAnswer = JSON.parse(data.output.answer.replace(/```json\n?|\n?```/g, '').trim());
            console.log('Parsed Answer:', parsedAnswer);

            if (!parsedAnswer || !Array.isArray(parsedAnswer.comments)) {
                throw new Error('Invalid comments data format');
            }

            return parsedAnswer.comments;

        } catch (error) {
            console.error(`Error in attempt ${attempt}:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

// Function to create comment button
function createCommentButton() {
    const button = document.createElement('button');
    button.className = 'comment-button';
    button.innerHTML = '💡 Generate Comment';
    button.style.cssText = `
        background-color: #0a66c2;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 16px;
        cursor: pointer;
        font-size: 14px;
        margin: 8px 0;
        display: flex;
        align-items: center;
    `;
    return button;
}

// Function to create comment modal
function createCommentModal() {
    const modal = document.createElement('div');
    modal.className = 'comment-modal hidden';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Generated Comments</h2>
                <button class="modal-close" aria-label="Close">×</button>
            </div>
            <div class="loading-container hidden">
                <div class="loading-spinner">
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                </div>
                <div class="loading-text">Generating comments...</div>
            </div>
            <div class="error-message hidden"></div>
            <div class="comments-list"></div>
        </div>
    `;

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    document.body.appendChild(modal);
    return modal;
}

// Function to handle comment generation
async function handleCommentGeneration(event) {
    const button = event.target;
    const modal = createOrGetModal();
    const loadingContainer = modal.querySelector('.loading-container');
    const errorMessage = modal.querySelector('.error-message');
    const commentsList = modal.querySelector('.comments-list');
    
    modal.classList.remove('hidden');
    loadingContainer.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    commentsList.innerHTML = '';
    
    try {
        const postText = getPostText(button);
        const comments = await fetchCommentSuggestions(postText);
        
        loadingContainer.classList.add('hidden');
        displayCommentOptions(comments, modal, findCommentField(button), postText);
        
    } catch (error) {
        console.error('Error generating comments:', error);
        loadingContainer.classList.add('hidden');
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    }
}

// Function to display comment options
function displayCommentOptions(comments, modal, commentField, postText) {
    const commentsList = modal.querySelector('.comments-list');
    commentsList.innerHTML = '';
    
    const commentsContainer = document.createElement('div');
    commentsContainer.className = 'comments-container';
    
    comments.forEach((comment, index) => {
        const commentOption = document.createElement('div');
        commentOption.className = 'comment-option';
        commentOption.innerHTML = `<p class="comment-text">${comment}</p>`;
        
        commentOption.addEventListener('click', () => {
            if (commentField) {
                commentField.value = comment;
                commentField.dispatchEvent(new Event('input', { bubbles: true }));
                modal.classList.add('hidden');
                showNotification('Comment inserted successfully!', 'success');
            }
        });
        
        commentsContainer.appendChild(commentOption);
    });
    
    const actionButtonsContainer = document.createElement('div');
    actionButtonsContainer.className = 'action-buttons';
    
    const regenerateButton = document.createElement('button');
    regenerateButton.className = 'action-button regenerate-button';
    regenerateButton.textContent = 'Regenerate Comments';
    regenerateButton.addEventListener('click', async () => {
        try {
            const comments = await fetchCommentSuggestions(postText);
            displayCommentOptions(comments, modal, commentField, postText);
        } catch (error) {
            console.error('Error regenerating comments:', error);
            showNotification('Failed to regenerate comments', 'error');
        }
    });
    
    actionButtonsContainer.appendChild(regenerateButton);
    commentsContainer.appendChild(actionButtonsContainer);
    commentsList.appendChild(commentsContainer);
}

// Function to find comment field
function findCommentField(button) {
    return button.parentElement.querySelector('.comment-input');
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
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to inject button for comment field
function injectButtonForCommentField(commentField) {
    if (!shouldInjectButton(commentField)) return;
    
    const button = createCommentButton();
    commentField.parentElement.insertBefore(button, commentField);
    
    button.addEventListener('click', handleCommentGeneration);
}

// Function to check if we should inject button
function shouldInjectButton(field) {
    if (!field || !field.parentElement) return false;
    if (field.parentElement.querySelector('.comment-button')) return false;
    return true;
}

// Initialize button injection
function initializeButtonInjection() {
    // Initial injection for existing comment fields
    document.querySelectorAll('.comment-input').forEach(injectButtonForCommentField);
    
    // Watch for new comment fields
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.matches('.comment-input')) {
                        injectButtonForCommentField(node);
                    } else {
                        node.querySelectorAll('.comment-input').forEach(injectButtonForCommentField);
                    }
                }
            });
        });
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
