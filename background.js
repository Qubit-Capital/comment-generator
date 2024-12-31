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
  if (request.type === 'GET_AUTH_STATUS') {
    sendResponse({
      linkedinAuth: linkedinSession !== null,
      breakcoldAuth: breakcoldSession !== null
    });
    return true;
  }

  if (request.type === 'GENERATE_COMMENT') {
    handleCommentGeneration(request.data)
      .then(response => sendResponse({ success: true, data: response }))
      .catch(error => {
        console.error('Comment generation failed:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Failed to generate comment'
        });
      });
    return true;
  }
});

// Handle comment generation
async function handleCommentGeneration(data) {
  try {
    // Check auth status before making request
    if (data.platform === 'linkedin' && !linkedinSession) {
      throw new Error('LinkedIn authentication required');
    } else if (data.platform === 'breakcold' && !breakcoldSession) {
      throw new Error('Breakcold authentication required');
    }

    const apiUrl = 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.platform === 'linkedin' ? linkedinSession : breakcoldSession}`
      },
      body: JSON.stringify({
        text: data.postText,
        platform: data.platform
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to generate comment');
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Initialize on extension load
initAuthChecks();
