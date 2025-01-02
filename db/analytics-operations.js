const mongoose = require('mongoose');
const LinkedInAnalytics = require('./schemas/LinkedInAnalytics');
const BreakColdAnalytics = require('./schemas/BreakColdAnalytics');
const { v4: uuidv4 } = require('uuid');

/**
 * Record a LinkedIn event (generation or selection)
 */
async function recordLinkedInEvent(params) {
    try {
        const event = new LinkedInAnalytics(params);
        await event.save();
        return event;
    } catch (error) {
        console.error('Error recording LinkedIn event:', error);
        throw error;
    }
}

/**
 * Record a BreakCold event (generation or selection)
 */
async function recordBreakColdEvent(params) {
    try {
        console.log('Creating BreakCold event with params:', JSON.stringify({
            eventId: params.eventId,
            campaignId: params.campaignId,
            metadata: params.metadata
        }, null, 2));
        
        if (!params.campaignId) {
            throw new Error('campaignId is required for BreakCold events');
        }
        
        const event = new BreakColdAnalytics(params);
        
        console.log('Validating BreakCold event...');
        const validationError = event.validateSync();
        if (validationError) {
            console.error('Validation error:', JSON.stringify(validationError.errors, null, 2));
            throw validationError;
        }
        
        console.log('Saving BreakCold event...');
        const savedEvent = await event.save();
        console.log('BreakCold event saved successfully:', savedEvent.eventId);
        return savedEvent;
    } catch (error) {
        console.error('Error recording BreakCold event:', error.message);
        console.error('Error stack:', error.stack);
        if (error.name === 'ValidationError') {
            console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
        }
        throw error;
    }
}

/**
 * Get events for a specific platform and date range
 */
async function getEvents(platform, startDate, endDate) {
    const Model = platform.toLowerCase() === 'linkedin' ? LinkedInAnalytics : BreakColdAnalytics;
    
    try {
        return await Model.find({
            timestamp: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ timestamp: -1 });
    } catch (error) {
        console.error(`Error getting ${platform} events:`, error);
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
    getEvents
};
