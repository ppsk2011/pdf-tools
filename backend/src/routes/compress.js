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
 * POST /api/compress
 * Body: multipart/form-data
 *   - file: PDF
 *   - level: 'low' | 'medium' | 'high'  (default: 'medium')
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('level')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('level must be low, medium, or high'),
  validate,
  async (req, res, next) => {
    try {
      const level = req.body.level || 'medium';
      const originalSize = req.file.buffer.length;

      const compressed = await pdfService.compressPDF(req.file.buffer, level);
      const compressedSize = compressed.length;
      const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);

      res.setHeader('X-Original-Size', originalSize);
      res.setHeader('X-Compressed-Size', compressedSize);
      res.setHeader('X-Compression-Ratio', `${ratio}%`);

      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      streamFileToResponse(res, compressed, `${originalName}_compressed.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
