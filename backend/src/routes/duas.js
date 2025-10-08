// backend/src/routes/duas.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to your JSON file
const DUA_JSON_PATH = path.join(__dirname, '../data/duas.json');

// Rate limiter
const duasLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many requests to /api/duas, please try again later.'
});

// GET /api/duas?q=optionalSearch
router.get('/', duasLimiter, (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();

    // Read JSON file
    const rawData = fs.readFileSync(DUA_JSON_PATH, 'utf-8');
    const data = JSON.parse(rawData);
    let results = data.duas || [];

    // Optional search filter
    if (q) {
      results = results.filter(d =>
        (d.arabic && d.arabic.toLowerCase().includes(q)) ||
        (d.translation && d.translation.toLowerCase().includes(q))
      );
    }

    res.json({ duas: results, count: results.length });
  } catch (err) {
    console.error('Error reading duas.json:', err);
    res.status(500).json({ error: 'Failed to load duas' });
  }
});

module.exports = router;
