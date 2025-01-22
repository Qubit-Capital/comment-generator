// Shared utilities for both LinkedIn and Breakcold
class CommentUtils {
    constructor() {
        this.DEBUG = process.env.NODE_ENV !== 'production';
    }

    log(...args) {
        if (this.DEBUG) {
            console.log('[AI Comment Utils]', ...args);
        }
    }

    handleError(error, context) {
        console.error(`[AI Comment Utils] ${context}:`, error);
        // Show user-friendly error message if needed
        const errorContainer = document.querySelector('.ai-error-message');
        if (errorContainer) {
            errorContainer.textContent = this.getUserFriendlyError(error);
            errorContainer.style.display = 'block';
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        }
    }

    getUserFriendlyError(error) {
        const messages = {
            'button': 'Failed to create comment button. Please refresh the page.',
            'container': 'Failed to create comments container. Please refresh the page.',
            'comment': 'Failed to process comment. Please try again.',
            'default': 'An error occurred. Please try again.'
        };
        return messages[error.type] || messages.default;
    }

    createCommentButton() {
        try {
            this.log('Creating comment button');
            const button = document.createElement('button');
            button.className = 'ai-comment-generator-btn comment-button';
            button.innerHTML = `
                <span class="btn-icon">💡</span>
                <span class="btn-text">Generate AI Comments</span>
            `;
            return button;
        } catch (error) {
            this.handleError(error, 'button');
            return null;
        }
    }

    createCommentsContainer() {
        try {
            this.log('Creating comments container');
            const container = document.createElement('div');
            container.className = 'ai-comments-container';
            container.style.display = 'none';
            
            // Add error message container
            const errorContainer = document.createElement('div');
            errorContainer.className = 'ai-error-message';
            errorContainer.style.display = 'none';
            container.appendChild(errorContainer);
            
            return container;
        } catch (error) {
            this.handleError(error, 'container');
            return null;
        }
    }

    createCommentElement(comment) {
        try {
            if (!comment || typeof comment !== 'string') {
                throw new Error('Invalid comment data');
            }

            const commentEl = document.createElement('div');
            commentEl.className = 'ai-generated-comment';
            commentEl.innerHTML = `
                <div class="comment-text">${this.escapeHtml(comment)}</div>
                <button class="use-comment-btn">Use</button>
            `;

            // Add click handler for the use button
            const useButton = commentEl.querySelector('.use-comment-btn');
            useButton.addEventListener('click', () => {
                this.insertComment(comment);
            });

            return commentEl;
        } catch (error) {
            this.handleError(error, 'comment');
            return null;
        }
    }

    insertComment(comment) {
        try {
            const textArea = this.findActiveTextArea();
            if (textArea) {
                textArea.value = comment;
                textArea.dispatchEvent(new Event('input', { bubbles: true }));
                this.log('Comment inserted successfully');
            } else {
                throw new Error('No active text area found');
            }
        } catch (error) {
            this.handleError(error, 'insertion');
        }
    }

    findActiveTextArea() {
        // Implementation depends on the platform (LinkedIn or Breakcold)
        return document.querySelector('textarea:focus') || 
               document.querySelector('.comment-box textarea') ||
               document.querySelector('.post-comment-input');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export as global variable to be used by content scripts
window.CommentUtils = new CommentUtils();
