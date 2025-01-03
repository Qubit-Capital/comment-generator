const axios = require('axios');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const LinkedInAnalytics = require('./db/schemas/LinkedInAnalytics');
const BreakColdAnalytics = require('./db/schemas/BreakColdAnalytics');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/comment-generator';
const API_URL = 'http://localhost:3000';

// Test event data
const linkedInEvent = {
    eventId: uuidv4(),
    postId: 'post123',
    type: 'selection',
    platform: 'linkedin',
    data: {
        sourcePost: {
            text: 'Test LinkedIn post',
            metrics: {
                length: 100,
                sentiment: 'neutral',
                keywords: ['test', 'linkedin']
            }
        },
        generatedComments: [{
            id: 'comment1',
            text: 'Test comment',
            tone: 'professional',
            metrics: {
                length: 50,
                sentiment: 'positive',
                keywords: ['test']
            }
        }],
        selectedComment: {
            id: 'comment1',
            text: 'Test comment',
            index: 0,
            metrics: {
                length: 50,
                sentiment: 'positive',
                keywords: ['test']
            }
        }
    },
    performance: {
        generationTime: 1.5,
        selectionTime: 0.5,
        totalTime: 2.0
    },
    metadata: {
        browserInfo: 'test-browser',
        userAgent: 'test-agent',
        timestamp: new Date(),
        url: 'https://linkedin.com/test',
        completionType: 'selection'
    }
};

const breakColdEvent = {
    eventId: uuidv4(),
    postId: 'post456',
    type: 'selection',
    platform: 'breakcold',
    data: {
        sourcePost: {
            text: 'Test BreakCold post',
            metrics: {
                length: 150,
                sentiment: 'neutral',
                keywords: ['test', 'breakcold']
            }
        },
        generatedComments: [{
            id: 'comment2',
            text: 'Test comment',
            tone: 'professional',
            metrics: {
                length: 75,
                sentiment: 'positive',
                keywords: ['test']
            }
        }],
        selectedComment: {
            id: 'comment2',
            text: 'Test comment',
            index: 0,
            metrics: {
                length: 75,
                sentiment: 'positive',
                keywords: ['test']
            }
        }
    },
    performance: {
        generationTime: 2.0,
        selectionTime: 1.0,
        totalTime: 3.0
    },
    metadata: {
        browserInfo: 'test-browser',
        userAgent: 'test-agent',
        timestamp: new Date(),
        url: 'https://app.breakcold.com/test',
        completionType: 'selection',
        campaignId: 'campaign123'
    }
};

async function verifyCollections() {
    console.log('\nVerifying MongoDB collections...');
    
    const linkedInDocs = await LinkedInAnalytics.find().sort({ createdAt: -1 }).limit(1);
    console.log('\nLatest LinkedIn document:', JSON.stringify(linkedInDocs[0], null, 2));
    
    const breakColdDocs = await BreakColdAnalytics.find().sort({ createdAt: -1 }).limit(1);
    console.log('\nLatest BreakCold document:', JSON.stringify(breakColdDocs[0], null, 2));
}

async function runTest() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Send LinkedIn test event
        console.log('Sending LinkedIn test event...');
        const linkedInResponse = await axios.post(`${API_URL}/api/analytics/event`, {
            event: linkedInEvent
        });
        console.log('LinkedIn response:', linkedInResponse.data);

        // Send BreakCold test event
        console.log('Sending BreakCold test event...');
        const breakColdResponse = await axios.post(`${API_URL}/api/analytics/event`, {
            event: breakColdEvent
        });
        console.log('BreakCold response:', breakColdResponse.data);

        // Verify collections
        await verifyCollections();

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        await mongoose.connection.close();
        process.exit(1);
    }
}

runTest();
