const express = require('express');
const axios = require('axios');

const router = express.Router();

// Base URL for Al-Quran Cloud API
const QURAN_API_BASE = 'https://api.alquran.cloud/v1';

// GET /api/quran/surahs - Get list of all surahs
router.get('/surahs', async (req, res) => {
    try {
        const response = await axios.get(`${QURAN_API_BASE}/surah`);
        
        if (response.data && response.data.data) {
            res.json({
                surahs: response.data.data,
                count: response.data.data.length,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Invalid API response');
        }

    } catch (error) {
        console.error('Surahs fetch error:', error);
        res.status(500).json({
            error: 'Failed to fetch surahs',
            message: 'Unable to retrieve Quran chapters. Please try again later.'
        });
    }
});

// GET /api/quran/surah/:number - Get specific surah with verses
router.get('/surah/:number', async (req, res) => {
    try {
        const { number } = req.params;
        const { translation = 'en.asad' } = req.query;

        // Validation
        if (!number || isNaN(number) || number < 1 || number > 114) {
            return res.status(400).json({
                error: 'Invalid surah number',
                message: 'Surah number must be between 1 and 114'
            });
        }

        // Fetch Arabic text
        const arabicResponse = await axios.get(`${QURAN_API_BASE}/surah/${number}`);
        
        // Fetch translation
        const translationResponse = await axios.get(`${QURAN_API_BASE}/surah/${number}/${translation}`);

        if (arabicResponse.data && translationResponse.data) {
            const arabicData = arabicResponse.data.data;
            const translationData = translationResponse.data.data;

            // Combine Arabic and translation
            const verses = arabicData.ayahs.map((arabicVerse, index) => ({
                number: arabicVerse.number,
                numberInSurah: arabicVerse.numberInSurah,
                arabic: arabicVerse.text,
                translation: translationData.ayahs[index]?.text || '',
                juz: arabicVerse.juz,
                manzil: arabicVerse.manzil,
                page: arabicVerse.page,
                ruku: arabicVerse.ruku,
                hizbQuarter: arabicVerse.hizbQuarter,
                sajda: arabicVerse.sajda || false
            }));

            res.json({
                surah: {
                    number: arabicData.number,
                    name: arabicData.name,
                    englishName: arabicData.englishName,
                    englishNameTranslation: arabicData.englishNameTranslation,
                    numberOfAyahs: arabicData.numberOfAyahs,
                    revelationType: arabicData.revelationType,
                    verses: verses
                },
                translation: translation,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Invalid API response');
        }

    } catch (error) {
        console.error('Surah fetch error:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({
                error: 'Surah not found',
                message: 'The requested surah does not exist'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch surah',
            message: 'Unable to retrieve surah data. Please try again later.'
        });
    }
});

// GET /api/quran/verse/:reference - Get specific verse
router.get('/verse/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        const { translation = 'en.asad' } = req.query;

        // Validation for verse reference (e.g., "2:255")
        const versePattern = /^(\d{1,3}):(\d{1,3})$/;
        if (!versePattern.test(reference)) {
            return res.status(400).json({
                error: 'Invalid verse reference',
                message: 'Verse reference must be in format "surah:verse" (e.g., "2:255")'
            });
        }

        // Fetch Arabic text
        const arabicResponse = await axios.get(`${QURAN_API_BASE}/ayah/${reference}`);
        
        // Fetch translation
        const translationResponse = await axios.get(`${QURAN_API_BASE}/ayah/${reference}/${translation}`);

        if (arabicResponse.data && translationResponse.data) {
            const arabicVerse = arabicResponse.data.data;
            const translationVerse = translationResponse.data.data;

            res.json({
                verse: {
                    number: arabicVerse.number,
                    surah: arabicVerse.surah.number,
                    surahName: arabicVerse.surah.name,
                    surahEnglishName: arabicVerse.surah.englishName,
                    numberInSurah: arabicVerse.numberInSurah,
                    arabic: arabicVerse.text,
                    translation: translationVerse.text,
                    juz: arabicVerse.juz,
                    manzil: arabicVerse.manzil,
                    page: arabicVerse.page,
                    ruku: arabicVerse.ruku,
                    hizbQuarter: arabicVerse.hizbQuarter,
                    sajda: arabicVerse.sajda || false
                },
                translation: translation,
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Invalid API response');
        }

    } catch (error) {
        console.error('Verse fetch error:', error);
        
        if (error.response?.status === 404) {
            return res.status(404).json({
                error: 'Verse not found',
                message: 'The requested verse does not exist'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch verse',
            message: 'Unable to retrieve verse data. Please try again later.'
        });
    }
});

// GET /api/quran/search - Search verses
router.get('/search', async (req, res) => {
    try {
        const { q: query, translation = 'en.asad', limit = 20 } = req.query;

        if (!query || query.trim().length === 0) {
            return res.status(400).json({
                error: 'Search query required',
                message: 'Please provide a search term'
            });
        }

        if (query.length < 3) {
            return res.status(400).json({
                error: 'Query too short',
                message: 'Search query must be at least 3 characters long'
            });
        }

        const response = await axios.get(`${QURAN_API_BASE}/search/${encodeURIComponent(query)}/all/${translation}`);

        if (response.data && response.data.data) {
            const results = response.data.data.matches.slice(0, parseInt(limit));
            
            res.json({
                query: query,
                translation: translation,
                totalResults: response.data.data.count,
                returnedResults: results.length,
                results: results.map(match => ({
                    number: match.number,
                    surah: match.surah.number,
                    surahName: match.surah.name,
                    surahEnglishName: match.surah.englishName,
                    numberInSurah: match.numberInSurah,
                    text: match.text
                })),
                timestamp: new Date().toISOString()
            });
        } else {
            res.json({
                query: query,
                translation: translation,
                totalResults: 0,
                returnedResults: 0,
                results: [],
                timestamp: new Date().toISOString()
            });
        }

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Search failed',
            message: 'Unable to search verses. Please try again later.'
        });
    }
});

// GET /api/quran/translations - Get available translations
router.get('/translations', (req, res) => {
    const translations = [
        {
            identifier: 'en.asad',
            language: 'english',
            name: 'Muhammad Asad',
            type: 'translation'
        },
        {
            identifier: 'en.pickthall',
            language: 'english',
            name: 'Mohammed Marmaduke William Pickthall',
            type: 'translation'
        },
        {
            identifier: 'en.yusufali',
            language: 'english',
            name: 'Abdullah Yusuf Ali',
            type: 'translation'
        },
        {
            identifier: 'en.sahih',
            language: 'english',
            name: 'Saheeh International',
            type: 'translation'
        },
        {
            identifier: 'ur.jalandhry',
            language: 'urdu',
            name: 'Fateh Muhammad Jalandhry',
            type: 'translation'
        }
    ];

    res.json({
        translations,
        default: 'en.asad',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
