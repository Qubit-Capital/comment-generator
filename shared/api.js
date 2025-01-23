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

    async generateComments(text, platform, linkedinUrn = '') {
        if (!platform) {
            throw new Error('Missing required parameter: platform');
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
                
                const requestBody = {
                    params: {
                        linkedin_urn: linkedinUrn || "",
                    },
                    project: window.API_CONFIG.projectId
                };

                // Only include text if linkedin_urn is empty
                if (!linkedinUrn) {
                    requestBody.params.text = cleanText;
                }

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': window.API_CONFIG.apiKey
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

                if (!parsedData || !Array.isArray(parsedData.comments)) {
                    throw new Error('Invalid comments data format');
                }

                return parsedData.comments;
            } catch (error) {
                this.log(`Attempt ${attempt} failed:`, error);
                lastError = error;
                
                // Wait before retrying
                if (attempt < this.maxRetries) {
                    await this.delay(this.retryDelay);
                }
            }
        }

        // If all attempts fail, throw the last error
        throw lastError || new Error('Failed to generate comments');
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
