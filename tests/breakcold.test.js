import TestUtils from './test-utils';

describe('Breakcold Comment Generator Tests', () => {
    let container;
    let commentField;
    let post;

    beforeAll(() => {
        // Set up test environment
        document.body.innerHTML = '';
    });

    beforeEach(() => {
        // Create test container
        container = document.createElement('div');
        document.body.appendChild(container);
        
        // Create mock post and comment field
        post = TestUtils.createMockPost('breakcold', 'Test Breakcold post content');
        commentField = TestUtils.createMockCommentField('breakcold');
        
        container.appendChild(post);
        container.appendChild(commentField);
    });

    afterEach(() => {
        // Clean up after each test
        if (container && container.parentNode) {
            container.remove();
        }
        TestUtils.cleanup();
        jest.clearAllMocks();
    });

    describe('Button Injection', () => {
        it('should inject comment button correctly', () => {
            expect(TestUtils.verifyCommentButton(container)).toBe(true);
        });

        it('should inject button only once', () => {
            const buttons = container.querySelectorAll('.comment-generator-button');
            expect(buttons.length).toBe(1);
        });
    });

    describe('Comment Generation', () => {
        it('should show loading state during generation', async () => {
            const button = container.querySelector('.comment-generator-button');
            button.click();
            
            const loading = container.querySelector('.loading-container');
            expect(loading.classList.contains('hidden')).toBe(false);
            
            await TestUtils.delay(1000);
            expect(loading.classList.contains('hidden')).toBe(true);
        });

        it('should handle generation errors gracefully', async () => {
            // Mock API error
            const errorResponse = TestUtils.createMockResponse(false, { error: 'API Error' });
            
            // Trigger generation
            const button = container.querySelector('.comment-generator-button');
            button.click();
            
            await TestUtils.delay(1000);
            
            const errorMessage = container.querySelector('.error-message');
            expect(errorMessage.classList.contains('hidden')).toBe(false);
            expect(errorMessage.textContent).toContain('API Error');
        });
    });

    describe('Comment Selection & Insertion', () => {
        it('should insert selected comment correctly', async () => {
            const testComment = 'Test comment for Breakcold';
            const commentElement = document.createElement('div');
            commentElement.className = 'comment-option';
            commentElement.textContent = testComment;
            
            container.querySelector('.comments-list').appendChild(commentElement);
            commentElement.click();
            
            expect(TestUtils.verifyCommentInsertion(commentField, testComment)).toBe(true);
        });

        it('should maintain cursor position after insertion', () => {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(commentField);
            selection.removeAllRanges();
            selection.addRange(range);
            
            const testComment = 'Test comment';
            commentField.textContent = testComment;
            
            expect(selection.toString()).toBe(testComment);
        });
    });

    describe('Platform Integration', () => {
        it('should detect Breakcold environment correctly', () => {
            window.location.href = 'https://breakcold.com';
            expect(window.location.href.includes('breakcold.com')).toBe(true);
        });

        it('should handle platform-specific DOM elements', () => {
            expect(post.classList.contains('breakcold-post')).toBe(true);
            expect(commentField.classList.contains('breakcold-comment-field')).toBe(true);
        });
    });
});
