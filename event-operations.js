import mongoose from 'mongoose';
import Event from './models/Event.js';
import LinkedInAnalytics from './models/LinkedInAnalytics.js';
import BreakColdAnalytics from './models/BreakColdAnalytics.js';

class EventOperations {
    async recordEvent(eventData) {
        try {
            // Extract event from the payload
            const event = eventData.event;
            if (!event) {
                throw new Error('Event data is missing from payload');
            }

            // Create and save the event
            const newEvent = new Event(event);
            await newEvent.save();

            // Create platform-specific event
            const PlatformModel = event.platform.toLowerCase() === 'linkedin' ? LinkedInAnalytics : BreakColdAnalytics;
            const platformEvent = new PlatformModel(event);
            await platformEvent.save();

            return newEvent;
        } catch (error) {
            console.error('Error recording event:', error);
            throw error;
        }
    }

    async getPlatformEvents(platform, startDate, endDate) {
        try {
            const PlatformModel = platform.toLowerCase() === 'linkedin' ? LinkedInAnalytics : BreakColdAnalytics;
            const query = {
                platform: platform.toLowerCase(),
                'metadata.timestamp': {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
            return await PlatformModel.find(query).sort({ 'metadata.timestamp': -1 });
        } catch (error) {
            console.error('Error getting platform events:', error);
            throw error;
        }
    }

    async getEventsByPostId(postId) {
        try {
            return await Event.find({ postId }).sort({ 'metadata.timestamp': -1 });
        } catch (error) {
            console.error('Error getting events by postId:', error);
            throw error;
        }
    }

    async getEventsBySession(sessionId) {
        try {
            return await Event.find({ 'metadata.sessionId': sessionId })
                            .sort({ 'metadata.timestamp': -1 });
        } catch (error) {
            console.error('Error getting events by session:', error);
            throw error;
        }
    }
}

export default new EventOperations();
