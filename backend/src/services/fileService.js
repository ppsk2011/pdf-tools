'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * Create a unique temporary directory under os.tmpdir().
 * @returns {string} Absolute path to the new temp dir.
 */
const createTempDir = () => {
  const dir = path.join(os.tmpdir(), 'pdf-tools', uuidv4());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};

/**
 * Synchronously remove a file or directory (recursive).
 * Silently ignores ENOENT.
 * @param {string} targetPath
 */
const cleanupTemp = (targetPath) => {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('[fileService] cleanup failed:', targetPath, err.message);
    }
  }
};

/**
 * Schedule automatic deletion after delayMs (default: FILE_TTL_MS).
 * @param {string} targetPath
 * @param {number} [delayMs]
 */
const scheduleCleanup = (targetPath, delayMs = config.fileTtlMs) => {
  const timer = setTimeout(() => cleanupTemp(targetPath), delayMs);
  // Don't hold the event loop open
  if (timer.unref) timer.unref();
};

/**
 * Write a buffer to the HTTP response as a file download.
 * @param {import('express').Response} res
 * @param {Buffer} buffer
 * @param {string} filename
 * @param {string} [mimeType]
 */
const streamFileToResponse = (res, buffer, filename, mimeType = 'application/pdf') => {
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
  res.setHeader('Content-Length', buffer.length);
  res.end(buffer);
};

module.exports = { createTempDir, cleanupTemp, scheduleCleanup, streamFileToResponse };
