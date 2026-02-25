'use strict';

const express = require('express');

const mergeRouter    = require('./merge');
const splitRouter    = require('./split');
const compressRouter = require('./compress');
const rotateRouter   = require('./rotate');
const extractRouter  = require('./extract');
const convertRouter  = require('./convert');
const protectRouter  = require('./protect');
const unlockRouter   = require('./unlock');
const watermarkRouter = require('./watermark');
const donateRouter   = require('./donate');

const router = express.Router();

router.use('/merge',         mergeRouter);
router.use('/split',         splitRouter);
router.use('/compress',      compressRouter);
router.use('/rotate',        rotateRouter);
router.use('/extract-pages', extractRouter);
router.use('/convert',       convertRouter);
router.use('/protect',       protectRouter);
router.use('/unlock',        unlockRouter);
router.use('/watermark',     watermarkRouter);
router.use('/donate',        donateRouter);

module.exports = router;
