const mongoose = require('mongoose');

const eventAnalyticsSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true
    },
    postId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['generation', 'selection']
    },
    platform: {
        type: String,
        required: true,
        enum: ['linkedin', 'breakcold']
    },
    data: {
        type: {
            sourcePost: {
                text: String,
                metrics: {
                    length: Number,
                    sentiment: String,
                    keywords: [String]
                }
            },
            generatedComments: [{
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
            }]
        },
        required: true
    },
    performance: {
        generationTime: Number,
        selectionTime: Number,
        totalTime: Number
    },
    metadata: {
        browserInfo: String,
        userAgent: String,
        timestamp: {
            type: Date,
            required: true
        },
        url: String,
        completionType: {
            type: String,
            enum: ['generation', 'selection', 'no_selection'],
            required: true
        }
    }
}, {
    timestamps: true
});

// Create compound index for deduplication
eventAnalyticsSchema.index(
    { 
        postId: 1, 
        type: 1, 
        'metadata.timestamp': 1 
    }, 
    { 
        unique: true,
        name: 'dedup_index'
    }
);

// Create index for querying by platform and date range
eventAnalyticsSchema.index(
    { 
        platform: 1, 
        'metadata.timestamp': 1 
    }
);

// Static method to get combined events
eventAnalyticsSchema.statics.getCombinedEvents = async function(query = {}) {
    return this.aggregate([
        {
            $match: query
        },
        {
            $sort: { 
                'metadata.timestamp': -1 
            }
        },
        {
            $group: {
                _id: '$postId',
                generationEvent: {
                    $first: {
                        $cond: [
                            { $eq: ['$type', 'generation'] },
                            '$$ROOT',
                            null
                        ]
                    }
                },
                selectionEvent: {
                    $first: {
                        $cond: [
                            { $eq: ['$type', 'selection'] },
                            '$$ROOT',
                            null
                        ]
                    }
                },
                lastUpdated: { 
                    $first: '$metadata.timestamp' 
                }
            }
        },
        {
            $project: {
                _id: 1,
                postId: '$_id',
                generationEvent: 1,
                selectionEvent: 1,
                lastUpdated: 1,
                platform: { 
                    $ifNull: [
                        '$selectionEvent.platform',
                        '$generationEvent.platform'
                    ]
                },
                sourcePost: { 
                    $ifNull: [
                        '$selectionEvent.data.sourcePost',
                        '$generationEvent.data.sourcePost'
                    ]
                },
                comments: {
                    $ifNull: [
                        '$selectionEvent.data.generatedComments',
                        '$generationEvent.data.generatedComments'
                    ]
                },
                selectedComment: '$selectionEvent.data.selectedComment',
                closeReason: '$generationEvent.data.closeReason',
                completionType: {
                    $ifNull: [
                        '$selectionEvent.metadata.completionType',
                        '$generationEvent.metadata.completionType'
                    ]
                },
                performance: {
                    generationTime: '$generationEvent.performance.generationTime',
                    selectionTime: '$selectionEvent.performance.selectionTime',
                    totalTime: {
                        $add: [
                            { $ifNull: ['$generationEvent.performance.generationTime', 0] },
                            { $ifNull: ['$selectionEvent.performance.selectionTime', 0] }
                        ]
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('EventAnalytics', eventAnalyticsSchema);
