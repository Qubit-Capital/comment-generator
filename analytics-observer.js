// Analytics Observer - Tracks comment generation and usage events
class AnalyticsObserver {
    constructor() {
        this.ANALYTICS_SERVER = 'http://localhost:3000/api/analytics';
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second
        this.pendingGenerations = new Map(); // Store pending generation events
        this.pendingEvents = new Map();
        this.DEBUG = true;
        this.currentSessionId = crypto.randomUUID();
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

    async trackCommentGeneration(platform, postText, comments, metadata = {}) {
        try {
            const postId = metadata.postId || crypto.randomUUID();
            sessionStorage.setItem('currentPostId', postId);
            sessionStorage.setItem('currentPostText', postText);
            sessionStorage.setItem('generatedComments', JSON.stringify(comments));

            const event = {
                eventId: crypto.randomUUID(),
                postId,
                platform: platform.toLowerCase(),
                type: 'generation',
                data: {
                    sourcePost: {
                        text: postText,
                        metrics: {
                            length: postText.length,
                            sentiment: this.analyzeSentiment(postText),
                            keywords: this.extractKeywords(postText)
                        }
                    },
                    generatedComments: comments.map(comment => ({
                        id: crypto.randomUUID(),
                        text: typeof comment === 'string' ? comment : comment.text,
                        tone: typeof comment === 'string' ? 'neutral' : comment.type,
                        isRegenerated: metadata.isRegeneration || false,
                        regenerationId: metadata.regenerationId,
                        previousComments: metadata.previousComments?.map(c => ({
                            id: crypto.randomUUID(),
                            text: c.text,
                            tone: c.type,
                            metrics: {
                                length: c.text.length,
                                sentiment: this.analyzeSentiment(c.text),
                                keywords: this.extractKeywords(c.text)
                            }
                        })) || [],
                        metrics: {
                            length: (typeof comment === 'string' ? comment : comment.text).length,
                            sentiment: this.analyzeSentiment(typeof comment === 'string' ? comment : comment.text),
                            keywords: this.extractKeywords(typeof comment === 'string' ? comment : comment.text)
                        }
                    })),
                    regenerationHistory: metadata.isRegeneration ? [{
                        regenerationId: metadata.regenerationId,
                        timestamp: new Date().toISOString(),
                        previousComments: metadata.previousComments?.map(c => ({
                            id: crypto.randomUUID(),
                            text: c.text,
                            tone: c.type,
                            metrics: {
                                length: c.text.length,
                                sentiment: this.analyzeSentiment(c.text),
                                keywords: this.extractKeywords(c.text)
                            }
                        })) || [],
                        newComments: comments.map(comment => ({
                            id: crypto.randomUUID(),
                            text: typeof comment === 'string' ? comment : comment.text,
                            tone: typeof comment === 'string' ? 'neutral' : comment.type,
                            metrics: {
                                length: (typeof comment === 'string' ? comment : comment.text).length,
                                sentiment: this.analyzeSentiment(typeof comment === 'string' ? comment : comment.text),
                                keywords: this.extractKeywords(typeof comment === 'string' ? comment : comment.text)
                            }
                        })),
                        selectedAfterRegeneration: false,
                        selectedCommentIndex: null
                    }] : []
                },
                metadata: {
                    url: window.location.href,
                    browserInfo: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    completionType: 'no_selection',
                    sessionId: this.currentSessionId,
                    ...metadata
                }
            };

            // Store for later use in selection tracking
            this.pendingGenerations.set(postId, {
                event,
                timestamp: new Date()
            });

            await this.sendToServer({ event });
            return event;
        } catch (error) {
            console.error('Error tracking comment generation:', error);
            throw error;
        }
    }

    async trackCommentUsage(platform, index, comment, metadata = {}) {
        const pendingEvent = Array.from(this.pendingEvents.values())
            .find(event => event.platform === platform.toLowerCase());

        if (!pendingEvent) {
            console.error('No pending event found for comment usage');
            return;
        }

        const event = {
            ...pendingEvent,
            type: 'selection',
            data: {
                ...pendingEvent.data,
                selectedComment: {
                    index,
                    text: comment,
                    timestamp: new Date().toISOString()
                }
            },
            metadata: {
                ...pendingEvent.metadata,
                selectionTimestamp: new Date().toISOString()
            }
        };

        // Update regeneration history if this selection was after regeneration
        if (metadata.regenerationId && event.data.regenerationHistory?.length > 0) {
            const lastRegeneration = event.data.regenerationHistory[event.data.regenerationHistory.length - 1];
            if (lastRegeneration.regenerationId === metadata.regenerationId) {
                lastRegeneration.selectedAfterRegeneration = true;
                lastRegeneration.selectedCommentIndex = index;
            }
        }

        try {
            await this.sendToServer(event);
            this.pendingEvents.delete(event.eventId);
        } catch (error) {
            console.error('Error tracking comment usage:', error);
        }
    }

    async trackCommentSelection(platform, selectedComment, postId) {
        try {
            if (!postId) {
                postId = sessionStorage.getItem('currentPostId');
                if (!postId) {
                    throw new Error('No postId found for selection');
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

            const event = {
                ...pendingData.event,
                type: 'selection',
                platform: platform.toLowerCase(),
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
                    generatedComments: storedComments.map(comment => ({
                        id: crypto.randomUUID(),
                        text: typeof comment === 'string' ? comment : comment.text,
                        tone: typeof comment === 'string' ? 'neutral' : comment.type,
                        metrics: {
                            length: (typeof comment === 'string' ? comment : comment.text).length,
                            sentiment: this.analyzeSentiment(typeof comment === 'string' ? comment : comment.text),
                            keywords: this.extractKeywords(typeof comment === 'string' ? comment : comment.text)
                        }
                    })),
                    selectedComment: {
                        id: crypto.randomUUID(),
                        text: selectedComment.text || selectedComment,
                        index: selectedComment.index || 0,
                        isRegenerated: selectedComment.isRegenerated || false,
                        regenerationId: selectedComment.regenerationId,
                        metrics: {
                            length: (selectedComment.text || selectedComment).length,
                            sentiment: this.analyzeSentiment(selectedComment.text || selectedComment),
                            keywords: this.extractKeywords(selectedComment.text || selectedComment)
                        }
                    }
                },
                metadata: {
                    ...pendingData.event.metadata,
                    completionType: 'selection',
                    timestamp: new Date().toISOString()
                }
            };

            // Update regeneration history if this selection was after regeneration
            if (event.data.regenerationHistory?.length > 0) {
                const lastRegeneration = event.data.regenerationHistory[event.data.regenerationHistory.length - 1];
                if (selectedComment.regenerationId === lastRegeneration.regenerationId) {
                    lastRegeneration.selectedAfterRegeneration = true;
                    lastRegeneration.selectedCommentIndex = selectedComment.index || 0;
                }
            }

            await this.sendToServer({ event });
            this.pendingGenerations.delete(postId);

            // Clear session storage
            sessionStorage.removeItem('currentPostId');
            sessionStorage.removeItem('generatedComments');
            sessionStorage.removeItem('currentPostText');

            return event;
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

    calculatePostMetrics(postText) {
        return {
            length: postText.length,
            sentiment: this.analyzeSentiment(postText),
            keywords: this.extractKeywords(postText)
        };
    }

    calculateCommentMetrics(commentText) {
        return {
            length: commentText.length,
            sentiment: this.analyzeSentiment(commentText),
            keywords: this.extractKeywords(commentText)
        };
    }
}

// Create and export instance
window.analyticsObserver = new AnalyticsObserver();
