'use strict';

require('dotenv').config();

const express = require('express');
const morgan  = require('morgan');

const config         = require('./config');
const { helmetMiddleware, corsMiddleware, globalRateLimiter } = require('./middleware/security');
const errorHandler   = require('./middleware/errorHandler');
const apiRoutes      = require('./routes');

const app = express();

// ── Security & CORS ──────────────────────────────────────────────────────────
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.options('*', corsMiddleware); // pre-flight

// ── Logging ──────────────────────────────────────────────────────────────────
const morganFormat = config.nodeEnv === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// ── Global rate limit ────────────────────────────────────────────────────────
app.use(globalRateLimiter);

// ── Body parsers (JSON / URL-encoded) ────────────────────────────────────────
// NOTE: express.raw() for the Stripe webhook is applied directly in donate.js
//       so it runs before express.json() strips the raw body.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    env: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
