// Analytics Observer - Tracks comment generation and usage events
class AnalyticsObserver {
    constructor() {
        this.initStorage();
    }

    async initStorage() {
        // Initialize analytics storage if it doesn't exist
        const storage = await chrome.storage.local.get('analytics');
        if (!storage.analytics) {
            await chrome.storage.local.set({
                analytics: {
                    comments: [],
                    events: []
                }
            });
        }
    }

    async trackCommentGeneration(platform, postText, comments) {
        const event = {
            type: 'generation',
            platform,
            timestamp: new Date().toISOString(),
            postLength: postText.length,
            commentsCount: comments.length
        };

        await this.saveEvent(event);
    }

    async trackCommentUsage(platform, commentIndex, commentText) {
        const event = {
            type: 'usage',
            platform,
            timestamp: new Date().toISOString(),
            commentIndex,
            commentLength: commentText.length
        };

        await this.saveEvent(event);
    }

    async saveEvent(event) {
        try {
            const storage = await chrome.storage.local.get('analytics');
            const analytics = storage.analytics || { comments: [], events: [] };
            
            analytics.events.push(event);
            
            // Keep only last 1000 events
            if (analytics.events.length > 1000) {
                analytics.events = analytics.events.slice(-1000);
            }
            
            await chrome.storage.local.set({ analytics });
            
            // Notify background script about new analytics data
            chrome.runtime.sendMessage({
                type: 'ANALYTICS_UPDATE',
                data: event
            });
        } catch (error) {
            console.error('Error saving analytics event:', error);
        }
    }

    async getAnalytics(platform = 'all', days = 30) {
        const storage = await chrome.storage.local.get('analytics');
        const analytics = storage.analytics || { comments: [], events: [] };
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const filteredEvents = analytics.events.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= cutoffDate && 
                   (platform === 'all' || event.platform === platform);
        });
        
        return {
            totalGenerations: filteredEvents.filter(e => e.type === 'generation').length,
            totalUsages: filteredEvents.filter(e => e.type === 'usage').length,
            events: filteredEvents
        };
    }
}

// Create and export instance
window.analyticsObserver = new AnalyticsObserver();
