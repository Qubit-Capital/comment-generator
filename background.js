// Background service worker
const { connectDB } = require('./db/config');
const { 
  recordLinkedInGeneration, 
  recordBreakColdGeneration, 
  recordError,
  recordGenerationEvent,
  recordErrorEvent,
  getAnalyticsSummary
} = require('./db/analytics-operations');

let linkedinSession = null;
let breakcoldSession = null;
let authCheckInterval = null;

// Initialize MongoDB connection
async function initMongoDB() {
  try {
    await connectDB();
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    recordError('mongodb', 'connection_failed');
  }
}

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

    // Notify any listeners of auth status change
    chrome.runtime.sendMessage({
      type: 'AUTH_STATUS_CHANGED',
      data: {
        linkedinAuth: linkedinSession !== null,
        breakcoldAuth: breakcoldSession !== null
      }
    }).catch(() => {}); // Ignore errors if no listeners
  } catch (error) {
    console.error('Auth check failed:', error);
  }
}

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'OPEN_ANALYTICS') {
    // Get the platform from the request data or default to 'all'
    const platform = request.data?.platform || 'all';
    
    // Open analytics page in a new tab
    chrome.tabs.create({
      url: chrome.runtime.getURL(`analytics.html?platform=${platform}`)
    });
    return true;
  }

  if (request.type === 'GET_AUTH_STATUS') {
    sendResponse({
      linkedinAuth: linkedinSession !== null,
      breakcoldAuth: breakcoldSession !== null
    });
    return true;
  }

  if (request.type === 'GENERATE_COMMENTS') {
    handleCommentGeneration(request.data, sender.tab.id)
      .then(async (response) => {
        // Record successful generation
        await recordGenerationEvent({
          platform: request.data.platform,
          userId: request.data.userId || 'anonymous',
          success: true,
          responseTime: Date.now() - request.data.timestamp,
          tokensUsed: response.tokensUsed || 0,
          toneUsed: response.tone || 'neutral'
        });
        sendResponse(response);
      })
      .catch(async (error) => {
        // Record error event
        await recordErrorEvent({
          platform: request.data.platform,
          errorType: error.name,
          errorMessage: error.message,
          userId: request.data.userId || 'anonymous'
        });
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (request.type === 'GET_ANALYTICS') {
    getAnalyticsSummary(request.data.platform, request.data.days)
      .then(summary => {
        sendResponse(summary);
      })
      .catch(error => {
        console.error('Error fetching analytics:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
});

// Handle comment generation
async function handleCommentGeneration(data, tabId) {
  const { platform, prompt, tone } = data;
  const startTime = Date.now();
  let success = false;
  let confidence = 0;
  
  try {
    let response;
    if (platform === 'linkedin') {
      if (!linkedinSession) {
        throw new Error('LinkedIn authentication required');
      }
      response = await generateLinkedInComment(prompt, tone);
      success = true;
      confidence = response.confidence || 0;
      
      // Record LinkedIn analytics
      await recordLinkedInGeneration({
        tone,
        modelVersion: '1.0.3',
        generationTime: Date.now() - startTime,
        confidence,
        hasError: !success
      });
    } else if (platform === 'breakcold') {
      if (!breakcoldSession) {
        throw new Error('BreakCold authentication required');
      }
      response = await generateBreakColdMessage(prompt, tone);
      success = true;
      confidence = response.confidence || 0;
      
      // Record BreakCold analytics
      await recordBreakColdGeneration({
        tone,
        modelVersion: '1.0.3',
        generationTime: Date.now() - startTime,
        confidence,
        hasError: !success
      });
    }

    return response;
  } catch (error) {
    console.error(`${platform} generation error:`, error);
    await recordError(platform, error.message);
    throw error;
  }
}

// Initialize on extension load
initMongoDB();
initAuthChecks();
