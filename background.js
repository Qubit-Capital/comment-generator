// Background service worker
let linkedinSession = null;
let breakcoldSession = null;
let authCheckInterval = null;

// Initialize authentication check interval
function initAuthChecks() {
    // Clear existing interval if any
    if (authCheckInterval) {
        clearInterval(authCheckInterval);
    }

    // Check auth status every 5 minutes
    authCheckInterval = setInterval(checkAuthStatus, 5 * 60 * 1000);
    checkAuthStatus(); // Initial check
}

// Check authentication status
async function checkAuthStatus() {
    try {
        // Check LinkedIn auth
        const linkedinCookie = await chrome.cookies.get({
            url: 'https://www.linkedin.com',
            name: 'li_at'
        });
        
        linkedinSession = linkedinCookie ? linkedinCookie.value : null;

        // Check Breakcold auth
        const breakcoldCookie = await chrome.cookies.get({
            url: 'https://app.breakcold.com',
            name: 'session'
        });

        breakcoldSession = breakcoldCookie ? breakcoldCookie.value : null;

    } catch (error) {
        console.error('Error checking authentication:', error);
    }
}

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_PLATFORM_STATUS') {
        sendResponse({
            linkedin: !!linkedinSession,
            breakcold: !!breakcoldSession
        });
        return true;
    }

    if (request.type === 'GENERATE_COMMENTS') {
        handleCommentGeneration(request.data, sender.tab.id);
        return true;
    }
});

// Handle comment generation
async function handleCommentGeneration(data, tabId) {
    try {
        // Validate required data
        if (!data || !data.text || !data.platform) {
            throw new Error('Missing required data for comment generation');
        }

        // Send response back to content script
        chrome.tabs.sendMessage(tabId, {
            type: 'GENERATION_COMPLETE',
            data: {
                success: true,
                comments: data.comments
            }
        });

    } catch (error) {
        console.error('Error in comment generation:', error);
        chrome.tabs.sendMessage(tabId, {
            type: 'GENERATION_ERROR',
            error: error.message || 'Failed to generate comments'
        });
    }
}

// Initialize on extension load
initAuthChecks();
