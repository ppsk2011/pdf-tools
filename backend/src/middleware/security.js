'use strict';

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config');

const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

const corsMiddleware = cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    if (origin === config.frontendUrl) return cb(null, true);
    cb(Object.assign(new Error(`CORS: origin ${origin} not allowed`), { status: 403 }));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  exposedHeaders: ['X-Original-Size', 'X-Compressed-Size', 'X-Compression-Ratio'],
  credentials: true,
  maxAge: 86400,
});

const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: (req) => config.nodeEnv === 'test',
});

const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Slow down.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: (req) => config.nodeEnv === 'test',
});

module.exports = { helmetMiddleware, corsMiddleware, uploadRateLimiter, globalRateLimiter };
