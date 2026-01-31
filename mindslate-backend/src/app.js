const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(cors());         // Enable CORS
app.use(helmet());       // Security headers

// Basic Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Mindslate API is running' });
});

module.exports = app;