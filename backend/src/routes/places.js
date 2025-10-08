const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Per-route limiter
const placesLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many requests to Places API'
});

// Simple cache to reduce API calls
const cache = new Map();
const CACHE_TTL = 30 * 1000;

function setCache(key, value) {
    cache.set(key, { value, expires: Date.now() + CACHE_TTL });
}
function getCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}

router.get('/nearby', placesLimiter, async (req, res) => {
    try {
        const { lat, lng, radius = 5000, type = 'mosque', page_token } = req.query;
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;

        if (!apiKey) return res.status(500).json({ error: 'Google Maps API key not configured' });
        if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' });

        const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

        const key = page_token ? `token:${page_token}` : `loc:${lat},${lng}:r${radius}:t${type}`;
        const cached = getCache(key);
        if (cached) return res.json(cached);

        const params = page_token
            ? { pagetoken: page_token, key: apiKey }
            : { location: `${lat},${lng}`, radius, type, key: apiKey };

        const callPlaces = async () => (await axios.get(url, { params, timeout: 10000 })).data;

        let data = await callPlaces();

        // Retry for pagetoken if INVALID_REQUEST
        if (page_token && data.status === 'INVALID_REQUEST') {
            for (let i = 0; i < 3 && data.status === 'INVALID_REQUEST'; i++) {
                await new Promise(r => setTimeout(r, 2000));
                data = await callPlaces();
            }
        }

        if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            return res.status(502).json({ error: data.error_message || data.status });
        }

        const results = (data.results || []).map(r => ({
            place_id: r.place_id,
            name: r.name,
            vicinity: r.vicinity,
            geometry: r.geometry,
            rating: r.rating,
            user_ratings_total: r.user_ratings_total
        }));

        const payload = { status: data.status || 'OK', results, next_page_token: data.next_page_token };
        setCache(key, payload);
        res.json(payload);

    } catch (err) {
        console.error('Places API error:', err);
        res.status(500).json({ error: 'Failed to fetch nearby places' });
    }
});

module.exports = router;
