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
 * POST /api/watermark
 * Body: multipart/form-data
 *   - file: PDF
 *   - text: watermark text
 *   - opacity: 0.0 – 1.0 (default 0.25)
 *   - fontSize: positive integer (default 48)
 *   - color: hex color e.g. "#999999" (default grey)
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('text').notEmpty().withMessage('text is required').isLength({ max: 200 }),
  body('opacity').optional().isFloat({ min: 0.01, max: 1.0 }).withMessage('opacity must be between 0.01 and 1.0'),
  body('fontSize').optional().isInt({ min: 6, max: 200 }).withMessage('fontSize must be between 6 and 200'),
  body('color')
    .optional()
    .matches(/^#[0-9a-fA-F]{6}$/).withMessage('color must be a hex color e.g. #ff0000'),
  validate,
  async (req, res, next) => {
    try {
      const { text, opacity, fontSize, color } = req.body;

      // Convert hex color → [r, g, b] floats in 0-1 range
      let colorRgb;
      if (color) {
        const hex = color.replace('#', '');
        colorRgb = [
          parseInt(hex.substring(0, 2), 16) / 255,
          parseInt(hex.substring(2, 4), 16) / 255,
          parseInt(hex.substring(4, 6), 16) / 255,
        ];
      }

      const options = {
        ...(opacity !== undefined ? { opacity: parseFloat(opacity) } : {}),
        ...(fontSize !== undefined ? { fontSize: parseInt(fontSize, 10) } : {}),
        ...(colorRgb ? { color: colorRgb } : {}),
      };

      const watermarked = await pdfService.watermarkPDF(req.file.buffer, text, options);
      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      streamFileToResponse(res, watermarked, `${originalName}_watermarked.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
