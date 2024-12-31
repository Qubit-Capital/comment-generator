// Shared utilities for both LinkedIn and Breakcold
class CommentUtils {
    constructor() {
        this.DEBUG = true;
    }

    log(...args) {
        if (this.DEBUG) console.log('[AI Comment Utils]', ...args);
    }

    createCommentButton() {
        this.log('Creating comment button');
        const button = document.createElement('button');
        button.className = 'ai-comment-generator-btn comment-button';
        button.innerHTML = `
            <span class="btn-icon">💡</span>
            <span class="btn-text">Generate AI Comments</span>
        `;
        return button;
    }

    createCommentsContainer() {
        this.log('Creating comments container');
        const container = document.createElement('div');
        container.className = 'ai-comments-container';
        container.style.display = 'none';
        return container;
    }

    createCommentElement(comment) {
        if (!comment || typeof comment !== 'string') {
            this.log('Invalid comment:', comment);
            return null;
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
            this.log('Comment selected:', comment.substring(0, 50) + '...');
            const event = new CustomEvent('comment-selected', {
                detail: { comment }
            });
            document.dispatchEvent(event);
        });

        return commentEl;
    }

    showLoading(container) {
        if (!container) {
            this.log('No container provided for loading state');
            return;
        }

        this.log('Showing loading state');
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <div class="loading-text">Generating comments...</div>
            </div>
        `;
        container.style.display = 'block';
    }

    showError(container, message) {
        if (!container) {
            this.log('No container provided for error state');
            return;
        }

        this.log('Showing error:', message);
        container.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${this.escapeHtml(message || 'An error occurred')}</span>
            </div>
        `;
        container.style.display = 'block';
    }

    escapeHtml(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        this.log('Showing notification:', type, message);
        
        const notification = document.createElement('div');
        notification.className = `ai-notification ${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${type === 'error' ? '⚠️' : 'ℹ️'}</span>
            <span class="notification-message">${this.escapeHtml(message)}</span>
        `;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    insertTextIntoEditor(editor, text) {
        this.log('Inserting text into editor');
        
        try {
            // Handle Quill editor
            if (editor.classList.contains('ql-editor')) {
                const quill = editor.closest('.ql-container')?.__quill;
                if (quill) {
                    quill.focus();
                    const range = quill.getSelection() || { index: 0, length: 0 };
                    quill.insertText(range.index, text);
                    return true;
                }
            }

            // Handle contenteditable
            if (editor.getAttribute('contenteditable') === 'true') {
                editor.focus();
                document.execCommand('insertText', false, text);
                return true;
            }

            // Handle standard input/textarea
            if (editor instanceof HTMLInputElement || editor instanceof HTMLTextAreaElement) {
                const start = editor.selectionStart || 0;
                editor.value = editor.value.substring(0, start) + text + editor.value.substring(editor.selectionEnd || start);
                editor.selectionStart = editor.selectionEnd = start + text.length;
                return true;
            }

            throw new Error('Unsupported editor type');
        } catch (error) {
            this.log('Error inserting text:', error);
            return false;
        }
    }
}

// Export as global variable to be used by content scripts
window.CommentUtils = new CommentUtils();
