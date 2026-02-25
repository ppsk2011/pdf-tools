'use strict';

const express = require('express');
const { upload } = require('../middleware/upload');
const { uploadRateLimiter } = require('../middleware/security');
const { requireFile, requirePDFFiles } = require('../utils/validation');
const pdfService = require('../services/pdfService');
const { streamFileToResponse } = require('../services/fileService');

const router = express.Router();

/**
 * POST /api/merge
 * Body: multipart/form-data, field "files" (2-20 PDFs)
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.array('files', 20),
  requireFile,
  requirePDFFiles,
  async (req, res, next) => {
    try {
      const files = req.files;
      if (files.length < 2) {
        return res.status(400).json({ error: 'At least 2 PDF files are required for merging', code: 'TOO_FEW_FILES' });
      }

      const buffers = files.map((f) => f.buffer);
      const merged = await pdfService.mergePDFs(buffers);

      streamFileToResponse(res, merged, 'merged.pdf');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
