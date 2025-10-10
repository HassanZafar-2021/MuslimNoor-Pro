const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Routes
const placesRoutes = require('./routes/places');
const duasRoutes = require('./routes/duas');
const aiRoutes = require('./routes/ai');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security & Middleware ---
app.use(helmet());

app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Too many requests, try again later',
  })
);

// ✅ CORS for production
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health Check ---
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend running',
    timestamp: new Date().toISOString(),
  });
});

// --- API Routes ---
app.use('/api/places', placesRoutes);
app.use('/api/duas', duasRoutes);
app.use('/api/ai', aiRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 MuslimNoor-Pro Backend running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai`);
  console.log(`🕌 Local mosque finder: http://localhost:${PORT}/api/places`);
  console.log(`📚 Dua list: http://localhost:${PORT}/api/duas`);
});
