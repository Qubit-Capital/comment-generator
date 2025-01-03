const { connectDB, disconnectDB } = require('./db/config');
const { 
    recordLinkedInGeneration, 
    recordBreakColdGeneration, 
    getAnalytics, 
    getTodayAnalytics 
} = require('./db/analytics-operations');

async function testAnalytics() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');

        // Test LinkedIn analytics
        console.log('\nTesting LinkedIn analytics...');
        await recordLinkedInGeneration({
            tone: 'professional',
            modelVersion: '1.0.3',
            generationTime: 1500,
            confidence: 0.85,
            hasError: false
        });
        
        const linkedInAnalytics = await getTodayAnalytics('linkedin');
        console.log('LinkedIn Analytics:', JSON.stringify(linkedInAnalytics, null, 2));

        // Test BreakCold analytics
        console.log('\nTesting BreakCold analytics...');
        await recordBreakColdGeneration({
            tone: 'formal',
            modelVersion: '1.0.3',
            generationTime: 1200,
            confidence: 0.9,
            hasError: false
        });

        const breakColdAnalytics = await getTodayAnalytics('breakcold');
        console.log('BreakCold Analytics:', JSON.stringify(breakColdAnalytics, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Disconnect from MongoDB
        await disconnectDB();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the test
testAnalytics();
