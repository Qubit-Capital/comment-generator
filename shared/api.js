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

    normalizeCommentType(type) {
        if (!type) return 'Professional';

        // Remove parentheses and content within them
        const baseType = type.split('(')[0].trim();

        // Map of complex types to simple ones
        const typeMap = {
            'Informational': 'Neutral',
            'Personal Experience': 'Friendly',
            'Constructive Criticism': 'Serious',
            'Agreement with Expansion': 'Supportive',
            'Humorous': 'Humorous'
        };

        return typeMap[baseType] || baseType;
    }

    validateComments(comments) {
        if (!Array.isArray(comments)) {
            throw new Error('Comments must be an array');
        }

        return comments.map(comment => {
            if (!comment.text || typeof comment.text !== 'string') {
                throw new Error('Invalid comment text format');
            }

            // Normalize comment type
            const normalizedType = this.normalizeCommentType(comment.type);
            return {
                text: comment.text,
                type: normalizedType
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

            // Extract and validate comments
            const comments = this.extractComments(parsedData);
            const normalizedComments = this.validateComments(comments);

            return {
                success: true,
                comments: normalizedComments
            };

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
