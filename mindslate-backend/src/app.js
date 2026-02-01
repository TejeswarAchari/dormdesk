const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');

const app = express();
app.set('trust proxy', 1);
// --- 1. CORS CONFIGURATION (MUST BE FIRST) ---
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173', 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies
};

// This Global Middleware handles ALL CORS checks, including Preflight (OPTIONS)
app.use(cors(corsOptions));

// --- 2. SECURITY & PARSING ---
app.use(helmet());
app.use(express.json()); 
app.use(cookieParser());

// --- 3. RATE LIMITING ---
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 300, 
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// --- 4. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Mindslate API is running' });
});

// Global error handler (place after routes)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({
    message: 'Something went wrong. Please try again.',
  });
});

module.exports = app;