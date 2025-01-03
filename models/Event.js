import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    postId: { type: String, required: true },
    type: { 
        type: String, 
        required: true,
        enum: ['generation', 'selection'],
        validate: {
            validator: function(v) {
                return ['generation', 'selection'].includes(v);
            },
            message: props => `${props.value} is not a valid event type`
        }
    },
    platform: { 
        type: String, 
        required: true,
        enum: ['linkedin', 'breakcold'],
        validate: {
            validator: function(v) {
                return ['linkedin', 'breakcold'].includes(v.toLowerCase());
            },
            message: props => `${props.value} is not a valid platform`
        }
    },
    data: {
        sourcePost: {
            text: { type: String, required: true },
            metrics: {
                length: { type: Number },
                sentiment: { type: String },
                keywords: [{ type: String }]
            }
        },
        generatedComments: [{
            id: { type: String },
            text: { type: String, required: true },
            tone: { type: String },
            isRegenerated: { type: Boolean },
            regenerationId: { type: String },
            previousComments: [{
                id: { type: String },
                text: { type: String },
                tone: { type: String },
                metrics: {
                    length: { type: Number },
                    sentiment: { type: String },
                    keywords: [{ type: String }]
                }
            }],
            metrics: {
                length: { type: Number },
                sentiment: { type: String },
                keywords: [{ type: String }]
            }
        }],
        selectedComment: {
            id: { type: String },
            text: { type: String },
            index: { type: Number },
            isRegenerated: { type: Boolean },
            regenerationId: { type: String },
            metrics: {
                length: { type: Number },
                sentiment: { type: String },
                keywords: [{ type: String }]
            }
        },
        regenerationHistory: [{
            regenerationId: { type: String, required: true },
            timestamp: { type: Date, required: true },
            previousComments: [{
                id: { type: String },
                text: { type: String },
                tone: { type: String },
                metrics: {
                    length: { type: Number },
                    sentiment: { type: String },
                    keywords: [{ type: String }]
                }
            }],
            newComments: [{
                id: { type: String },
                text: { type: String },
                tone: { type: String },
                metrics: {
                    length: { type: Number },
                    sentiment: { type: String },
                    keywords: [{ type: String }]
                }
            }],
            selectedAfterRegeneration: { type: Boolean, default: false },
            selectedCommentIndex: { type: Number }
        }]
    },
    metadata: {
        url: { type: String, required: true },
        browserInfo: { type: String },
        timestamp: { type: Date, required: true },
        completionType: { 
            type: String, 
            enum: ['no_selection', 'selection'],
            required: true 
        },
        sessionId: { type: String, required: true }
    }
}, {
    timestamps: true
});

export default mongoose.model('Event', eventSchema);
