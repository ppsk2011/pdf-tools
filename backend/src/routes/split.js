'use strict';

const express = require('express');
const archiver = require('archiver');
const { body } = require('express-validator');
const { upload } = require('../middleware/upload');
const { uploadRateLimiter } = require('../middleware/security');
const { requireFile, requirePDFFiles, validate } = require('../utils/validation');
const pdfService = require('../services/pdfService');

const router = express.Router();

/**
 * POST /api/split
 * Body: multipart/form-data
 *   - file: single PDF
 *   - ranges: comma-separated page ranges, e.g. "1-3,4,5-7"
 *             Each range becomes one output PDF inside the zip.
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.single('file'),
  requireFile,
  requirePDFFiles,
  body('ranges')
    .notEmpty().withMessage('ranges is required')
    .isString()
    .matches(/^[\d,\- ]+$/).withMessage('ranges must be a valid page range string, e.g. "1-3,5,7-9"'),
  validate,
  async (req, res, next) => {
    try {
      const { ranges } = req.body;
      const parts = await pdfService.splitPDF(req.file.buffer, ranges);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="split.zip"');

      const archive = archiver('zip', { zlib: { level: 6 } });
      archive.on('error', next);
      archive.pipe(res);

      parts.forEach((buf, idx) => {
        archive.append(buf, { name: `part_${idx + 1}.pdf` });
      });

      await archive.finalize();
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
