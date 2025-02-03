document.addEventListener('DOMContentLoaded', () => {
  // Toggle settings panel visibility when settings button is clicked
  document.getElementById('toggleSettings').addEventListener('click', function() {
    var panel = document.getElementById('settingsPanel');
    if (panel.style.display === 'none' || panel.style.display === '') {
      panel.style.display = 'block';
      // Load stored access token
      chrome.storage.sync.get('accessToken', function(data) {
        if (data.accessToken) {
          document.getElementById('access-token').value = data.accessToken;
        }
      });
    } else {
      panel.style.display = 'none';
    }
  });

  // Save access token when user clicks the Save button
  document.getElementById('save-token').addEventListener('click', function() {
    var token = document.getElementById('access-token').value.trim();
    chrome.storage.sync.set({ accessToken: token }, function() {
      var msg = document.getElementById('settings-message');
      msg.textContent = 'Access token saved!';
      setTimeout(function() { msg.textContent = ''; }, 3000);
    });
  });
});
