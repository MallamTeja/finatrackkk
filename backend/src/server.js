require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('../config/db');
const path = require('path');

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Define routes
app.use('/api/users', require('../routes/users'));
app.use('/api/transactions', require('../routes/transactions'));

// Serve the main application
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/public/index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 