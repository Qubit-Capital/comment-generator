// Stub implementations for removed analytics functionality
class AnalyticsStub {
    constructor() {
        console.debug('Analytics tracking disabled');
    }

    // Stub for tracking comment generation
    async trackCommentGeneration() {
        return Promise.resolve();
    }

    // Stub for tracking comment selection
    async trackCommentSelection() {
        return Promise.resolve();
    }

    // Stub for handling generation complete
    async handleGenerationComplete() {
        return Promise.resolve();
    }

    // Stub for any other analytics method
    async track() {
        return Promise.resolve();
    }
}

// Export stub instance
window.analyticsObserver = new AnalyticsStub();
