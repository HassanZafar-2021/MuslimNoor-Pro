const express = require('express');
const { CalculationMethod, Coordinates, PrayerTimes } = require('adhan');

const router = express.Router();

// POST /api/prayer/times - Calculate prayer times for location
router.post('/times', async (req, res) => {
    try {
        const { latitude, longitude, method = 'MuslimWorldLeague', date } = req.body;

        // Validation
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Location required',
                message: 'Please provide latitude and longitude'
            });
        }

        if (latitude < -90 || latitude > 90) {
            return res.status(400).json({
                error: 'Invalid latitude',
                message: 'Latitude must be between -90 and 90'
            });
        }

        if (longitude < -180 || longitude > 180) {
            return res.status(400).json({
                error: 'Invalid longitude',
                message: 'Longitude must be between -180 and 180'
            });
        }

        // Create coordinates
        const coordinates = new Coordinates(latitude, longitude);
        
        // Get calculation method
        let calculationMethod;
        switch (method) {
            case 'MuslimWorldLeague':
                calculationMethod = CalculationMethod.MuslimWorldLeague();
                break;
            case 'NorthAmerica':
                calculationMethod = CalculationMethod.NorthAmerica();
                break;
            case 'Egypt':
                calculationMethod = CalculationMethod.Egypt();
                break;
            case 'Karachi':
                calculationMethod = CalculationMethod.Karachi();
                break;
            case 'UmmAlQura':
                calculationMethod = CalculationMethod.UmmAlQura();
                break;
            default:
                calculationMethod = CalculationMethod.MuslimWorldLeague();
        }

        // Use provided date or current date
        const calculationDate = date ? new Date(date) : new Date();
        
        // Calculate prayer times
        const prayerTimes = new PrayerTimes(coordinates, calculationDate, calculationMethod);

        // Get current prayer
        const currentPrayer = prayerTimes.currentPrayer(new Date());
        const nextPrayer = prayerTimes.nextPrayer(new Date());

        const response = {
            location: {
                latitude,
                longitude
            },
            date: calculationDate.toISOString().split('T')[0],
            method: method,
            prayerTimes: {
                fajr: prayerTimes.fajr.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                }),
                sunrise: prayerTimes.sunrise.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                }),
                dhuhr: prayerTimes.dhuhr.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                }),
                asr: prayerTimes.asr.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                }),
                maghrib: prayerTimes.maghrib.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                }),
                isha: prayerTimes.isha.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                })
            },
            currentPrayer,
            nextPrayer,
            timestamp: new Date().toISOString()
        };

        res.json(response);

    } catch (error) {
        console.error('Prayer times calculation error:', error);
        res.status(500).json({
            error: 'Calculation failed',
            message: 'Failed to calculate prayer times. Please try again.'
        });
    }
});

// GET /api/prayer/methods - Get available calculation methods
router.get('/methods', (req, res) => {
    const methods = [
        {
            key: 'MuslimWorldLeague',
            name: 'Muslim World League',
            description: 'Used in Europe, Far East, parts of US'
        },
        {
            key: 'NorthAmerica',
            name: 'Islamic Society of North America (ISNA)',
            description: 'Used in North America'
        },
        {
            key: 'Egypt',
            name: 'Egyptian General Authority of Survey',
            description: 'Used in Egypt'
        },
        {
            key: 'Karachi',
            name: 'University of Islamic Sciences, Karachi',
            description: 'Used in Pakistan, Bangladesh, India, Afghanistan'
        },
        {
            key: 'UmmAlQura',
            name: 'Umm Al-Qura University, Makkah',
            description: 'Used in Saudi Arabia'
        }
    ];

    res.json({
        methods,
        default: 'MuslimWorldLeague'
    });
});

// POST /api/prayer/qibla - Calculate Qibla direction
router.post('/qibla', (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        // Validation
        if (!latitude || !longitude) {
            return res.status(400).json({
                error: 'Location required',
                message: 'Please provide latitude and longitude'
            });
        }

        // Mecca coordinates
        const meccaLat = 21.4225 * Math.PI / 180;
        const meccaLng = 39.8262 * Math.PI / 180;
        const userLat = latitude * Math.PI / 180;
        const userLng = longitude * Math.PI / 180;

        const deltaLng = meccaLng - userLng;

        const y = Math.sin(deltaLng) * Math.cos(meccaLat);
        const x = Math.cos(userLat) * Math.sin(meccaLat) - 
                  Math.sin(userLat) * Math.cos(meccaLat) * Math.cos(deltaLng);

        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;

        res.json({
            location: {
                latitude,
                longitude
            },
            qiblaDirection: bearing,
            directionFromNorth: bearing.toFixed(1) + '°',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Qibla calculation error:', error);
        res.status(500).json({
            error: 'Calculation failed',
            message: 'Failed to calculate Qibla direction. Please try again.'
        });
    }
});

module.exports = router;