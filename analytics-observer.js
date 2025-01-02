// Analytics Observer - Tracks comment generation and usage events
class AnalyticsObserver {
    constructor() {
        this.ANALYTICS_SERVER = 'http://localhost:3000/api/analytics';
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second
        this.pendingGenerations = new Map(); // Store pending generation events
        this.initStorage();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for popup close button click
        document.addEventListener('popupClose', (event) => {
            const postId = event.detail?.postId || sessionStorage.getItem('currentPostId');
            if (postId) {
                console.log('Popup close event received:', event.detail);
                this.handleGenerationComplete(postId, 'close_button');
            }
        });

        // Listen for click outside popup
        document.addEventListener('popupOutsideClick', (event) => {
            const postId = event.detail?.postId || sessionStorage.getItem('currentPostId');
            if (postId) {
                console.log('Popup outside click event received:', event.detail);
                this.handleGenerationComplete(postId, 'outside_click');
            }
        });
    }

    async handleGenerationComplete(postId, closeReason) {
        try {
            const pendingData = this.pendingGenerations.get(postId);
            if (!pendingData) {
                console.log('No pending generation found for postId:', postId);
                return;
            }

            console.log('Handling generation complete:', { postId, closeReason, pendingData });

            // Get stored comments for context
            const storedComments = JSON.parse(sessionStorage.getItem('generatedComments') || '[]');
            const postText = sessionStorage.getItem('currentPostText') || '';

            const event = {
                ...pendingData.event,
                data: {
                    ...pendingData.event.data,
                    sourcePost: {
                        text: postText,
                        metrics: {
                            length: postText.length,
                            sentiment: this.analyzeSentiment(postText),
                            keywords: this.extractKeywords(postText)
                        }
                    },
                    generatedComments: storedComments,
                    closeReason,
                    selectedComment: null // Explicitly show no selection was made
                },
                metadata: {
                    ...pendingData.event.metadata,
                    completionType: 'no_selection',
                    timestamp: new Date().toISOString()
                }
            };

            await this.saveAndSendEvent(event);
            this.pendingGenerations.delete(postId);
            console.log('Generation complete event sent and cleaned up');

            // Clear session storage
            sessionStorage.removeItem('currentPostId');
            sessionStorage.removeItem('generatedComments');
            sessionStorage.removeItem('currentPostText');
        } catch (error) {
            console.error('Error handling generation complete:', error);
        }
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
                commentsCount: Array.isArray(comments) ? comments.length : 0,
                postText: postText || 'No post text available'
            });

            // Map comments with proper structure
            const formattedComments = (Array.isArray(comments) ? comments : []).map((comment, index) => {
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
                return commentData;
            });

            // Store in session storage
            try {
                sessionStorage.setItem('currentPostId', postId);
                sessionStorage.setItem('generatedComments', JSON.stringify(formattedComments));
                sessionStorage.setItem('currentPostText', postText || '');
            } catch (storageError) {
                console.error('Error storing in sessionStorage:', storageError);
            }

            const event = {
                eventId: crypto.randomUUID(),
                postId,
                type: 'generation',
                platform,
                data: {
                    sourcePost: {
                        text: postText || '',
                        metrics: {
                            length: String(postText || '').length,
                            sentiment: this.analyzeSentiment(postText),
                            keywords: this.extractKeywords(postText)
                        }
                    },
                    generatedComments: formattedComments
                },
                performance: {
                    generationTime: performance.now() - startTime,
                    totalTime: performance.now() - startTime
                },
                metadata: {
                    browserInfo: navigator.userAgent,
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    url: postMetadata.url || window.location.href
                }
            };

            // Store in pending generations
            this.pendingGenerations.set(postId, {
                event,
                timestamp: Date.now()
            });

            console.log('Generation event stored in pending:', postId);
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

            const pendingData = this.pendingGenerations.get(postId);
            if (!pendingData) {
                throw new Error('No pending generation found for this selection');
            }

            // Get the stored post text and comments
            const postText = sessionStorage.getItem('currentPostText') || '';
            const storedComments = JSON.parse(sessionStorage.getItem('generatedComments') || '[]');

            console.log('Selection data:', {
                platform,
                postId,
                selectedComment,
                pendingData
            });

            const startTime = performance.now();
            const event = {
                ...pendingData.event,
                type: 'selection',
                data: {
                    ...pendingData.event.data,
                    sourcePost: {
                        text: postText,
                        metrics: {
                            length: postText.length,
                            sentiment: this.analyzeSentiment(postText),
                            keywords: this.extractKeywords(postText)
                        }
                    },
                    selectedComment: {
                        id: selectedComment.id || storedComments[selectedComment.index]?.id || crypto.randomUUID(),
                        text: selectedComment.text,
                        index: selectedComment.index,
                        isRegenerated: false,
                        metrics: {
                            length: selectedComment.text.length,
                            sentiment: this.analyzeSentiment(selectedComment.text),
                            keywords: this.extractKeywords(selectedComment.text)
                        }
                    },
                    generatedComments: storedComments
                },
                metadata: {
                    ...pendingData.event.metadata,
                    completionType: 'selection',
                    timestamp: new Date().toISOString()
                },
                performance: {
                    ...pendingData.event.performance,
                    selectionTime: performance.now() - startTime,
                    totalTime: pendingData.event.performance.generationTime + (performance.now() - startTime)
                }
            };

            await this.saveAndSendEvent(event);
            this.pendingGenerations.delete(postId);
            console.log('Selection event sent and cleaned up');
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
