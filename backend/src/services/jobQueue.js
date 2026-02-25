'use strict';

const Bull = require('bull');
const config = require('../config');

let queue = null;

/**
 * Lazily initialize the Bull queue so the app doesn't crash if Redis is absent
 * in environments where the queue is not used.
 */
const getQueue = () => {
  if (!queue) {
    queue = new Bull('pdf-jobs', {
      redis: config.redis.url,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    queue.on('error', (err) => {
      console.error('[jobQueue] Bull error:', err.message);
    });

    queue.on('failed', (job, err) => {
      console.error(`[jobQueue] Job ${job.id} failed:`, err.message);
    });
  }
  return queue;
};

/**
 * Add a PDF processing job to the queue.
 * @param {string} type  Job type identifier
 * @param {object} data  Serialisable job payload
 * @returns {Promise<import('bull').Job>}
 */
const enqueueJob = async (type, data) => {
  return getQueue().add(type, data);
};

/**
 * Register a processor for a given job type.
 * @param {string} type
 * @param {(job: import('bull').Job) => Promise<void>} processor
 */
const registerProcessor = (type, processor) => {
  getQueue().process(type, processor);
};

/**
 * Gracefully close the queue connection.
 */
const closeQueue = async () => {
  if (queue) {
    await queue.close();
    queue = null;
  }
};

module.exports = { getQueue, enqueueJob, registerProcessor, closeQueue };
