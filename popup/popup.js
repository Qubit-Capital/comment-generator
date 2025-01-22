document.addEventListener('DOMContentLoaded', function() {
    // Initialize platform status
    updatePlatformStatus();
});

async function updatePlatformStatus() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'CHECK_PLATFORM_STATUS'
        });
        
        if (response.error) {
            throw new Error(response.error);
        }
        
        // Update platform status indicators
        const platforms = ['linkedin', 'breakcold'];
        platforms.forEach(platform => {
            const statusElement = document.getElementById(`${platform}Status`);
            if (statusElement) {
                const isEnabled = response[platform] === true;
                statusElement.textContent = isEnabled ? 'Enabled' : 'Disabled';
                statusElement.className = `status-badge ${isEnabled ? 'enabled' : 'disabled'}`;
            }
        });
        
    } catch (error) {
        console.error('Error checking platform status:', error);
        // Show error in UI
        const platforms = ['linkedin', 'breakcold'];
        platforms.forEach(platform => {
            const statusElement = document.getElementById(`${platform}Status`);
            if (statusElement) {
                statusElement.textContent = 'Error';
                statusElement.className = 'status-badge error';
            }
        });
    }
}
