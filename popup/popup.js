document.addEventListener('DOMContentLoaded', function() {
    // Initialize platform status
    updatePlatformStatus();
    
    // Initialize analytics
    const analyticsBtn = document.getElementById('viewAnalytics');
    const analyticsPanel = document.getElementById('analytics-panel');
    const closePanel = document.querySelector('.close-panel');
    const viewDetailedBtn = document.getElementById('viewDetailedAnalytics');
    
    // Handle analytics button click
    analyticsBtn.addEventListener('click', async () => {
        analyticsPanel.classList.remove('hidden');
        await updateQuickAnalytics();
    });
    
    // Handle close panel button
    closePanel.addEventListener('click', () => {
        analyticsPanel.classList.add('hidden');
    });
    
    // Handle detailed analytics view
    viewDetailedBtn.addEventListener('click', () => {
        chrome.tabs.create({
            url: chrome.runtime.getURL('analytics.html')
        });
    });
});

async function updateQuickAnalytics() {
    try {
        // Get analytics for the last day
        const response = await chrome.runtime.sendMessage({
            type: 'GET_ANALYTICS',
            data: {
                platform: 'all',
                days: 1
            }
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        // Update UI with analytics data
        document.getElementById('todayGenerations').textContent = response.totalGenerations || 0;
        document.getElementById('successRate').textContent = `${(response.successRate || 0).toFixed(1)}%`;
        document.getElementById('popularTone').textContent = response.popularTone || 'N/A';
        
    } catch (error) {
        console.error('Error fetching analytics:', error);
        // Show error in UI
        document.getElementById('todayGenerations').textContent = 'Error';
        document.getElementById('successRate').textContent = 'Error';
        document.getElementById('popularTone').textContent = 'Error';
    }
}

function updatePlatformStatus() {
    // Check LinkedIn status
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const currentUrl = tabs[0].url;
        const linkedinStatus = document.getElementById('linkedin-status');
        const breakcoldStatus = document.getElementById('breakcold-status');

        // Update LinkedIn status
        if (currentUrl.includes('linkedin.com')) {
            linkedinStatus.classList.add('active');
            linkedinStatus.classList.remove('inactive');
        } else {
            linkedinStatus.classList.add('inactive');
            linkedinStatus.classList.remove('active');
        }

        // Update Breakcold status
        if (currentUrl.includes('breakcold.com')) {
            breakcoldStatus.classList.add('active');
            breakcoldStatus.classList.remove('inactive');
        } else {
            breakcoldStatus.classList.add('inactive');
            breakcoldStatus.classList.remove('active');
        }
    });
}
