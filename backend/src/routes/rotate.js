'use strict';

const express = require('express');
const { body } = require('express-validator');
const { upload } = require('../middleware/upload');
const { uploadRateLimiter } = require('../middleware/security');
const { requireFile, requirePDFFiles, validate, parsePageList } = require('../utils/validation');
const pdfService = require('../services/pdfService');
const { streamFileToResponse } = require('../services/fileService');

const router = express.Router();

/**
 * POST /api/rotate
 * Body: multipart/form-data
 *   - file: PDF
 *   - pages: comma-separated 1-based page numbers, e.g. "1,3,5" (or "all")
 *   - degrees: 90 | 180 | 270
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('degrees')
    .notEmpty().withMessage('degrees is required')
    .isIn(['90', '180', '270']).withMessage('degrees must be 90, 180, or 270'),
  body('pages')
    .optional()
    .isString(),
  validate,
  async (req, res, next) => {
    try {
      const deg = parseInt(req.body.degrees, 10);
      const pagesParam = req.body.pages;
      const { PDFDocument } = require('pdf-lib');

      // Determine page count to resolve "all"
      const tmpDoc = await PDFDocument.load(req.file.buffer);
      const pageCount = tmpDoc.getPageCount();

      let pageNumbers;
      if (!pagesParam || pagesParam.trim().toLowerCase() === 'all') {
        pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
      } else {
        pageNumbers = parsePageList(pagesParam);
      }

      const rotated = await pdfService.rotatePDF(req.file.buffer, pageNumbers, deg);
      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      streamFileToResponse(res, rotated, `${originalName}_rotated.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
