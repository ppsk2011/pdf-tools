'use strict';

const { validationResult } = require('express-validator');

/**
 * Run express-validator checks and short-circuit with 422 on failure.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = Object.assign(new Error('Validation failed'), {
      status: 422,
      code: 'VALIDATION_ERROR',
      details: errors.array(),
    });
    return next(err);
  }
  next();
};

/**
 * Parse a comma-separated string of integers into a number array.
 * Throws if any token is not a positive integer.
 * @param {string} str
 * @returns {number[]}
 */
const parsePageList = (str) => {
  if (!str) return [];
  return str.split(',').map((s) => {
    const n = parseInt(s.trim(), 10);
    if (!Number.isInteger(n) || n < 1) {
      throw Object.assign(new Error(`Invalid page number: "${s.trim()}"`), { status: 400 });
    }
    return n;
  });
};

/**
 * Assert a file field is present in req.file / req.files.
 * @param {import('express').Request} req
 * @param {string} [field]
 */
const requireFile = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (files.length === 0) {
    return next(Object.assign(new Error('No file uploaded'), { status: 400, code: 'NO_FILE' }));
  }
  next();
};

/**
 * Assert that all uploaded files are PDFs.
 */
const requirePDFFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  for (const f of files) {
    if (f.mimetype !== 'application/pdf') {
      return next(
        Object.assign(new Error(`File "${f.originalname}" is not a PDF`), { status: 415, code: 'NOT_A_PDF' })
      );
    }
  }
  next();
};

module.exports = { validate, parsePageList, requireFile, requirePDFFiles };
