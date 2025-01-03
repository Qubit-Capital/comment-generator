const mongoose = require('mongoose');
const LinkedInAnalytics = require('./schemas/LinkedInAnalytics');
const BreakColdAnalytics = require('./schemas/BreakColdAnalytics');
const EventAnalytics = require('./schemas/EventAnalytics');
const { v4: uuidv4 } = require('uuid');

/**
 * Transform event data for platform-specific analytics
 */
function transformEventData(params) {
    return {
        eventId: params.eventId,
        postId: params.postId,
        date: new Date(params.metadata.timestamp),
        timestamp: new Date(params.metadata.timestamp),
        rawData: {
            post: params.data.sourcePost,
            comments: params.data.generatedComments.map(comment => ({
                id: comment.id,
                text: comment.text,
                tone: comment.tone,
                isRegenerated: comment.isRegenerated,
                regenerationId: comment.regenerationId,
                previousComments: comment.previousComments?.map(c => ({
                    id: c.id,
                    text: c.text,
                    tone: c.tone,
                    metrics: c.metrics
                })),
                metrics: comment.metrics
            })),
            selectedComment: params.data.selectedComment && {
                id: params.data.selectedComment.id,
                text: params.data.selectedComment.text,
                index: params.data.selectedComment.index,
                isRegenerated: params.data.selectedComment.isRegenerated,
                regenerationId: params.data.selectedComment.regenerationId,
                metrics: params.data.selectedComment.metrics
            },
            regenerationHistory: params.data.regenerationHistory?.map(history => ({
                regenerationId: history.regenerationId,
                timestamp: new Date(history.timestamp),
                previousComments: history.previousComments?.map(c => ({
                    id: c.id,
                    text: c.text,
                    tone: c.tone,
                    metrics: c.metrics
                })),
                newComments: history.newComments?.map(c => ({
                    id: c.id,
                    text: c.text,
                    tone: c.tone,
                    metrics: c.metrics
                })),
                selectedAfterRegeneration: history.selectedAfterRegeneration,
                selectedCommentIndex: history.selectedCommentIndex
            })),
            performance: params.performance
        },
        metadata: {
            userAgent: params.metadata.browserInfo,
            url: params.metadata.url,
            completionType: params.metadata.completionType
        }
    };
}

/**
 * Record a LinkedIn event (generation, selection, or regeneration)
 */
async function recordLinkedInEvent(params) {
    try {
        // First record in EventAnalytics
        const eventAnalytics = new EventAnalytics({
            eventId: params.eventId,
            postId: params.postId,
            type: params.type,
            platform: 'linkedin',
            data: {
                sourcePost: params.data.sourcePost,
                generatedComments: params.data.generatedComments.map(comment => ({
                    id: comment.id,
                    text: comment.text,
                    tone: comment.tone,
                    isRegenerated: comment.isRegenerated,
                    regenerationId: comment.regenerationId,
                    previousComments: comment.previousComments?.map(c => ({
                        id: c.id,
                        text: c.text,
                        tone: c.tone,
                        metrics: c.metrics
                    })),
                    metrics: comment.metrics
                })),
                selectedComment: params.data.selectedComment && {
                    id: params.data.selectedComment.id,
                    text: params.data.selectedComment.text,
                    index: params.data.selectedComment.index,
                    isRegenerated: params.data.selectedComment.isRegenerated,
                    regenerationId: params.data.selectedComment.regenerationId,
                    metrics: params.data.selectedComment.metrics
                },
                regenerationHistory: params.data.regenerationHistory?.map(history => ({
                    regenerationId: history.regenerationId,
                    timestamp: new Date(history.timestamp),
                    previousComments: history.previousComments?.map(c => ({
                        id: c.id,
                        text: c.text,
                        tone: c.tone,
                        metrics: c.metrics
                    })),
                    newComments: history.newComments?.map(c => ({
                        id: c.id,
                        text: c.text,
                        tone: c.tone,
                        metrics: c.metrics
                    })),
                    selectedAfterRegeneration: history.selectedAfterRegeneration,
                    selectedCommentIndex: history.selectedCommentIndex
                }))
            },
            metadata: {
                url: params.metadata.url,
                browserInfo: params.metadata.browserInfo,
                timestamp: new Date(params.metadata.timestamp),
                completionType: params.metadata.completionType
            },
            performance: params.performance
        });
        await eventAnalytics.save();

        // Transform for LinkedIn-specific analytics
        const linkedInParams = transformEventData(params);
        const event = new LinkedInAnalytics(linkedInParams);
        await event.save();
        
        return { eventAnalytics, linkedInEvent: event };
    } catch (error) {
        console.error('Error recording LinkedIn event:', error);
        throw error;
    }
}

/**
 * Record a BreakCold event (generation, selection, or regeneration)
 */
async function recordBreakColdEvent(params) {
    try {
        // First record in EventAnalytics
        const eventAnalytics = new EventAnalytics({
            eventId: params.eventId,
            postId: params.postId,
            type: params.type,
            platform: 'breakcold',
            data: {
                sourcePost: params.data.sourcePost,
                generatedComments: params.data.generatedComments.map(comment => ({
                    id: comment.id,
                    text: comment.text,
                    tone: comment.tone,
                    isRegenerated: comment.isRegenerated,
                    regenerationId: comment.regenerationId,
                    previousComments: comment.previousComments?.map(c => ({
                        id: c.id,
                        text: c.text,
                        tone: c.tone,
                        metrics: c.metrics
                    })),
                    metrics: comment.metrics
                })),
                selectedComment: params.data.selectedComment && {
                    id: params.data.selectedComment.id,
                    text: params.data.selectedComment.text,
                    index: params.data.selectedComment.index,
                    isRegenerated: params.data.selectedComment.isRegenerated,
                    regenerationId: params.data.selectedComment.regenerationId,
                    metrics: params.data.selectedComment.metrics
                },
                regenerationHistory: params.data.regenerationHistory?.map(history => ({
                    regenerationId: history.regenerationId,
                    timestamp: new Date(history.timestamp),
                    previousComments: history.previousComments?.map(c => ({
                        id: c.id,
                        text: c.text,
                        tone: c.tone,
                        metrics: c.metrics
                    })),
                    newComments: history.newComments?.map(c => ({
                        id: c.id,
                        text: c.text,
                        tone: c.tone,
                        metrics: c.metrics
                    })),
                    selectedAfterRegeneration: history.selectedAfterRegeneration,
                    selectedCommentIndex: history.selectedCommentIndex
                }))
            },
            metadata: {
                url: params.metadata.url,
                browserInfo: params.metadata.browserInfo,
                timestamp: new Date(params.metadata.timestamp),
                completionType: params.metadata.completionType
            },
            performance: params.performance
        });
        await eventAnalytics.save();

        // Transform for BreakCold-specific analytics
        const breakColdParams = {
            ...transformEventData(params),
            campaignId: params.metadata.campaignId
        };

        console.log('Creating BreakCold event with params:', JSON.stringify({
            eventId: breakColdParams.eventId,
            campaignId: breakColdParams.campaignId,
            metadata: breakColdParams.metadata
        }, null, 2));

        const event = new BreakColdAnalytics(breakColdParams);
        await event.save();
        
        return { eventAnalytics, breakColdEvent: event };
    } catch (error) {
        console.error('Error recording BreakCold event:', error);
        throw error;
    }
}

/**
 * Get events for a specific platform and date range with regeneration history
 */
async function getEvents(platform, startDate, endDate) {
    const Model = platform.toLowerCase() === 'linkedin' ? LinkedInAnalytics : BreakColdAnalytics;
    
    try {
        const events = await Model.find({
            timestamp: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ timestamp: -1 });

        // Enrich with regeneration data
        return events.map(event => {
            const regenerationData = event.rawData.regenerationHistory || [];
            return {
                ...event.toObject(),
                regenerationData: regenerationData.map(regen => ({
                    regenerationId: regen.regenerationId,
                    timestamp: regen.timestamp,
                    previousComments: regen.previousComments,
                    newComments: regen.newComments,
                    selectedAfterRegeneration: regen.selectedAfterRegeneration,
                    selectedCommentIndex: regen.selectedCommentIndex
                }))
            };
        });
    } catch (error) {
        console.error(`Error getting ${platform} events:`, error);
        throw error;
    }
}

/**
 * Get regeneration statistics for a platform
 */
async function getRegenerationStats(platform, startDate, endDate) {
    const Model = platform.toLowerCase() === 'linkedin' ? LinkedInAnalytics : BreakColdAnalytics;
    
    try {
        const events = await Model.find({
            timestamp: {
                $gte: startDate,
                $lte: endDate
            },
            'rawData.regenerationHistory': { $exists: true, $ne: [] }
        });

        return {
            totalEvents: events.length,
            eventsWithRegeneration: events.filter(e => e.rawData.regenerationHistory?.length > 0).length,
            regenerationSelectionRate: events.filter(e => {
                const history = e.rawData.regenerationHistory || [];
                return history.some(h => h.selectedAfterRegeneration);
            }).length / events.length,
            averageRegenerationsPerEvent: events.reduce((acc, e) => 
                acc + (e.rawData.regenerationHistory?.length || 0), 0) / events.length
        };
    } catch (error) {
        console.error(`Error getting ${platform} regeneration stats:`, error);
        throw error;
    }
}

// For backward compatibility
async function recordLinkedInGeneration(params) {
    console.warn('recordLinkedInGeneration is deprecated. Use recordLinkedInEvent instead.');
    return recordLinkedInEvent({
        eventId: uuidv4(),
        timestamp: new Date(),
        rawData: {
            performance: {
                generationTime: params.generationTime,
                totalTime: params.responseTime
            }
        },
        metadata: {
            userAgent: params.userId,
            completionType: 'no_selection'
        }
    });
}

async function recordBreakColdGeneration(params) {
    console.warn('recordBreakColdGeneration is deprecated. Use recordBreakColdEvent instead.');
    return recordBreakColdEvent({
        eventId: uuidv4(),
        campaignId: params.campaignId,
        timestamp: new Date(),
        rawData: {
            performance: {
                generationTime: params.generationTime,
                totalTime: params.responseTime
            }
        },
        metadata: {
            userAgent: params.userId,
            completionType: 'no_selection'
        }
    });
}

module.exports = {
    recordLinkedInEvent,
    recordBreakColdEvent,
    recordLinkedInGeneration,  // for backward compatibility
    recordBreakColdGeneration, // for backward compatibility
    getEvents,
    getRegenerationStats
};
