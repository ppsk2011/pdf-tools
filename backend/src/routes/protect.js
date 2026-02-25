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
 * POST /api/protect
 * Body: multipart/form-data
 *   - file: PDF
 *   - password: string (min 4 chars)
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('password')
    .notEmpty().withMessage('password is required')
    .isLength({ min: 4 }).withMessage('password must be at least 4 characters'),
  validate,
  async (req, res, next) => {
    try {
      const protected_ = await pdfService.protectPDF(req.file.buffer, req.body.password);
      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      streamFileToResponse(res, protected_, `${originalName}_protected.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
