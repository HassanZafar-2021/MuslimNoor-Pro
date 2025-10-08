const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Routes
const placesRoutes = require('./routes/places');

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet());

// Rate limiting
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, try again later'
}));

// CORS for frontend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Backend running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/places', placesRoutes);

// Error & 404
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
