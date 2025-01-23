// Shared API service for both LinkedIn and Breakcold
class CommentAPI {
    constructor() {
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

        if (!window.API_CONFIG) {
            throw new Error('API configuration not found');
        }

        this.log('Generating comments for platform:', platform);
        const cleanText = this.preprocessText(text);
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`Attempt ${attempt} of ${this.maxRetries}`);
                const apiUrl = `${window.API_CONFIG.baseUrl}/${window.API_CONFIG.studioId}/trigger_limited`;
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': window.API_CONFIG.apiKey
                    },
                    body: JSON.stringify({
                        params: {
                            text: cleanText,
                            platform: platform,
                            tone: 'professional'
                        },
                        project: window.API_CONFIG.projectId
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    this.log('API Error:', errorData);
                    throw new Error(
                        errorData.error?.message || 
                        errorData.message || 
                        `API request failed with status ${response.status}`
                    );
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
                return {
                    success: true,
                    comments: parsedData.comments
                };

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

        throw lastError || new Error('Failed to generate comments after retries');
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
