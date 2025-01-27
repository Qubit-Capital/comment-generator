// Shared API service for both LinkedIn and Breakcold
class CommentAPI {
    constructor() {
        this.API_CONFIG = {
            studioId: '4342ea74-9a0b-45c2-b94f-65fd753fec29',
            projectId: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
            baseUrl: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios',
            apiKey: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5:sk-YzVmZWQxNmYtMDQ0Yi00Mzk1LTlhYjctNTUxNTgzODY5MDky'
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

    async generateComments(text, platform, linkedinUrn = '') {
        if (!platform) {
            throw new Error('Missing required parameter: platform');
        }

        this.log('Generating comments for platform:', platform);
        const cleanText = text ? this.preprocessText(text) : '';
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`Attempt ${attempt} of ${this.maxRetries}`);
                const apiUrl = `${this.API_CONFIG.baseUrl}/${this.API_CONFIG.studioId}/trigger_limited`;
                
                const requestBody = {
                    params: {
                        linkedin_urn: linkedinUrn || "",
                    },
                    project: this.API_CONFIG.projectId
                };

                // Only include text if linkedin_urn is empty
                if (!linkedinUrn && cleanText) {
                    requestBody.params.text = cleanText;
                }

                this.log('Making API request with body:', requestBody);
                
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': this.API_CONFIG.apiKey
                    },
                    body: JSON.stringify(requestBody)
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
                this.log('API Response:', data);
                
                if (!data.output || !data.output.answer) {
                    throw new Error('Invalid response format from API');
                }

                // Parse the answer which is a JSON string wrapped in markdown code block
                const cleanAnswer = data.output.answer.replace(/```json\n?|\n?```/g, '').trim();
                this.log('Clean Answer:', cleanAnswer);
                const parsedData = JSON.parse(cleanAnswer);

                if (!parsedData?.Final_output?.comments || !Array.isArray(parsedData.Final_output.comments)) {
                    throw new Error('Invalid comments data format');
                }

                this.log('Successfully generated comments');
                return {
                    success: true,
                    comments: parsedData.Final_output.comments
                };

            } catch (error) {
                this.log(`Attempt ${attempt} failed:`, error);
                lastError = error;
                
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    this.log(`Retrying in ${delay}ms...`);
                    await this.delay(delay);
                }
            }
        }

        // If all attempts fail, throw the last error
        throw lastError || new Error('Failed to generate comments');
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.API_CONFIG.baseUrl}/health`, {
                headers: {
                    'Authorization': this.API_CONFIG.apiKey
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
