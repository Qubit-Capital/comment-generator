import { MongoClient } from 'mongodb';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

async function clearTestData(client) {
    try {
        // Drop the entire database
        await client.db('comment-generator').dropDatabase();
        console.log('Database dropped');
    } catch (error) {
        console.error('Error dropping database:', error);
        throw error;
    }
}

async function runTest() {
    let client;
    try {
        client = await MongoClient.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        await clearTestData(client);
        console.log('Cleared test data');

        // Simulate the analytics observer
        const analyticsObserver = {
            ANALYTICS_SERVER: 'http://localhost:3000/api/analytics',
            async sendToServer(payload) {
                const response = await fetch(`${this.ANALYTICS_SERVER}/event`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Server error (${response.status}): ${errorText}`);
                }
                return response.json();
            }
        };

        // Test Case 1: Initial Comment Generation
        console.log('\nTest Case 1: Initial Comment Generation');
        const initialEvent = {
            eventId: '123',
            postId: 'post123',
            type: 'generation',
            platform: 'linkedin',
            data: {
                sourcePost: {
                    text: 'This is a test post',
                    metrics: {
                        length: 18,
                        sentiment: 'neutral',
                        keywords: ['test']
                    }
                },
                generatedComments: [
                    {
                        id: 'comment1',
                        text: 'First comment',
                        tone: 'neutral',
                        isRegenerated: false,
                        metrics: {
                            length: 12,
                            sentiment: 'neutral',
                            keywords: ['first']
                        }
                    }
                ],
                regenerationHistory: []
            },
            metadata: {
                url: 'http://test.com',
                browserInfo: 'test-browser',
                timestamp: new Date().toISOString(),
                completionType: 'no_selection',
                sessionId: 'test-session'
            }
        };
        await analyticsObserver.sendToServer({ event: initialEvent });
        console.log('Initial generation recorded');

        // Test Case 2: Regeneration
        console.log('\nTest Case 2: Regeneration');
        const regenerationEvent = {
            eventId: '124',
            postId: 'post123',
            type: 'generation',
            platform: 'linkedin',
            data: {
                sourcePost: initialEvent.data.sourcePost,
                generatedComments: [
                    {
                        id: 'comment2',
                        text: 'Regenerated comment',
                        tone: 'neutral',
                        isRegenerated: true,
                        regenerationId: 'regen1',
                        previousComments: initialEvent.data.generatedComments,
                        metrics: {
                            length: 19,
                            sentiment: 'neutral',
                            keywords: ['regenerated']
                        }
                    }
                ],
                regenerationHistory: [{
                    regenerationId: 'regen1',
                    timestamp: new Date().toISOString(),
                    previousComments: initialEvent.data.generatedComments,
                    newComments: [{
                        id: 'comment2',
                        text: 'Regenerated comment',
                        tone: 'neutral',
                        metrics: {
                            length: 19,
                            sentiment: 'neutral',
                            keywords: ['regenerated']
                        }
                    }],
                    selectedAfterRegeneration: false,
                    selectedCommentIndex: null
                }]
            },
            metadata: {
                url: 'http://test.com',
                browserInfo: 'test-browser',
                timestamp: new Date().toISOString(),
                completionType: 'no_selection',
                sessionId: 'test-session'
            }
        };
        await analyticsObserver.sendToServer({ event: regenerationEvent });
        console.log('Regeneration recorded');

        // Test Case 3: Selection of Regenerated Comment
        console.log('\nTest Case 3: Selection of Regenerated Comment');
        const selectionEvent = {
            eventId: '125',
            postId: 'post123',
            type: 'selection',
            platform: 'linkedin',
            data: {
                sourcePost: initialEvent.data.sourcePost,
                generatedComments: regenerationEvent.data.generatedComments,
                selectedComment: {
                    id: 'comment2',
                    text: 'Regenerated comment',
                    index: 0,
                    isRegenerated: true,
                    regenerationId: 'regen1',
                    metrics: {
                        length: 19,
                        sentiment: 'neutral',
                        keywords: ['regenerated']
                    }
                },
                regenerationHistory: [{
                    regenerationId: 'regen1',
                    timestamp: regenerationEvent.data.regenerationHistory[0].timestamp,
                    previousComments: regenerationEvent.data.regenerationHistory[0].previousComments,
                    newComments: regenerationEvent.data.regenerationHistory[0].newComments,
                    selectedAfterRegeneration: true,
                    selectedCommentIndex: 0
                }]
            },
            metadata: {
                url: 'http://test.com',
                browserInfo: 'test-browser',
                timestamp: new Date().toISOString(),
                completionType: 'selection',
                sessionId: 'test-session'
            }
        };
        await analyticsObserver.sendToServer({ event: selectionEvent });
        console.log('Selection recorded');

        // Wait for MongoDB to process the events
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify the data
        console.log('\nVerifying data...');
        const db = client.db('comment-generator');
        
        const eventAnalytics = await db.collection('eventanalytics').find({}).toArray();
        console.log('\nEventAnalytics records:', eventAnalytics.length);
        console.log('Has regeneration history:', eventAnalytics.some(e => e.data?.regenerationHistory?.length > 0));
        
        const linkedInAnalytics = await db.collection('linkedinanalytics').find({}).toArray();
        console.log('\nLinkedInAnalytics records:', linkedInAnalytics.length);
        console.log('Has regeneration history:', linkedInAnalytics.some(e => e.data?.regenerationHistory?.length > 0));
        
        // Check regeneration tracking
        const eventsWithRegeneration = linkedInAnalytics.filter(e => e.data?.regenerationHistory?.length > 0);
        console.log('\nEvents with regeneration:', eventsWithRegeneration.length);
        
        const selectedRegenerations = linkedInAnalytics.filter(e => 
            e.data?.regenerationHistory?.some(h => h.selectedAfterRegeneration)
        );
        console.log('Events with selected regenerations:', selectedRegenerations.length);

        // Detailed verification
        console.log('\nDetailed verification:');
        const regenerationEventFound = eventsWithRegeneration[0];
        if (regenerationEventFound) {
            console.log('Regeneration event found:');
            console.log('- Has previousComments:', regenerationEventFound.data.regenerationHistory[0].previousComments.length > 0);
            console.log('- Has newComments:', regenerationEventFound.data.regenerationHistory[0].newComments.length > 0);
            console.log('- Has metrics:', !!regenerationEventFound.data.regenerationHistory[0].previousComments[0]?.metrics);
        }

        console.log('\nTest completed');
    } catch (error) {
        console.error('Test failed:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

runTest().catch(console.error);
