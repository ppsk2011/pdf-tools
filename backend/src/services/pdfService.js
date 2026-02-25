'use strict';

const { PDFDocument, degrees, rgb, StandardFonts, grayscale } = require('pdf-lib');

/**
 * Merge multiple PDF buffers into one.
 * @param {Buffer[]} buffers
 * @returns {Promise<Buffer>}
 */
const mergePDFs = async (buffers) => {
  if (!buffers || buffers.length === 0) throw Object.assign(new Error('No PDFs to merge'), { status: 400 });

  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf, { ignoreEncryption: false });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const bytes = await merged.save();
  return Buffer.from(bytes);
};

/**
 * Parse a range string like "1-3,5,7-9" into a sorted array of 0-based page indices.
 * @param {string} rangeStr  1-based range string
 * @param {number} pageCount total pages in the document
 * @returns {number[]}
 */
const parseRanges = (rangeStr, pageCount) => {
  const indices = new Set();
  const parts = rangeStr.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw Object.assign(new Error(`Invalid range segment: "${trimmed}"`), { status: 400 });

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;

    if (start < 1 || end > pageCount || start > end) {
      throw Object.assign(
        new Error(`Range "${trimmed}" is out of bounds for a ${pageCount}-page document`),
        { status: 400 }
      );
    }
    for (let i = start; i <= end; i++) indices.add(i - 1); // convert to 0-based
  }
  return Array.from(indices).sort((a, b) => a - b);
};

/**
 * Split a PDF by comma-separated page ranges.
 * Each range produces one output PDF.
 * @param {Buffer} buffer
 * @param {string} ranges  e.g. "1-3,5,7-9"
 * @returns {Promise<Buffer[]>}
 */
const splitPDF = async (buffer, ranges) => {
  const source = await PDFDocument.load(buffer);
  const pageCount = source.getPageCount();

  const parts = ranges.split(',').map((s) => s.trim()).filter(Boolean);
  const results = [];

  for (const part of parts) {
    const indices = parseRanges(part, pageCount);
    const doc = await PDFDocument.create();
    const copied = await doc.copyPages(source, indices);
    copied.forEach((p) => doc.addPage(p));
    const bytes = await doc.save();
    results.push(Buffer.from(bytes));
  }

  return results;
};

/**
 * Compress a PDF.
 * pdf-lib doesn't support image re-encoding so compression is achieved by
 * removing metadata and object streams based on level.
 * @param {Buffer} buffer
 * @param {'low'|'medium'|'high'} level
 * @returns {Promise<Buffer>}
 */
const compressPDF = async (buffer, level = 'medium') => {
  const doc = await PDFDocument.load(buffer, { updateMetadata: false });

  // Strip metadata to reduce size
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setProducer('');
  doc.setCreator('');

  const saveOptions = {
    useObjectStreams: level !== 'low',
    addDefaultPage: false,
    // objectsPerTick controls streaming chunk size – smaller = less memory
    objectsPerTick: level === 'high' ? 20 : 50,
  };

  const bytes = await doc.save(saveOptions);
  return Buffer.from(bytes);
};

/**
 * Rotate specified pages (1-based) by degrees.
 * @param {Buffer} buffer
 * @param {number[]} pageNumbers  1-based
 * @param {90|180|270} deg
 * @returns {Promise<Buffer>}
 */
const rotatePDF = async (buffer, pageNumbers, deg) => {
  const validDegrees = [90, 180, 270];
  if (!validDegrees.includes(deg)) {
    throw Object.assign(new Error('degrees must be 90, 180, or 270'), { status: 400 });
  }

  const doc = await PDFDocument.load(buffer);
  const pageCount = doc.getPageCount();

  for (const num of pageNumbers) {
    if (num < 1 || num > pageCount) {
      throw Object.assign(new Error(`Page ${num} out of range (1-${pageCount})`), { status: 400 });
    }
    const page = doc.getPage(num - 1);
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + deg) % 360));
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
};

/**
 * Extract specific pages (1-based) into a new PDF.
 * @param {Buffer} buffer
 * @param {number[]} pageNumbers  1-based
 * @returns {Promise<Buffer>}
 */
const extractPages = async (buffer, pageNumbers) => {
  const source = await PDFDocument.load(buffer);
  const pageCount = source.getPageCount();
  const indices = pageNumbers.map((n) => {
    if (n < 1 || n > pageCount) {
      throw Object.assign(new Error(`Page ${n} out of range (1-${pageCount})`), { status: 400 });
    }
    return n - 1;
  });

  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(source, indices);
  copied.forEach((p) => doc.addPage(p));
  const bytes = await doc.save();
  return Buffer.from(bytes);
};

/**
 * Delete specific pages (1-based) from a PDF.
 * @param {Buffer} buffer
 * @param {number[]} pageNumbers  1-based
 * @returns {Promise<Buffer>}
 */
const deletePages = async (buffer, pageNumbers) => {
  const doc = await PDFDocument.load(buffer);
  const pageCount = doc.getPageCount();
  const toDelete = new Set(
    pageNumbers.map((n) => {
      if (n < 1 || n > pageCount) {
        throw Object.assign(new Error(`Page ${n} out of range (1-${pageCount})`), { status: 400 });
      }
      return n - 1;
    })
  );

  if (toDelete.size >= pageCount) {
    throw Object.assign(new Error('Cannot delete all pages from a PDF'), { status: 400 });
  }

  // Remove in reverse order so indices stay valid
  Array.from(toDelete)
    .sort((a, b) => b - a)
    .forEach((i) => doc.removePage(i));

  const bytes = await doc.save();
  return Buffer.from(bytes);
};

/**
 * Protect a PDF with a user password (AES-256-equivalent via pdf-lib).
 * Note: pdf-lib supports owner/user password encryption.
 * @param {Buffer} buffer
 * @param {string} password
 * @returns {Promise<Buffer>}
 */
const protectPDF = async (buffer, password) => {
  if (!password || password.trim() === '') {
    throw Object.assign(new Error('Password must not be empty'), { status: 400 });
  }
  const doc = await PDFDocument.load(buffer);
  const bytes = await doc.save({
    userPassword: password,
    ownerPassword: `${password}_owner`,
    permissions: {
      printing: 'lowResolution',
      modifying: false,
      copying: false,
      annotating: false,
      fillingForms: false,
      contentAccessibility: true,
      documentAssembly: false,
    },
  });
  return Buffer.from(bytes);
};

/**
 * Attempt to load an encrypted PDF (unlock with password).
 * Returns the re-saved, unencrypted buffer.
 * @param {Buffer} buffer
 * @param {string} password
 * @returns {Promise<Buffer>}
 */
const unlockPDF = async (buffer, password) => {
  let doc;
  try {
    doc = await PDFDocument.load(buffer, { password });
  } catch (err) {
    throw Object.assign(new Error('Incorrect password or PDF could not be unlocked'), { status: 400 });
  }
  const bytes = await doc.save(); // saved without encryption
  return Buffer.from(bytes);
};

/**
 * Add a diagonal text watermark to every page.
 * @param {Buffer} buffer
 * @param {string} text
 * @param {{ opacity?: number, fontSize?: number, color?: [number,number,number] }} options
 * @returns {Promise<Buffer>}
 */
const watermarkPDF = async (buffer, text, options = {}) => {
  if (!text || text.trim() === '') {
    throw Object.assign(new Error('Watermark text must not be empty'), { status: 400 });
  }

  const { opacity = 0.25, fontSize = 48, color = [0.6, 0.6, 0.6] } = options;

  const doc = await PDFDocument.load(buffer);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: fontSize,
      font,
      color: rgb(...color),
      opacity,
      rotate: degrees(45),
    });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
};

/**
 * Convert image buffers to a single PDF (one image per page).
 * @param {Buffer[]} imageBuffers
 * @param {string[]} mimeTypes  parallel array of MIME types
 * @returns {Promise<Buffer>}
 */
const imagesToPDF = async (imageBuffers, mimeTypes) => {
  const doc = await PDFDocument.create();

  for (let i = 0; i < imageBuffers.length; i++) {
    const mime = mimeTypes[i];
    let img;
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      img = await doc.embedJpg(imageBuffers[i]);
    } else if (mime === 'image/png') {
      img = await doc.embedPng(imageBuffers[i]);
    } else {
      throw Object.assign(new Error(`Unsupported image type for PDF embedding: ${mime}. Convert to JPG/PNG first.`), { status: 415 });
    }

    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
};

module.exports = {
  mergePDFs,
  splitPDF,
  compressPDF,
  rotatePDF,
  extractPages,
  deletePages,
  protectPDF,
  unlockPDF,
  watermarkPDF,
  imagesToPDF,
  parseRanges,
};
