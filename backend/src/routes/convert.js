'use strict';

const express = require('express');
const archiver = require('archiver');
const sharp = require('sharp');
const { body } = require('express-validator');
const { upload } = require('../middleware/upload');
const { uploadRateLimiter } = require('../middleware/security');
const { requireFile, validate } = require('../utils/validation');
const pdfService = require('../services/pdfService');
const { streamFileToResponse } = require('../services/fileService');

const router = express.Router();

const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

/**
 * POST /api/convert
 * Body: multipart/form-data
 *   - file(s): source file(s)
 *   - targetFormat: 'jpg' | 'png' | 'webp' | 'pdf'
 *
 * image → PDF  : combine uploaded images into one PDF
 * image → image: transcode with sharp
 * PDF  → image : LibreOffice not available → 501
 * office→ PDF  : LibreOffice not available → 501
 */
router.post(
  '/',
  uploadRateLimiter,
  upload.array('files', 20),
  requireFile,
  body('targetFormat')
    .notEmpty().withMessage('targetFormat is required')
    .isIn(SUPPORTED_FORMATS).withMessage(`targetFormat must be one of: ${SUPPORTED_FORMATS.join(', ')}`),
  validate,
  async (req, res, next) => {
    try {
      const target = req.body.targetFormat.toLowerCase().replace('jpeg', 'jpg');
      const files = req.files;

      const firstMime = files[0].mimetype;
      const isSourcePDF = firstMime === 'application/pdf';
      const isSourceImage = firstMime.startsWith('image/');
      const isSourceOffice = firstMime.startsWith('application/vnd') || firstMime === 'application/msword';

      // ----- image(s) → PDF -----
      if (isSourceImage && target === 'pdf') {
        const buffers = files.map((f) => f.buffer);
        const mimes = files.map((f) => f.mimetype);
        // sharp normalises everything to jpg/png before embedding
        const normalised = await Promise.all(
          buffers.map(async (buf, i) => {
            const mime = mimes[i];
            if (mime === 'image/jpeg' || mime === 'image/png') return { buf, mime };
            const converted = await sharp(buf).jpeg({ quality: 92 }).toBuffer();
            return { buf: converted, mime: 'image/jpeg' };
          })
        );
        const pdf = await pdfService.imagesToPDF(
          normalised.map((n) => n.buf),
          normalised.map((n) => n.mime)
        );
        return streamFileToResponse(res, pdf, 'converted.pdf');
      }

      // ----- image → image (format transcode) -----
      if (isSourceImage && target !== 'pdf') {
        const sharpFormat = target === 'jpg' ? 'jpeg' : target;
        const mimeOut = target === 'jpg' ? 'image/jpeg' : `image/${target}`;

        if (files.length === 1) {
          const out = await sharp(files[0].buffer)[sharpFormat]().toBuffer();
          const origName = files[0].originalname.replace(/\.[^.]+$/, '');
          return streamFileToResponse(res, out, `${origName}.${target}`, mimeOut);
        }

        // Multiple images → zip of converted images
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="converted.zip"');
        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.on('error', next);
        archive.pipe(res);

        for (const file of files) {
          const out = await sharp(file.buffer)[sharpFormat]().toBuffer();
          const origName = file.originalname.replace(/\.[^.]+$/, '');
          archive.append(out, { name: `${origName}.${target}` });
        }
        await archive.finalize();
        return;
      }

      // ----- PDF → image -----
      if (isSourcePDF) {
        return res.status(501).json({
          error: 'PDF to image conversion requires LibreOffice / poppler which is not installed in this environment. Consider using a dedicated PDF rendering service.',
          code: 'RENDERER_NOT_AVAILABLE',
        });
      }

      // ----- Office → PDF -----
      if (isSourceOffice) {
        return res.status(501).json({
          error: 'Office document conversion requires LibreOffice which is not installed in this environment.',
          code: 'LIBREOFFICE_NOT_AVAILABLE',
        });
      }

      return res.status(400).json({ error: 'Unsupported conversion combination', code: 'UNSUPPORTED_CONVERSION' });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
