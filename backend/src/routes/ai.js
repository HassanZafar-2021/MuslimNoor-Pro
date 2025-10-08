const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

// Initialize OpenAI client with error handling
const initializeOpenAI = () => {
    try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
            throw new Error('OpenAI API key not configured');
        }
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    } catch (error) {
        console.warn('OpenAI not configured:', error.message);
        return null;
    }
};

// Islamic knowledge system prompt
const ISLAMIC_SYSTEM_PROMPT = `You are an Islamic AI assistant for MuslimNoor-Pro app. You provide accurate, respectful answers about Islam based on the Quran and authentic Hadith. 

Guidelines:
- Give concise, helpful answers about Islamic practices, beliefs, and guidance
- Quote relevant Quran verses or Hadith when appropriate
- Be respectful of all Islamic schools of thought
- If unsure, acknowledge limitations and suggest consulting Islamic scholars
- Keep responses under 200 words unless complex explanation needed
- Focus on practical, actionable Islamic guidance

Always maintain a respectful, knowledgeable tone befitting Islamic discourse.`;

// POST /api/ai - Chat with AI assistant
router.post('/', async (req, res) => {
    try {
        const { input } = req.body;

        // Validation
        if (!input || input.trim().length === 0) {
            return res.status(400).json({
                error: 'Input is required',
                message: 'Please provide a question or message'
            });
        }

        if (input.length > 1000) {
            return res.status(400).json({
                error: 'Input too long',
                message: 'Please keep your question under 1000 characters'
            });
        }

        // Initialize OpenAI client
        const openai = initializeOpenAI();
        if (!openai) {
            return res.status(500).json({
                error: 'Service configuration error',
                message: 'AI service is not properly configured'
            });
        }

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: ISLAMIC_SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: input
                }
            ],
            max_tokens: 300,
            temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        res.json({
            response: response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI API Error:', error);

        // Handle specific OpenAI errors
        if (error.status === 401) {
            return res.status(500).json({
                error: 'API authentication failed',
                message: 'Please contact support if this issue persists'
            });
        }

        if (error.status === 429) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Please try again in a few moments'
            });
        }

        res.status(500).json({
            error: 'AI service error',
            message: 'Failed to get AI response. Please try again later.'
        });
    }
});

// GET /api/ai/status - Check AI service status
router.get('/status', (req, res) => {
    const isConfigured = !!process.env.OPENAI_API_KEY;
    
    res.json({
        status: isConfigured ? 'configured' : 'not_configured',
        message: isConfigured ? 'AI service is ready' : 'AI service needs configuration',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
