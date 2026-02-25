'use strict';

const config = require('../config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = config.nodeEnv === 'development';

  // Log unexpected server errors
  if (status >= 500) {
    console.error('[ErrorHandler]', {
      message: err.message,
      stack: isDev ? err.stack : undefined,
      path: req.path,
      method: req.method,
    });
  }

  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `File too large. Maximum size is ${Math.round(config.maxFileSize / 1024 / 1024)} MB.`,
      code: 'FILE_TOO_LARGE',
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error: 'Too many files. Maximum is 20.', code: 'TOO_MANY_FILES' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: `Unexpected field: ${err.field}`, code: 'UNEXPECTED_FIELD' });
  }

  // Validation errors from express-validator (passed as arrays)
  if (err.code === 'VALIDATION_ERROR') {
    return res.status(422).json({ error: 'Validation failed', details: err.details, code: 'VALIDATION_ERROR' });
  }

  res.status(status).json({
    error: status < 500 || isDev ? err.message : 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && status >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
