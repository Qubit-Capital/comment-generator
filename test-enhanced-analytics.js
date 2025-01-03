const { connectDB, disconnectDB } = require('./db/config');
const { 
    recordLinkedInGeneration, 
    recordBreakColdGeneration,
    getAnalyticsSummary
} = require('./db/analytics-operations');

async function testEnhancedAnalytics() {
    try {
        // Connect to MongoDB
        await connectDB();
        console.log('Connected to MongoDB');

        // Test LinkedIn analytics with enhanced metrics
        console.log('\nTesting LinkedIn analytics...');
        await recordLinkedInGeneration({
            userId: 'test-user-1',
            tone: 'professional',
            modelVersion: '1.0.3',
            generationTime: 1500,
            confidence: 0.85,
            hasError: false,
            tokensUsed: 150,
            responseTime: 2000,
            isReturningUser: false
        });
        
        // Test BreakCold analytics with enhanced metrics
        console.log('\nTesting BreakCold analytics...');
        await recordBreakColdGeneration({
            userId: 'test-user-2',
            tone: 'formal',
            modelVersion: '1.0.3',
            generationTime: 1200,
            confidence: 0.9,
            hasError: false,
            tokensUsed: 120,
            responseTime: 1800,
            isReturningUser: true,
            campaignId: 'test-campaign-1',
            messagesInCampaign: 5,
            campaignSuccess: true
        });

        // Get analytics summary for both platforms
        console.log('\nGetting LinkedIn Analytics Summary (Last 30 days):');
        const linkedInSummary = await getAnalyticsSummary('linkedin');
        console.log(JSON.stringify(linkedInSummary, null, 2));

        console.log('\nGetting BreakCold Analytics Summary (Last 30 days):');
        const breakColdSummary = await getAnalyticsSummary('breakcold');
        console.log(JSON.stringify(breakColdSummary, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        // Disconnect from MongoDB
        await disconnectDB();
        console.log('\nDisconnected from MongoDB');
    }
}

// Run the test
testEnhancedAnalytics();
