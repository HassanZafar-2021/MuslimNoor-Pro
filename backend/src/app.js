const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Import routes
const aiRoutes = require('./routes/ai');
const prayerRoutes = require('./routes/prayer');
const quranRoutes = require('./routes/quran');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'MuslimNoor-Pro Backend is running',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/prayer', prayerRoutes);
app.use('/api/quran', quranRoutes);

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to MuslimNoor-Pro API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            ai: '/api/ai',
            prayer: '/api/prayer',
            quran: '/api/quran'
        }
    });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 MuslimNoor-Pro Backend running on port ${PORT}`);
    console.log(`📱 Health check: http://localhost:${PORT}/health`);
    console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai`);
    console.log(`🕌 Prayer times: http://localhost:${PORT}/api/prayer`);
    console.log(`📖 Quran data: http://localhost:${PORT}/api/quran`);
});

module.exports = app;
