'use strict';

require('dotenv').config();

const config = require('./config');
const app    = require('./app');
const { startCleanupScheduler } = require('./utils/tempFiles');

let cleanupInterval;

const server = app.listen(config.port, () => {
  console.info(`[server] PDF-Tools API running on port ${config.port} (${config.nodeEnv})`);
  cleanupInterval = startCleanupScheduler();
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.info(`[server] ${signal} received — shutting down gracefully`);
  clearInterval(cleanupInterval);

  server.close((err) => {
    if (err) {
      console.error('[server] Error during shutdown:', err.message);
      process.exit(1);
    }
    console.info('[server] HTTP server closed');
    process.exit(0);
  });

  // Force-kill if graceful close takes too long
  setTimeout(() => {
    console.error('[server] Shutdown timeout — forcing exit');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
  shutdown('uncaughtException');
});

module.exports = server; // exported for testing
