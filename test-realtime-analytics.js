const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3000/api/analytics';
const WS_URL = 'ws://localhost:3000';

// Create WebSocket client
function createWebSocketClient() {
    const ws = new WebSocket(WS_URL);
    
    ws.on('open', () => {
        console.log('WebSocket connected');
        // Subscribe to all platforms
        ws.send(JSON.stringify({
            type: 'subscribe',
            data: { platform: 'all' }
        }));
    });

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('\nReceived real-time update:', JSON.stringify(message, null, 2));
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    return ws;
}

// Simulate analytics events
async function simulateEvents() {
    try {
        // Create sample post data
        const linkedInPostId = uuidv4();
        const breakColdPostId = uuidv4();

        // Test 1: LinkedIn Comment Generation
        console.log('\nSimulating LinkedIn comment generation...');
        const linkedInGenResponse = await axios.post(`${API_URL}/event`, {
            eventId: uuidv4(),
            type: 'generation',
            platform: 'linkedin',
            postId: linkedInPostId,
            data: {
                postId: linkedInPostId,
                postMetadata: {
                    url: 'https://linkedin.com/post/123',
                    authorName: 'John Doe',
                    postContent: 'Sample LinkedIn post content',
                    postType: 'text'
                },
                generatedComments: [
                    {
                        id: uuidv4(),
                        text: 'Great insights! Would love to learn more.',
                        tone: 'professional',
                        index: 0,
                        metrics: {
                            length: 42,
                            sentiment: 'positive',
                            keywords: ['insights', 'learn']
                        }
                    }
                ],
                performance: {
                    generationTime: 1500,
                    totalTime: 1500
                }
            },
            metadata: {
                browserInfo: 'Chrome/120.0.0',
                userAgent: 'Mozilla/5.0',
                timestamp: new Date()
            }
        });
        console.log('LinkedIn generation response:', linkedInGenResponse.data);

        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 2: LinkedIn Comment Selection
        console.log('\nSimulating LinkedIn comment selection...');
        const linkedInSelResponse = await axios.post(`${API_URL}/event`, {
            eventId: uuidv4(),
            type: 'selection',
            platform: 'linkedin',
            postId: linkedInPostId,
            data: {
                postId: linkedInPostId,
                selectedComment: {
                    id: uuidv4(),
                    text: 'Great insights! Would love to learn more.',
                    index: 0,
                    isRegenerated: false
                },
                performance: {
                    selectionTime: 3000,
                    totalTime: 3000
                }
            },
            metadata: {
                browserInfo: 'Chrome/120.0.0',
                userAgent: 'Mozilla/5.0',
                timestamp: new Date()
            }
        });
        console.log('LinkedIn selection response:', linkedInSelResponse.data);

        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 3: BreakCold Comment Generation
        console.log('\nSimulating BreakCold comment generation...');
        const breakColdGenResponse = await axios.post(`${API_URL}/event`, {
            eventId: uuidv4(),
            type: 'generation',
            platform: 'breakcold',
            postId: breakColdPostId,
            data: {
                postId: breakColdPostId,
                postMetadata: {
                    url: 'https://breakcold.com/message/456',
                    authorName: 'Jane Smith',
                    postContent: 'Sample BreakCold message content',
                    postType: 'text'
                },
                generatedComments: [
                    {
                        id: uuidv4(),
                        text: 'I noticed your experience in AI development.',
                        tone: 'professional',
                        index: 0,
                        metrics: {
                            length: 48,
                            sentiment: 'neutral',
                            keywords: ['AI', 'development', 'experience']
                        }
                    }
                ],
                performance: {
                    generationTime: 1200,
                    totalTime: 1200
                }
            },
            metadata: {
                browserInfo: 'Chrome/120.0.0',
                userAgent: 'Mozilla/5.0',
                timestamp: new Date()
            }
        });
        console.log('BreakCold generation response:', breakColdGenResponse.data);

        // Wait 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 4: Get Analytics Summary
        console.log('\nGetting analytics summary...');
        const response = await axios.get(`${API_URL}/summary`);
        console.log('Analytics Summary:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error('Error simulating events:', error.response?.data || error.message);
    }
}

// Run the tests
async function runTests() {
    // Create WebSocket client first
    const ws = createWebSocketClient();

    // Wait for WebSocket connection
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run simulation
    await simulateEvents();

    // Keep the connection open for a while to receive updates
    console.log('\nWaiting for real-time updates...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Close WebSocket connection
    ws.close();
    console.log('\nTest completed');
    process.exit(0);
}

runTests();
