// Chart instances
let generationsChart = null;
let toneChart = null;
let hourlyChart = null;
let errorChart = null;

// Colors for charts
const chartColors = {
    blue: 'rgba(66, 153, 225, 0.8)',
    green: 'rgba(72, 187, 120, 0.8)',
    purple: 'rgba(159, 122, 234, 0.8)',
    orange: 'rgba(237, 137, 54, 0.8)',
    red: 'rgba(245, 101, 101, 0.8)'
};

// Initialize the dashboard
async function initDashboard() {
    const platform = document.getElementById('platformSelect').value;
    const days = parseInt(document.getElementById('timeRangeSelect').value);
    await fetchAndDisplayAnalytics(platform, days);
}

// Fetch analytics data from the background script
async function fetchAnalytics(platform, days) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            type: 'GET_ANALYTICS',
            data: { platform, days }
        }, response => {
            resolve(response);
        });
    });
}

// Update key metrics
function updateKeyMetrics(data) {
    // Update total generations
    document.getElementById('totalGenerations').textContent = data.totalGenerations.toLocaleString();
    
    // Update success rate
    const successRate = (data.totalSelections / data.totalGenerations * 100) || 0;
    document.getElementById('successRate').textContent = `${successRate.toFixed(1)}%`;
    
    // Update average response time
    document.getElementById('avgResponseTime').textContent = `${data.avgGenerationTime.toFixed(0)}ms`;
    
    // Update unique posts
    document.getElementById('userGrowth').textContent = data.uniquePosts.toLocaleString();

    // Update post samples
    const postSamplesContainer = document.getElementById('postSamples');
    if (postSamplesContainer) {
        postSamplesContainer.innerHTML = data.postSamples.map(post => `
            <div class="post-sample">
                <div class="post-text">${post.text}</div>
                <div class="post-metrics">
                    <span class="metric">Length: ${post.metrics.length}</span>
                    <span class="metric">Sentiment: ${post.metrics.sentiment}</span>
                    <span class="metric">Keywords: ${post.metrics.keywords.join(', ')}</span>
                </div>
                <div class="post-stats">
                    <span class="stat">Generations: ${post.generations}</span>
                    <span class="stat">Selections: ${post.selections}</span>
                </div>
            </div>
        `).join('');
    }
}

// Create or update the generations chart
function updateGenerationsChart(data) {
    const ctx = document.getElementById('generationsChart').getContext('2d');
    
    if (generationsChart) {
        generationsChart.destroy();
    }
    
    generationsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Generations',
                data: data.generations,
                borderColor: chartColors.blue,
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create or update the tone distribution chart
function updateToneChart(data) {
    const ctx = document.getElementById('toneChart').getContext('2d');
    
    if (toneChart) {
        toneChart.destroy();
    }
    
    const tones = Object.keys(data.popularTones);
    const counts = Object.values(data.popularTones);
    
    toneChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: tones,
            datasets: [{
                data: counts,
                backgroundColor: Object.values(chartColors)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

// Create or update the hourly usage chart
function updateHourlyChart(data) {
    const ctx = document.getElementById('hourlyChart').getContext('2d');
    
    if (hourlyChart) {
        hourlyChart.destroy();
    }
    
    const hours = Array.from({length: 24}, (_, i) => i);
    const counts = hours.map(hour => data.hourlyDistribution[hour] || 0);
    
    hourlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours.map(h => `${h}:00`),
            datasets: [{
                label: 'Usage',
                data: counts,
                backgroundColor: chartColors.purple
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create or update the error distribution chart
function updateErrorChart(data) {
    const ctx = document.getElementById('errorChart').getContext('2d');
    
    if (errorChart) {
        errorChart.destroy();
    }
    
    errorChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.errorTypes,
            datasets: [{
                label: 'Errors',
                data: data.errorCounts,
                backgroundColor: chartColors.red
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Fetch and display all analytics
async function fetchAndDisplayAnalytics(platform, days) {
    try {
        const data = await fetchAnalytics(platform, days);
        
        // Update all visualizations
        updateKeyMetrics(data);
        updateGenerationsChart(data);
        updateToneChart(data);
        updateHourlyChart(data);
        updateErrorChart(data);
        
    } catch (error) {
        console.error('Error fetching analytics:', error);
        // Show error message to user
    }
}

// Export data as CSV
function exportAsCSV(data) {
    const platform = document.getElementById('platformSelect').value;
    const timeRange = document.getElementById('timeRangeSelect').value;
    
    // Prepare CSV content
    const csvRows = [];
    
    // Add header
    csvRows.push([
        'Date',
        'Total Generations',
        'Successful Generations',
        'Failed Generations',
        'Average Response Time (ms)',
        'Success Rate (%)',
        'Unique Users',
        'Popular Tones',
        'Error Rate (%)'
    ].join(','));
    
    // Add data rows
    data.dates.forEach((date, index) => {
        csvRows.push([
            date,
            data.generations[index],
            data.successfulGenerations[index],
            data.failedGenerations[index],
            data.responseTime[index].toFixed(2),
            ((data.successfulGenerations[index] / data.generations[index]) * 100).toFixed(2),
            data.uniqueUsers[index],
            Object.entries(data.popularTones).map(([tone, count]) => `${tone}:${count}`).join(';'),
            ((data.failedGenerations[index] / data.generations[index]) * 100).toFixed(2)
        ].join(','));
    });
    
    // Create and download CSV file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${platform}_analytics_${timeRange}days.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Export data as JSON
function exportAsJSON(data) {
    const platform = document.getElementById('platformSelect').value;
    const timeRange = document.getElementById('timeRangeSelect').value;
    
    // Create formatted JSON object
    const jsonData = {
        platform,
        timeRange: `${timeRange} days`,
        exportDate: new Date().toISOString(),
        metrics: {
            totalGenerations: data.totalGenerations,
            successRate: data.successRate,
            averageResponseTime: data.averageResponseTime,
            userGrowth: data.userGrowth,
            errorRate: data.errorRate
        },
        dailyData: data.dates.map((date, index) => ({
            date,
            generations: data.generations[index],
            successfulGenerations: data.successfulGenerations[index],
            failedGenerations: data.failedGenerations[index],
            responseTime: data.responseTime[index],
            uniqueUsers: data.uniqueUsers[index]
        })),
        toneDistribution: data.popularTones,
        hourlyDistribution: data.hourlyDistribution,
        errorTypes: data.errorTypes.map((type, index) => ({
            type,
            count: data.errorCounts[index]
        }))
    };
    
    // Create and download JSON file
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${platform}_analytics_${timeRange}days.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Event Listeners
document.getElementById('platformSelect').addEventListener('change', initDashboard);
document.getElementById('timeRangeSelect').addEventListener('change', initDashboard);
document.getElementById('refreshBtn').addEventListener('click', initDashboard);
document.getElementById('exportCSV').addEventListener('click', () => {
    const platform = document.getElementById('platformSelect').value;
    const days = parseInt(document.getElementById('timeRangeSelect').value);
    fetchAnalytics(platform, days).then(data => exportAsCSV(data));
});
document.getElementById('exportJSON').addEventListener('click', () => {
    const platform = document.getElementById('platformSelect').value;
    const days = parseInt(document.getElementById('timeRangeSelect').value);
    fetchAnalytics(platform, days).then(data => exportAsJSON(data));
});

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', initDashboard);
