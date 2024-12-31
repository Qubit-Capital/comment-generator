// Shared API service for both LinkedIn and Breakcold
class CommentAPI {
    constructor() {
        this.API_CONFIG = {
            studioId: 'e24e0d8f-55bc-42b3-b4c0-ef86b7f9746c',
            projectId: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
            baseUrl: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios',
            apiKey: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5:sk-N2QxNjVkNmYtMGE1MS00ZDcyLTg0ZWMtOGY1OTZkNWUzMzhm'
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
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.API_CONFIG.apiKey}`
                    },
                    body: JSON.stringify({
                        params: {
                            linked_in_post: cleanText
                        },
                        project: this.API_CONFIG.projectId
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API request failed: ${response.status} - ${errorData.message || response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.output || !data.output.answer) {
                    throw new Error('Invalid response format from API');
                }

                // Parse the answer which is a JSON string wrapped in markdown code block
                const cleanAnswer = data.output.answer.replace(/```json\n?|\n?```/g, '').trim();
                const parsedData = JSON.parse(cleanAnswer);

                if (!parsedData || !Array.isArray(parsedData.comments)) {
                    throw new Error('Invalid comments data format');
                }

                this.log('Successfully generated comments');
                return parsedData.comments;

            } catch (error) {
                lastError = error;
                this.log(`Attempt ${attempt} failed:`, error);
                
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    this.log(`Retrying in ${delay}ms...`);
                    await this.delay(delay);
                }
            }
        }

        throw lastError || new Error('Failed to generate comments after multiple attempts');
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.API_CONFIG.baseUrl}/health`, {
                headers: {
                    'Authorization': `Bearer ${this.API_CONFIG.apiKey}`
                }
            });
            return response.ok;
        } catch (error) {
            this.log('Auth check failed:', error);
            return false;
        }
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
