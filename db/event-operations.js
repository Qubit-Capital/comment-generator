const EventAnalytics = require('./schemas/EventAnalytics');

/**
 * Record a new event
 * @param {Object} event - The event object from analytics-observer
 */
async function recordEvent(event) {
    try {
        const eventDoc = new EventAnalytics(event);
        await eventDoc.save();
        return eventDoc;
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error - event already exists
            console.log('Event already recorded:', error.keyValue);
            return null;
        }
        throw error;
    }
}

/**
 * Get combined events for a post
 * @param {string} postId - The post ID to get events for
 */
async function getPostEvents(postId) {
    return EventAnalytics.getCombinedEvents({ postId });
}

/**
 * Get combined events for a platform within a date range
 * @param {string} platform - The platform to get events for
 * @param {Date} startDate - Start date for the range
 * @param {Date} endDate - End date for the range
 */
async function getPlatformEvents(platform, startDate, endDate) {
    const query = {
        platform,
        'metadata.timestamp': {
            $gte: startDate,
            $lte: endDate
        }
    };
    return EventAnalytics.getCombinedEvents(query);
}

/**
 * Get event statistics for a platform
 * @param {string} platform - The platform to get stats for
 * @param {Date} startDate - Start date for the range
 * @param {Date} endDate - End date for the range
 */
async function getEventStats(platform, startDate, endDate) {
    const events = await EventAnalytics.aggregate([
        {
            $match: {
                platform,
                'metadata.timestamp': {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: '$postId',
                generationCount: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'generation'] }, 1, 0]
                    }
                },
                selectionCount: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'selection'] }, 1, 0]
                    }
                },
                avgGenerationTime: {
                    $avg: '$performance.generationTime'
                },
                avgSelectionTime: {
                    $avg: '$performance.selectionTime'
                },
                postText: { $first: '$data.sourcePost.text' },
                postMetrics: { 
                    $first: {
                        length: '$data.sourcePost.metrics.length',
                        sentiment: '$data.sourcePost.metrics.sentiment',
                        keywords: '$data.sourcePost.metrics.keywords'
                    }
                },
                commentLengths: {
                    $push: {
                        $cond: [
                            { $eq: ['$type', 'generation'] },
                            '$data.generatedComments.metrics.length',
                            []
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                uniquePosts: { $literal: 1 },
                generationCount: 1,
                selectionCount: 1,
                avgGenerationTime: 1,
                avgSelectionTime: 1,
                postText: 1,
                postMetrics: 1,
                avgCommentLength: {
                    $avg: {
                        $reduce: {
                            input: { $flatten: '$commentLengths' },
                            initialValue: 0,
                            in: { $add: ['$$value', '$$this'] }
                        }
                    }
                }
            }
        }
    ]);

    return {
        totalGenerations: events.reduce((sum, e) => sum + e.generationCount, 0),
        totalSelections: events.reduce((sum, e) => sum + e.selectionCount, 0),
        avgGenerationTime: events.reduce((sum, e) => sum + e.avgGenerationTime, 0) / events.length,
        avgSelectionTime: events.reduce((sum, e) => sum + e.avgSelectionTime, 0) / events.length,
        uniquePosts: events.length,
        postSamples: events.map(e => ({
            text: e.postText,
            metrics: e.postMetrics,
            generations: e.generationCount,
            selections: e.selectionCount
        })).slice(0, 10), // Get last 10 posts as samples
        avgCommentLength: events.reduce((sum, e) => sum + (e.avgCommentLength || 0), 0) / events.length
    };
}

module.exports = {
    recordEvent,
    getPostEvents,
    getPlatformEvents,
    getEventStats
};
