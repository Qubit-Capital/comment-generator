const mongoose = require('mongoose');

const breakColdEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true
    },
    postId: {
        type: String,
        required: true
    },
    campaignId: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    rawData: {
        type: {
            post: {
                text: String,
                metrics: {
                    length: Number,
                    sentiment: String,
                    keywords: [String]
                }
            },
            comments: [{
                id: String,
                text: String,
                tone: String,
                isRegenerated: Boolean,
                regenerationId: String,
                previousComments: [{
                    id: String,
                    text: String,
                    tone: String,
                    metrics: {
                        length: Number,
                        sentiment: String,
                        keywords: [String]
                    }
                }],
                metrics: {
                    length: Number,
                    sentiment: String,
                    keywords: [String]
                }
            }],
            selectedComment: {
                id: String,
                text: String,
                index: Number,
                isRegenerated: Boolean,
                regenerationId: String,
                metrics: {
                    length: Number,
                    sentiment: String,
                    keywords: [String]
                }
            },
            regenerationHistory: [{
                regenerationId: String,
                timestamp: Date,
                previousComments: [{
                    id: String,
                    text: String,
                    tone: String,
                    metrics: {
                        length: Number,
                        sentiment: String,
                        keywords: [String]
                    }
                }],
                newComments: [{
                    id: String,
                    text: String,
                    tone: String,
                    metrics: {
                        length: Number,
                        sentiment: String,
                        keywords: [String]
                    }
                }],
                selectedAfterRegeneration: Boolean,
                selectedCommentIndex: Number
            }],
            performance: {
                generationTime: Number,
                selectionTime: Number,
                totalTime: Number
            }
        },
        required: true
    },
    metadata: {
        userAgent: String,
        url: String,
        completionType: {
            type: String,
            enum: ['generation', 'selection', 'no_selection']
        }
    }
}, {
    timestamps: true
});

// Create indexes for efficient querying
breakColdEventSchema.index({ postId: 1, timestamp: 1 });
breakColdEventSchema.index({ campaignId: 1, timestamp: 1 });
breakColdEventSchema.index({ timestamp: 1 });
breakColdEventSchema.index({ date: 1 });

module.exports = mongoose.model('BreakColdAnalytics', breakColdEventSchema);
