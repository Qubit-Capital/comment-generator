// Analytics Handler - Manages analytics display and updates
class AnalyticsHandler {
    constructor() {
        this.platform = new URLSearchParams(window.location.search).get('platform') || 'all';
        this.days = 30;
        this.init();
    }

    async init() {
        await this.loadAnalytics();
        this.setupEventListeners();
    }

    async loadAnalytics() {
        try {
            const analytics = await chrome.runtime.sendMessage({
                type: 'GET_ANALYTICS',
                data: {
                    platform: this.platform,
                    days: this.days
                }
            });

            this.displayAnalytics(analytics);
        } catch (error) {
            console.error('Error loading analytics:', error);
            this.showError('Failed to load analytics data');
        }
    }

    displayAnalytics(data) {
        const statsContainer = document.getElementById('analytics-stats');
        const eventsContainer = document.getElementById('analytics-events');

        // Display summary stats
        statsContainer.innerHTML = `
            <div class="stat-card">
                <h3>Total Generations</h3>
                <p>${data.totalGenerations}</p>
            </div>
            <div class="stat-card">
                <h3>Total Uses</h3>
                <p>${data.totalUsages}</p>
            </div>
            <div class="stat-card">
                <h3>Usage Rate</h3>
                <p>${data.totalGenerations ? ((data.totalUsages / data.totalGenerations) * 100).toFixed(1) : 0}%</p>
            </div>
        `;

        // Display events timeline
        eventsContainer.innerHTML = data.events.reverse().map(event => `
            <div class="event-card ${event.type}">
                <div class="event-header">
                    <span class="event-type">${event.type === 'generation' ? '🔄 Generated' : '✅ Used'}</span>
                    <span class="event-time">${new Date(event.timestamp).toLocaleString()}</span>
                </div>
                <div class="event-details">
                    <p>Platform: ${event.platform}</p>
                    ${event.type === 'generation' 
                        ? `<p>Comments Generated: ${event.commentsCount}</p>`
                        : `<p>Comment Length: ${event.commentLength} chars</p>`
                    }
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Platform filter
        document.getElementById('platform-filter').value = this.platform;
        document.getElementById('platform-filter').addEventListener('change', (e) => {
            this.platform = e.target.value;
            this.loadAnalytics();
        });

        // Time range filter
        document.getElementById('time-range').value = this.days;
        document.getElementById('time-range').addEventListener('change', (e) => {
            this.days = parseInt(e.target.value);
            this.loadAnalytics();
        });

        // Listen for analytics updates
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'ANALYTICS_UPDATE') {
                this.loadAnalytics();
            }
        });
    }

    showError(message) {
        const container = document.getElementById('analytics-container');
        container.innerHTML = `
            <div class="error-message">
                <p>⚠️ ${message}</p>
                <button onclick="window.analyticsHandler.loadAnalytics()">Retry</button>
            </div>
        `;
    }
}

// Create instance when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.analyticsHandler = new AnalyticsHandler();
});
