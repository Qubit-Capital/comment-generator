/* serverInteractions.js
   This file centralizes all server interaction functions for the extension.
*/

// Function to send LinkedIn interaction data to the server
function sendLinkedinInteraction(interactionData) {
  // Retrieve the stored access token from chrome.storage.sync
  chrome.storage.sync.get('accessToken', (result) => {
    const accessToken = result.accessToken;
    if (!accessToken) {
      console.error('No access token found. Please set it in the extension settings.');
      return;
    }

    // Log masked token for debugging (only show last 4 chars)
    const maskedToken = '*'.repeat(accessToken.length - 4) + accessToken.slice(-4);
    console.log('Using access token:', maskedToken);

    // Construct payload using data from interactionData
    const payload = {
      post_text: interactionData.postMeta.postText || '',
      post_id: interactionData.postMeta.postId || '',
      linkedin_urn: interactionData.postMeta.linkedinUrn || '',
      target_profile_url: interactionData.postMeta.targetProfileUrl || ''
    };

    // Log the complete request details
    console.log('=== API Request Details ===');
    console.log('Endpoint:', 'https://agdcoeowduqueddyfqop.supabase.co/functions/v1/save-linkedin-interaction');
    console.log('Headers:', {
      'Authorization': `Bearer ${maskedToken}`,
      'Content-Type': 'application/json'
    });
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Make the POST request to the server endpoint
    fetch('https://agdcoeowduqueddyfqop.supabase.co/functions/v1/save-linkedin-interaction', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,  
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(async response => {
      // Log the complete response
      console.log('=== API Response ===');
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      
      // Try to get response body
      let responseBody;
      try {
        responseBody = await response.text();
        console.log('Response Body:', responseBody);
        
        // Try to parse as JSON if possible
        try {
          responseBody = JSON.parse(responseBody);
        } catch (e) {
          // Response wasn't JSON, keep as text
        }
      } catch (e) {
        console.log('Could not read response body');
      }

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${JSON.stringify(responseBody)}`);
      }
      
      return responseBody;
    })
    .then(data => {
      console.log('=== Success ===');
      console.log('Interaction saved successfully:', data);
    })
    .catch(error => {
      console.error('=== Error ===');
      console.error('Error saving interaction:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    });
  });
}
