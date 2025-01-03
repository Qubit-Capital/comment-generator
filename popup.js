// Handle analytics button click
document.getElementById('viewAnalytics').addEventListener('click', () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL('analytics.html')
    });
});
