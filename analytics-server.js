import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';
import RealtimeAnalytics from './realtime-analytics.js';
import eventOperations from './event-operations.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Enable detailed logging
const debugLog = (message, data = '') => {
    console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Initialize realtime analytics
const realtime = new RealtimeAnalytics(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
    debugLog(`${req.method} ${req.path}`, req.body);
    next();
});

// MongoDB Connection with retry
const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            debugLog('Connected to MongoDB Atlas');
            return;
        } catch (err) {
            if (i === retries - 1) {
                debugLog('MongoDB connection failed after retries:', err);
                process.exit(1);
            }
            debugLog(`MongoDB connection attempt ${i + 1} failed, retrying in ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

connectWithRetry();

// Log when connection state changes
mongoose.connection.on('connected', () => {
    debugLog('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    debugLog('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    debugLog('Mongoose disconnected, attempting to reconnect...');
    connectWithRetry();
});

// Schema Definitions
const PostSchema = new mongoose.Schema({
    postId: { type: String, required: true, unique: true },
    platform: { 
        type: String, 
        enum: ['linkedin', 'breakcold'], 
        required: true,
        validate: {
            validator: function(v) {
                return ['linkedin', 'breakcold'].includes(v);
            },
            message: props => `${props.value} is not a valid platform`
        }
    },
    metadata: {
        url: { type: String, required: true },
        authorName: { type: String, required: true },
        authorProfile: String,
        postContent: { type: String, required: true },
        postType: { 
            type: String, 
            enum: ['text', 'image', 'video', 'article'],
            default: 'text'
        },
        engagement: {
            likes: { type: Number, default: 0 },
            comments: { type: Number, default: 0 },
            shares: { type: Number, default: 0 }
        }
    },
    commentEvents: [{
        eventId: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        type: { 
            type: String, 
            enum: ['generation', 'regeneration', 'selection'],
            required: true
        }
    }],
    stats: {
        totalGenerations: { type: Number, default: 0, min: 0 },
        totalRegenerations: { type: Number, default: 0, min: 0 },
        totalSelections: { type: Number, default: 0, min: 0 },
        averageGenerationTime: { type: Number, default: 0, min: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const CommentEventSchema = new mongoose.Schema({
    eventId: { type: String, required: true, unique: true },
    postId: { type: String, required: true },
    type: { 
        type: String, 
        enum: ['generation', 'regeneration', 'selection'], 
        required: true,
        validate: {
            validator: function(v) {
                return ['generation', 'regeneration', 'selection'].includes(v);
            },
            message: props => `${props.value} is not a valid event type`
        }
    },
    platform: { 
        type: String, 
        enum: ['linkedin', 'breakcold'], 
        required: true,
        validate: {
            validator: function(v) {
                return ['linkedin', 'breakcold'].includes(v);
            },
            message: props => `${props.value} is not a valid platform`
        }
    },
    data: {
        sourcePost: {
            text: { type: String, required: true },
            metrics: {
                length: { type: Number, required: true, min: 0 },
                sentiment: { 
                    type: String,
                    enum: ['positive', 'negative', 'neutral'],
                    default: 'neutral'
                },
                keywords: [String]
            }
        },
        generatedComments: [{
            id: { type: String, required: true },
            text: { type: String, required: true },
            tone: { type: String, default: 'professional' },
            index: { type: Number, required: true, min: 0 },
            metrics: {
                length: { type: Number, required: true, min: 0 },
                sentiment: { 
                    type: String,
                    enum: ['positive', 'negative', 'neutral'],
                    default: 'neutral'
                },
                keywords: [String],
                confidence: { type: Number, default: 1.0 }
            }
        }],
        selectedComment: {
            id: String,
            text: String,
            index: Number,
            isRegenerated: { type: Boolean, default: false },
            originalGenerationId: String
        }
    },
    performance: {
        generationTime: { type: Number, min: 0 },
        selectionTime: { type: Number, min: 0 },
        totalTime: { type: Number, min: 0 }
    },
    metadata: {
        browserInfo: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now }
    }
});

// Add middleware to handle updatedAt
PostSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Add validation for data based on event type
CommentEventSchema.pre('validate', function(next) {
    if (this.type === 'generation' && (!this.data.generatedComments || this.data.generatedComments.length === 0)) {
        next(new Error('Generation events must include generated comments'));
    } else if (this.type === 'selection' && !this.data.selectedComment) {
        next(new Error('Selection events must include a selected comment'));
    }
    next();
});

const AnalyticsSummarySchema = new mongoose.Schema({
    summaryId: { type: String, required: true, unique: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    date: { type: Date, required: true },
    platform: { type: String, enum: ['linkedin', 'breakcold', 'all'], required: true },
    metrics: {
        totalPosts: { type: Number, default: 0 },
        totalGenerations: { type: Number, default: 0 },
        totalRegenerations: { type: Number, default: 0 },
        totalSelections: { type: Number, default: 0 },
        averageGenerationTime: { type: Number, default: 0 },
        averageSelectionTime: { type: Number, default: 0 },
        popularTones: [{
            tone: String,
            count: Number,
            selectionRate: Number
        }],
        commentLengthDistribution: {
            short: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            long: { type: Number, default: 0 }
        }
    }
});

// Models
const Post = mongoose.model('Post', PostSchema);
const CommentEvent = mongoose.model('CommentEvent', CommentEventSchema);
const AnalyticsSummary = mongoose.model('AnalyticsSummary', AnalyticsSummarySchema);

// Routes
app.post('/api/analytics/event', async (req, res) => {
    try {
        debugLog('Received event:', req.body);
        const event = await eventOperations.recordEvent(req.body);
        debugLog('Event recorded:', event);
        res.json({ success: true, event });
    } catch (error) {
        debugLog('Error recording event:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// New endpoint to get combined events for a post
app.get('/api/analytics/post/:postId', async (req, res) => {
    try {
        const events = await eventOperations.getPostEvents(req.params.postId);
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting post events:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// New endpoint to get platform events
app.get('/api/analytics/platform/:platform', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const events = await eventOperations.getPlatformEvents(
            req.params.platform,
            new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date(endDate || Date.now())
        );
        res.json({ success: true, events });
    } catch (error) {
        console.error('Error getting platform events:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// New endpoint to get platform statistics
app.get('/api/analytics/stats/:platform', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const stats = await eventOperations.getEventStats(
            req.params.platform,
            new Date(startDate || Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date(endDate || Date.now())
        );
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error getting platform stats:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/analytics/summary', async (req, res) => {
    try {
        const { platform = 'all', period = 'daily', date = new Date() } = req.query;
        
        const summary = await AnalyticsSummary.findOne({
            platform,
            period,
            date: {
                $gte: new Date(date).setHours(0,0,0,0),
                $lt: new Date(date).setHours(23,59,59,999)
            }
        });

        if (!summary) {
            // Generate summary if it doesn't exist
            const newSummary = await generateSummary(platform, period, date);
            res.json(newSummary);
        } else {
            res.json(summary);
        }
    } catch (error) {
        next(error);
    }
});

// Helper function to generate summary
async function generateSummary(platform, period, date) {
    const summaryId = uuidv4();
    const startDate = new Date(date).setHours(0,0,0,0);
    const endDate = new Date(date).setHours(23,59,59,999);

    const events = await CommentEvent.find({
        platform: platform === 'all' ? { $in: ['linkedin', 'breakcold'] } : platform,
        'metadata.timestamp': { $gte: startDate, $lt: endDate }
    });

    // Calculate metrics
    const metrics = {
        totalPosts: new Set(events.map(e => e.postId)).size,
        totalGenerations: events.filter(e => e.type === 'generation').length,
        totalRegenerations: events.filter(e => e.type === 'regeneration').length,
        totalSelections: events.filter(e => e.type === 'selection').length,
        averageGenerationTime: events
            .filter(e => e.type === 'generation')
            .reduce((acc, curr) => acc + (curr.performance.generationTime || 0), 0) / 
            events.filter(e => e.type === 'generation').length || 0,
        averageSelectionTime: events
            .filter(e => e.type === 'selection')
            .reduce((acc, curr) => acc + (curr.performance.selectionTime || 0), 0) /
            events.filter(e => e.type === 'selection').length || 0
    };

    const summary = new AnalyticsSummary({
        summaryId,
        period,
        date,
        platform,
        metrics
    });

    await summary.save();
    return summary;
}

// Error handling middleware
app.use((error, req, res, next) => {
    debugLog('Error:', error);
    res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
});

server.listen(port, () => {
    debugLog(`Analytics server running on port ${port}`);
});
