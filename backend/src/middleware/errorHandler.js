const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Duplicate key error (MongoDB)
  if (err.code === 11000) {
    const message = 'Resource already exists';
    return res.status(400).json({
      success: false,
      error: message
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(error => error.message).join(', ');
    return res.status(400).json({
      success: false,
      error: message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // OpenAI API errors
  if (err.response && err.response.status) {
    const status = err.response.status;
    let message = 'AI service error';

    switch (status) {
      case 401:
        message = 'Invalid OpenAI API key';
        break;
      case 429:
        message = 'OpenAI API rate limit exceeded';
        break;
      case 500:
        message = 'OpenAI service temporarily unavailable';
        break;
      default:
        message = `OpenAI API error: ${err.response.data?.error?.message || 'Unknown error'}`;
    }

    return res.status(status === 429 ? 429 : 500).json({
      success: false,
      error: message
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;