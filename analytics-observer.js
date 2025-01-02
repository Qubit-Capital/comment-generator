// Analytics Observer - Tracks comment generation and usage events
class AnalyticsObserver {
    constructor() {
        this.ANALYTICS_SERVER = 'http://localhost:3000/api/analytics';
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second
        this.initStorage();
    }

    async initStorage() {
        try {
            const storage = await chrome.storage.local.get('analytics');
            if (!storage.analytics) {
                await chrome.storage.local.set({
                    analytics: {
                        events: [],
                        pendingEvents: []
                    }
                });
            } else if (!storage.analytics.pendingEvents) {
                // Ensure pendingEvents exists
                storage.analytics.pendingEvents = [];
                await chrome.storage.local.set({ analytics: storage.analytics });
            }
        } catch (error) {
            console.error('Error initializing analytics storage:', error);
        }
    }

    async trackCommentGeneration(platform, postText, comments, postMetadata = {}) {
        try {
            const startTime = performance.now();
            const postId = crypto.randomUUID();
            
            console.log('Generating comments with data:', {
                platform,
                postId,
                commentsCount: Array.isArray(comments) ? comments.length : 0
            });

            // Map comments with proper structure, ensuring each comment is properly stringified
            const formattedComments = (Array.isArray(comments) ? comments : []).map((comment, index) => {
                // Ensure comment is properly stringified if it's an object
                const commentText = typeof comment === 'object' ? 
                    (comment.text || JSON.stringify(comment)) : 
                    String(comment || '');

                const commentData = {
                    id: crypto.randomUUID(),
                    text: commentText,
                    tone: 'professional',
                    index,
                    metrics: {
                        length: commentText.length,
                        sentiment: this.analyzeSentiment(commentText),
                        keywords: this.extractKeywords(commentText)
                    }
                };
                console.log(`Comment ${index} data:`, commentData);
                return commentData;
            });

            // Store in session storage with proper error handling
            try {
                sessionStorage.setItem('currentPostId', postId);
                sessionStorage.setItem('generatedComments', JSON.stringify(formattedComments));
                
                console.log('Stored in sessionStorage:', {
                    postId,
                    comments: JSON.parse(sessionStorage.getItem('generatedComments'))
                });
            } catch (storageError) {
                console.error('Error storing in sessionStorage:', storageError);
            }

            const event = {
                eventId: crypto.randomUUID(),
                postId,
                type: 'generation',
                platform,
                data: {
                    generatedComments: formattedComments
                },
                performance: {
                    generationTime: performance.now() - startTime,
                    totalTime: performance.now() - startTime
                },
                metadata: {
                    browserInfo: navigator.userAgent,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            };

            console.log('Sending generation event:', JSON.stringify(event, null, 2));

            const post = {
                postId,
                platform,
                metadata: {
                    url: postMetadata.url || window.location.href,
                    authorName: postMetadata.authorName || 'Unknown',
                    postContent: String(postText || ''),
                    postType: 'text',
                    engagement: {
                        likes: 0,
                        comments: 0,
                        shares: 0
                    }
                }
            };

            await this.saveAndSendEvent(event, post);
            return postId;
        } catch (error) {
            console.error('Error tracking comment generation:', error);
            return null;
        }
    }

    async trackCommentSelection(platform, selectedComment, postId) {
        try {
            if (!postId) {
                postId = sessionStorage.getItem('currentPostId');
                if (!postId) {
                    throw new Error('No postId found. Make sure to call trackCommentGeneration first.');
                }
            }

            console.log('Selection started with:', {
                platform,
                postId,
                selectedComment
            });

            // Get the stored generated comments
            const storedComments = sessionStorage.getItem('generatedComments');
            console.log('Retrieved from sessionStorage:', storedComments);

            const generatedComments = JSON.parse(storedComments || '[]');
            console.log('Parsed generated comments:', generatedComments);

            // Find the selected comment's full data
            const selectedCommentData = generatedComments[selectedComment.index] || {
                id: crypto.randomUUID(),
                text: String(selectedComment.text || ''),
                index: selectedComment.index,
                metrics: {
                    length: String(selectedComment.text || '').length,
                    sentiment: this.analyzeSentiment(selectedComment.text),
                    keywords: this.extractKeywords(selectedComment.text)
                }
            };

            console.log('Selected comment data:', selectedCommentData);

            const startTime = performance.now();
            const event = {
                eventId: crypto.randomUUID(),
                postId,
                type: 'selection',
                platform,
                data: {
                    selectedComment: {
                        id: selectedCommentData.id,
                        text: selectedCommentData.text,
                        index: selectedCommentData.index,
                        isRegenerated: false,
                        metrics: selectedCommentData.metrics // Include metrics in selection
                    },
                    generatedComments: generatedComments.map(comment => ({
                        ...comment,
                        metrics: {
                            length: String(comment.text || '').length,
                            sentiment: comment.metrics?.sentiment || this.analyzeSentiment(comment.text),
                            keywords: comment.metrics?.keywords || this.extractKeywords(comment.text)
                        }
                    }))
                },
                performance: {
                    selectionTime: performance.now() - startTime,
                    totalTime: performance.now() - startTime
                },
                metadata: {
                    browserInfo: navigator.userAgent,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString()
                }
            };

            console.log('Sending selection event:', JSON.stringify(event, null, 2));

            await this.saveAndSendEvent(event);
        } catch (error) {
            console.error('Error tracking comment selection:', error);
            throw error;
        }
    }

    async trackCommentUsage(platform, commentIndex, commentText) {
        const postId = sessionStorage.getItem('currentPostId');
        return this.trackCommentSelection(platform, { index: commentIndex, text: commentText }, postId);
    }

    async saveAndSendEvent(event, post = null) {
        try {
            // Save to local storage first
            await this.saveToStorage(event);
            
            // Try to send to server
            const payload = post ? { event, post } : { event };
            await this.sendToServer(payload);
        } catch (error) {
            console.error('Failed to process analytics event:', error);
            await this.addToPendingEvents(event);
        }
    }

    async saveToStorage(event) {
        try {
            const storage = await chrome.storage.local.get('analytics');
            const analytics = storage.analytics || { events: [], pendingEvents: [] };
            
            analytics.events.push(event);
            
            // Keep only last 1000 events
            if (analytics.events.length > 1000) {
                analytics.events = analytics.events.slice(-1000);
            }
            
            await chrome.storage.local.set({ analytics });
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    async sendToServer(payload, retryCount = 0) {
        try {
            // Generate a new eventId for each retry attempt to avoid duplicates
            if (retryCount > 0 && payload.event) {
                payload.event.eventId = crypto.randomUUID();
            }

            console.log('Sending payload to server:', JSON.stringify(payload, null, 2));
            
            const response = await fetch(`${this.ANALYTICS_SERVER}/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Failed to send to server (attempt ${retryCount + 1}/${this.MAX_RETRIES}):`, error);
            
            if (retryCount < this.MAX_RETRIES) {
                const delay = this.RETRY_DELAY * Math.pow(2, retryCount);
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.sendToServer(payload, retryCount + 1);
            }
            throw error;
        }
    }

    async addToPendingEvents(event) {
        try {
            const storage = await chrome.storage.local.get('analytics');
            const analytics = storage.analytics || { events: [], pendingEvents: [] };
            
            if (!analytics.pendingEvents) {
                analytics.pendingEvents = [];
            }
            
            analytics.pendingEvents.push(event);
            await chrome.storage.local.set({ analytics });
        } catch (error) {
            console.error('Error adding to pending events:', error);
        }
    }

    async processPendingEvents() {
        try {
            const storage = await chrome.storage.local.get('analytics');
            const analytics = storage.analytics || { events: [], pendingEvents: [] };
            
            if (!analytics.pendingEvents) {
                analytics.pendingEvents = [];
                await chrome.storage.local.set({ analytics });
                return;
            }
            
            if (analytics.pendingEvents.length > 0) {
                const pendingEvents = [...analytics.pendingEvents];
                analytics.pendingEvents = [];
                await chrome.storage.local.set({ analytics });

                for (const event of pendingEvents) {
                    try {
                        await this.sendToServer(event);
                    } catch (error) {
                        await this.addToPendingEvents(event);
                    }
                }
            }
        } catch (error) {
            console.error('Error processing pending events:', error);
        }
    }

    analyzeSentiment(text) {
        if (!text || typeof text !== 'string') {
            return 'neutral';
        }

        const positiveWords = ['great', 'good', 'awesome', 'excellent', 'love', 'amazing'];
        const negativeWords = ['bad', 'poor', 'terrible', 'hate', 'awful'];
        
        const words = text.toLowerCase().split(/\W+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score++;
            if (negativeWords.includes(word)) score--;
        });
        
        return score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral';
    }

    extractKeywords(text) {
        if (!text || typeof text !== 'string') {
            return [];
        }

        const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but'];
        const words = text.toLowerCase().split(/\W+/);
        return words
            .filter(word => word.length > 3 && !stopWords.includes(word))
            .slice(0, 5);
    }
}

// Create and export instance
window.analyticsObserver = new AnalyticsObserver();
