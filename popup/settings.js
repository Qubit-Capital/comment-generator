document.addEventListener('DOMContentLoaded', () => {
  const tokenInput = document.getElementById('access-token');
  const saveButton = document.getElementById('save-token');
  const messageDiv = document.getElementById('message');

  // Load any previously saved token from chrome.storage.sync
  chrome.storage.sync.get('accessToken', (data) => {
    if (data.accessToken) {
      tokenInput.value = data.accessToken;
    }
  });

  // Save token when clicking the save button
  saveButton.addEventListener('click', () => {
    const token = tokenInput.value.trim();
    chrome.storage.sync.set({ accessToken: token }, () => {
      messageDiv.textContent = 'Access token saved!';
      setTimeout(() => { messageDiv.textContent = ''; }, 3000);
    });
  });
});
