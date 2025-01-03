const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let connection = null;

async function connectDB() {
    try {
        if (mongoose.connection.readyState === 1) {
            console.log('Already connected to MongoDB');
            return mongoose.connection;
        }

        mongoose.set('strictQuery', true);
        
        connection = await mongoose.connect(MONGODB_URI, {
            serverApi: {
                version: '1',
                strict: true,
                deprecationErrors: true,
            }
        });
        
        console.log('Connected to MongoDB successfully');
        return connection;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
}

async function disconnectDB() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    } catch (error) {
        console.error('Error disconnecting from MongoDB:', error);
        throw error;
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Export functions
module.exports = {
    connectDB,
    disconnectDB,
    getConnection: () => connection
};
