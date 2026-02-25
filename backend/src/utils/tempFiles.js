'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const BASE_TMP = path.join(os.tmpdir(), 'pdf-tools');

/**
 * Generate a secure, random temp file path (does not create the file).
 * @param {string} [ext] File extension including dot, e.g. ".pdf"
 * @returns {string}
 */
const getTempFilePath = (ext = '') => {
  fs.mkdirSync(BASE_TMP, { recursive: true });
  return path.join(BASE_TMP, `${uuidv4()}${ext}`);
};

/**
 * Remove any temp files older than ageMs from the shared temp dir.
 * Called periodically to guard against crashes that skip scheduled cleanups.
 * @param {number} [ageMs]
 */
const pruneStaleTemp = (ageMs = config.fileTtlMs) => {
  try {
    if (!fs.existsSync(BASE_TMP)) return;
    const now = Date.now();
    const entries = fs.readdirSync(BASE_TMP, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(BASE_TMP, entry.name);
      try {
        const stat = fs.statSync(full);
        if (now - stat.mtimeMs > ageMs) {
          fs.rmSync(full, { recursive: true, force: true });
        }
      } catch {
        // Ignore individual stat/rm errors
      }
    }
  } catch (err) {
    console.warn('[tempFiles] pruneStaleTemp error:', err.message);
  }
};

/**
 * Start a periodic cleanup interval (every FILE_TTL_MS).
 * Returns the interval so callers can clear it on shutdown.
 * @returns {NodeJS.Timeout}
 */
const startCleanupScheduler = () => {
  const interval = setInterval(() => pruneStaleTemp(), config.fileTtlMs);
  if (interval.unref) interval.unref();
  return interval;
};

module.exports = { getTempFilePath, pruneStaleTemp, startCleanupScheduler, BASE_TMP };
