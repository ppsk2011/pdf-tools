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
 * POST /api/extract-pages
 * Body: multipart/form-data
 *   - file: PDF
 *   - pages: comma-separated 1-based page numbers, e.g. "1,3,5-7"
 *   - action: 'extract' (default) | 'delete'
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('pages')
    .notEmpty().withMessage('pages is required')
    .isString(),
  body('action')
    .optional()
    .isIn(['extract', 'delete']).withMessage('action must be extract or delete'),
  validate,
  async (req, res, next) => {
    try {
      const action = req.body.action || 'extract';
      const pageNumbers = parsePageList(req.body.pages);

      if (pageNumbers.length === 0) {
        return res.status(400).json({ error: 'No valid page numbers provided', code: 'NO_PAGES' });
      }

      let result;
      if (action === 'delete') {
        result = await pdfService.deletePages(req.file.buffer, pageNumbers);
      } else {
        result = await pdfService.extractPages(req.file.buffer, pageNumbers);
      }

      const originalName = req.file.originalname.replace(/\.pdf$/i, '');
      streamFileToResponse(res, result, `${originalName}_${action}ed.pdf`);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
