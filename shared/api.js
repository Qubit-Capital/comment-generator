// Shared API service for both LinkedIn and Breakcold
class CommentAPI {
    constructor() {
        this.API_CONFIG = {
            studioId: 'e24e0d8f-55bc-42b3-b4c0-ef86b7f9746c',
            projectId: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
            baseUrl: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios'
        };
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second delay between retries
        this.DEBUG = process.env.NODE_ENV !== 'production';
    }

    log(...args) {
        if (this.DEBUG) {
            console.log('[AI Comment API]', ...args);
        }
    }

    getUserFriendlyError(error) {
        const messages = {
            'network': 'Connection failed. Please check your internet.',
            'timeout': 'Request timed out. Please try again.',
            'server': 'Server error. Please try again later.',
            'invalid_input': 'Invalid text input. Please try again with different text.',
            'rate_limit': 'Too many requests. Please wait a moment and try again.',
            'default': 'An error occurred. Please try again.'
        };
        return messages[error.type] || messages.default;
    }

    handleApiError(error, context) {
        console.error(`[AI Comment API] ${context}:`, error);
        return {
            success: false,
            error: this.getUserFriendlyError(error)
        };
    }

    preprocessText(text) {
        try {
            if (!text || typeof text !== 'string') {
                throw { type: 'invalid_input', message: 'Invalid text input' };
            }

            const processed = text.trim()
                .replace(/\s+/g, ' ')
                .substring(0, 500);
            
            if (processed.length === 0) {
                throw { type: 'invalid_input', message: 'Empty text after processing' };
            }

            return processed;
        } catch (error) {
            throw { type: 'invalid_input', message: error.message || 'Text processing failed' };
        }
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateComments(text, platform) {
        if (!text || !platform) {
            return this.handleApiError({ type: 'invalid_input' }, 'Missing parameters');
        }

        let cleanText;
        try {
            cleanText = this.preprocessText(text);
        } catch (error) {
            return this.handleApiError(error, 'Text preprocessing');
        }

        let lastError = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                if (attempt > 1) {
                    await this.delay(this.retryDelay);
                }

                const apiUrl = `${this.API_CONFIG.baseUrl}/${this.API_CONFIG.studioId}/trigger_limited`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        project_id: this.API_CONFIG.projectId,
                        params: {
                            text: cleanText,
                            platform: platform
                        }
                    })
                });

                if (!response.ok) {
                    const errorType = response.status === 429 ? 'rate_limit' : 
                                    response.status >= 500 ? 'server' : 'default';
                    throw { type: errorType, status: response.status };
                }

                const data = await response.json();
                
                if (!data || !data.output || !Array.isArray(data.output)) {
                    throw { type: 'server', message: 'Invalid response format' };
                }

                return {
                    success: true,
                    comments: data.output
                };

            } catch (error) {
                lastError = error.type === 'rate_limit' ? error : 
                           error.name === 'TypeError' ? { type: 'network', message: error.message } :
                           error;

                if (attempt === this.maxRetries || error.type === 'rate_limit') {
                    return this.handleApiError(lastError, 'API request failed');
                }
            }
        }

        return this.handleApiError(lastError || { type: 'default' }, 'All attempts failed');
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
