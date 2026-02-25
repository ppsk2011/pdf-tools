'use strict';

require('dotenv').config();

const requiredInProduction = (key) => {
  if (process.env.NODE_ENV === 'production' && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
};

requiredInProduction('STRIPE_SECRET_KEY');
requiredInProduction('STRIPE_WEBHOOK_SECRET');

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 104857600, // 100 MB
  fileTtlMs: parseInt(process.env.FILE_TTL_MS, 10) || 1800000,       // 30 min
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
};
