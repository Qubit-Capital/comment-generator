// Shared API service for both LinkedIn and Breakcold
class CommentAPI {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second delay between retries
        this.DEBUG = true;
        this.isGenerating = false;
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
        // Prevent multiple simultaneous calls
        if (this.isGenerating) {
            this.log('Comment generation already in progress');
            throw new Error('Comment generation already in progress');
        }

        if (!platform) {
            throw new Error('Missing required parameter: platform');
        }

        if (!window.API_CONFIG) {
            throw new Error('API configuration not found');
        }

        this.isGenerating = true;
        this.log('Generating comments for platform:', platform);
        const cleanText = text ? this.preprocessText(text) : '';
        let lastError = null;

        try {
            const apiUrl = `${window.API_CONFIG.baseUrl}/${window.API_CONFIG.studioId}/trigger_limited`;
            
            const requestBody = {
                params: {
                    linkedin_urn: linkedinUrn || "",
                },
                project: window.API_CONFIG.projectId
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

            if (!parsedData?.Final_output?.comments || !Array.isArray(parsedData.Final_output.comments)) {
                throw new Error('Invalid comments data format');
            }

            return parsedData.Final_output.comments;

        } catch (error) {
            this.log('Error generating comments:', error);
            throw error;
        } finally {
            // Always reset the generating flag
            this.isGenerating = false;
        }
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
