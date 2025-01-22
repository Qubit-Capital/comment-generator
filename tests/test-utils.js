// Test utilities for Comment Generator

export class TestUtils {
    /**
     * Simulates a comment field environment
     * @param {string} platform - 'linkedin' or 'breakcold'
     * @returns {HTMLElement} The created comment field
     */
    static createMockCommentField(platform) {
        const field = document.createElement('div');
        field.contentEditable = true;
        field.className = platform === 'linkedin' ? 'comments-comment-box' : 'breakcold-comment-field';
        field.setAttribute('role', 'textbox');
        field.setAttribute('data-testid', `${platform}-comment-field`);
        return field;
    }

    /**
     * Creates a mock post with content
     * @param {string} platform - 'linkedin' or 'breakcold'
     * @param {string} content - Post content
     * @returns {HTMLElement} The created post element
     */
    static createMockPost(platform, content) {
        const post = document.createElement('div');
        post.className = platform === 'linkedin' ? 'feed-shared-update-v2' : 'breakcold-post';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = platform === 'linkedin' ? 'feed-shared-text' : 'post-content';
        contentDiv.textContent = content;
        
        post.appendChild(contentDiv);
        return post;
    }

    /**
     * Simulates API response delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Creates mock API response
     * @param {boolean} success - Whether the response should be successful
     * @param {object} data - Response data
     * @returns {object} Mock response object
     */
    static createMockResponse(success, data) {
        if (success) {
            return {
                success: true,
                data: data
            };
        } else {
            return {
                success: false,
                error: data.error || 'Mock error'
            };
        }
    }

    /**
     * Simulates user interaction with comment field
     * @param {HTMLElement} field - Comment field element
     * @param {string} action - Type of interaction
     */
    static simulateUserInteraction(field, action) {
        switch (action) {
            case 'focus':
                field.dispatchEvent(new Event('focus'));
                break;
            case 'blur':
                field.dispatchEvent(new Event('blur'));
                break;
            case 'input':
                field.dispatchEvent(new Event('input', { bubbles: true }));
                break;
            case 'click':
                field.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                break;
        }
    }

    /**
     * Checks if comment button is properly injected
     * @param {HTMLElement} container - Container to check
     * @returns {boolean} Whether button is properly injected
     */
    static verifyCommentButton(container) {
        const button = container.querySelector('.comment-generator-button');
        if (!button) return false;

        const hasCorrectStyle = button.classList.contains('comment-generator-button');
        const hasCorrectText = button.textContent.includes('Generate');
        const isClickable = !button.disabled;

        return hasCorrectStyle && hasCorrectText && isClickable;
    }

    /**
     * Verifies comment insertion
     * @param {HTMLElement} field - Comment field
     * @param {string} comment - Comment to verify
     * @returns {boolean} Whether comment was inserted correctly
     */
    static verifyCommentInsertion(field, comment) {
        return field.textContent.trim() === comment.trim();
    }

    /**
     * Cleans up test environment
     */
    static cleanup() {
        // Remove any test elements
        document.querySelectorAll('[data-testid]').forEach(el => el.remove());
        
        // Clear any test event listeners
        window.removeEventListener('test-event', () => {});
        
        // Reset any test state
        localStorage.removeItem('test-state');
    }
}

// Export for use in tests
export default TestUtils;
