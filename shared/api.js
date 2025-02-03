// Shared API service for both LinkedIn and Breakcold
class CommentAPI {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds delay between retries
        this.apiTimeout = 150000; // 150 seconds timeout
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

    createTimeout(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('API request timed out')), ms);
        });
    }

    validateComments(comments) {
        if (!Array.isArray(comments)) {
            throw new Error('Comments must be an array');
        }

        return comments.map(comment => {
            // Validate required text field
            if (!comment.text || typeof comment.text !== 'string') {
                throw new Error('Invalid comment text format');
            }

            // Validate and preserve original type, use 'General' only if missing
            if (comment.type && typeof comment.type !== 'string') {
                this.log('Warning: Comment type is not a string:', comment.type);
                comment.type = 'General';
            }

            return {
                text: comment.text,
                type: comment.type || 'General'
            };
        });
    }

    extractComments(parsedData) {
        // Case 1: Final_output is directly an array of comments
        if (Array.isArray(parsedData.Final_output)) {
            this.log('Found comments in Final_output array');
            return parsedData.Final_output;
        }
        
        // Case 2: Final_output contains comments array
        if (parsedData.Final_output?.comments && Array.isArray(parsedData.Final_output.comments)) {
            this.log('Found comments in Final_output.comments');
            return parsedData.Final_output.comments;
        }
        
        // Case 3: Root level comments array (v2 format)
        if (Array.isArray(parsedData.comments)) {
            this.log('Found comments at root level');
            return parsedData.comments;
        }
        
        this.log('No valid comments found in response:', parsedData);
        throw new Error('No valid comments found in response');
    }

    async makeApiCall(apiUrl, requestBody) {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': window.API_CONFIG.apiKey
            },
            body: JSON.stringify(requestBody)
        });

        // Clone response for logging (since response.json() can only be called once)
        const responseClone = response.clone();
        
        try {
            // Log the raw response
            const rawResponse = await responseClone.text();
            this.log('=== Raw API Response ===');
            this.log('Status:', response.status);
            this.log('Headers:', Object.fromEntries(response.headers));
            this.log('Body:', rawResponse);
            
            // Try to parse as JSON for prettier logging
            try {
                const jsonResponse = JSON.parse(rawResponse);
                this.log('Parsed JSON Response:', JSON.stringify(jsonResponse, null, 2));
            } catch (e) {
                this.log('Response is not JSON format');
            }
        } catch (e) {
            this.log('Failed to log raw response:', e);
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            this.log('API Error:', errorData);
            throw new Error(
                errorData.error?.message || 
                errorData.message || 
                `API request failed with status ${response.status}`
            );
        }

        return response.json();
    }

    async makeApiCallWithTimeout(apiUrl, requestBody) {
        return Promise.race([
            this.makeApiCall(apiUrl, requestBody),
            this.createTimeout(this.apiTimeout)
        ]);
    }

    async retryApiCall(apiUrl, requestBody) {
        let lastError;
        const startTime = Date.now();

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.log(`API call attempt ${attempt}/${this.maxRetries}`);
                const result = await this.makeApiCallWithTimeout(apiUrl, requestBody);
                const totalTime = Date.now() - startTime;
                this.log(`Successful after ${attempt} attempt(s). Total time: ${totalTime}ms`);
                return result;
            } catch (error) {
                lastError = error;
                this.log(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt === this.maxRetries) {
                    const totalTime = Date.now() - startTime;
                    this.log(`All ${this.maxRetries} attempts failed. Total time: ${totalTime}ms`);
                    throw new Error(`Failed after ${this.maxRetries} attempts. Last error: ${error.message}`);
                }

                this.log(`Waiting ${this.retryDelay}ms before retry...`);
                await this.delay(this.retryDelay);
            }
        }
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
            
            const data = await this.retryApiCall(apiUrl, requestBody);
            
            // Log execution metrics
            this.log('Execution Time:', data.executionTime, 'ms');
            this.log('Credits Used:', data.credits_used);
            
            if (!data.output || !data.output['Generated Comments']) {
                throw new Error('Invalid response format from API');
            }

            // Parse the answer which is a JSON string wrapped in markdown code block
            const cleanAnswer = data.output['Generated Comments'].replace(/```json\n?|\n?```/g, '').trim();
            this.log('Clean Answer:', cleanAnswer);
            const parsedData = JSON.parse(cleanAnswer);

            // Extract and validate comments
            const comments = this.extractComments(parsedData);
            const validatedComments = this.validateComments(comments);

            return {
                success: true,
                comments: validatedComments,
                metadata: {
                    authorUrl: data.output.Author_url,
                    executionTime: data.executionTime,
                    creditsUsed: data.credits_used
                }
            };

        } catch (error) {
            this.log('Error generating comments:', error);
            return {
                success: false,
                error: error.message || 'Failed to generate comments'
            };
        } finally {
            // Always reset the generating flag
            this.isGenerating = false;
        }
    }
}

// Export as global variable to be used by content scripts
window.CommentAPI = new CommentAPI();
