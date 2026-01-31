const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors());         // Enable CORS
app.use(helmet());       // Security headers

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Basic Checking Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Mindslate API is running' });
});



module.exports = app;

