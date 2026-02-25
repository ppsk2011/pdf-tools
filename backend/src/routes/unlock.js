'use strict';

const express = require('express');
const { body } = require('express-validator');
const { upload } = require('../middleware/upload');
const { uploadRateLimiter } = require('../middleware/security');
const { requireFile, requirePDFFiles, validate } = require('../utils/validation');
const pdfService = require('../services/pdfService');
const { streamFileToResponse } = require('../services/fileService');

const router = express.Router();

/**
 * POST /api/unlock
 * Body: multipart/form-data
 *   - file: encrypted PDF
 *   - password: string
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('password')
    .notEmpty().withMessage('password is required'),
  validate,
  async (req, res, next) => {
    try {
      const unlocked = await pdfService.unlockPDF(req.file.buffer, req.body.password);
      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      streamFileToResponse(res, unlocked, `${originalName}_unlocked.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
