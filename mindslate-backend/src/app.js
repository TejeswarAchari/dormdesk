const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();

// Middleware
app.use(express.json()); 
app.use(cors());         // Enable CORS
app.use(helmet());       // Security headers

// Rate Limiting: Max 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Applying rate limiting to all requests 
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Basic Checking Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Mindslate API is running' });
});



module.exports = app;

