// Helper function to get today's date with time set to midnight
function getTodayDate() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

// Helper function to get current hour (0-23)
function getCurrentHour() {
    return new Date().getHours();
}

module.exports = {
    getTodayDate,
    getCurrentHour
};
