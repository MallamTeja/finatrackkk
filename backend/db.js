const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file from the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectDB = async () => {
    try {
        console.log('MongoDB URI:', process.env.MONGODB_URI); // Debug log
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
        return conn;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };