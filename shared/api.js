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
        this.DEBUG = true;
    }

    log(...args) {
        if (this.DEBUG) console.log('[AI Comment API]', ...args);
    }

    preprocessText(text) {
        if (!text || typeof text !== 'string') {
            this.log('Invalid text input:', text);
            throw new Error('Invalid text input');
        }

        const processed = text.trim()
            .replace(/\s+/g, ' ')
            .substring(0, 500);
        
        this.log('Preprocessed text length:', processed.length);
        return processed;
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async generateComments(text, platform) {
        if (!text || !platform) {
            throw new Error('Missing required parameters: text and platform');
        }

        this.log('Generating comments for platform:', platform);
        const cleanText = this.preprocessText(text);
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`Attempt ${attempt} of ${this.maxRetries}`);
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
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'Failed to generate comments');
                }

                this.log('Successfully generated comments');
                return {
                    success: true,
                    comments: data.output
                };

            } catch (error) {
                this.log(`Attempt ${attempt} failed:`, error);
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay * attempt);
                }
            }
        }

        return {
            success: false,
            error: lastError?.message || 'Failed to generate comments after multiple attempts'
        };
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
