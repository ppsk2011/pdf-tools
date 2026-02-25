'use strict';

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/bmp',
  // Office documents
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(new Error(`Unsupported file type: ${file.mimetype}`), {
        status: 415,
        code: 'UNSUPPORTED_FILE_TYPE',
      }),
      false
    );
  }
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
    files: 20,
  },
});

// Attach a secure uuid-based fieldname to each file for downstream use
const withSecureFilename = (_req, res, next) => {
  if (res.locals.files) {
    res.locals.files = res.locals.files.map((f) => ({
      ...f,
      secureFilename: `${uuidv4()}.pdf`,
    }));
  }
  next();
};

module.exports = { upload, withSecureFilename };
