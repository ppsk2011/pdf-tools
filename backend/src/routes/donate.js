'use strict';

const express = require('express');
const config = require('../config');

const router = express.Router();

// Stripe is optional — only initialise when the key is present
let stripe = null;
const getStripe = () => {
  if (!stripe && config.stripe.secretKey && !config.stripe.secretKey.startsWith('sk_test_...')) {
    stripe = require('stripe')(config.stripe.secretKey);
  }
  return stripe;
};

/**
 * POST /api/donate/webhook
 * Raw body required for signature verification — Express must NOT parse it.
 * Mount this route BEFORE express.json() or use express.raw() specifically here.
 */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res, next) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = config.stripe.webhookSecret;

    if (!webhookSecret || webhookSecret.startsWith('whsec_...')) {
      console.warn('[donate] Stripe webhook secret not configured — skipping signature verification');
      return res.status(200).json({ received: true });
    }

    const stripeClient = getStripe();
    if (!stripeClient) {
      return res.status(503).json({ error: 'Payment processing not configured', code: 'STRIPE_NOT_CONFIGURED' });
    }

    let event;
    try {
      event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('[donate] Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}`, code: 'INVALID_SIGNATURE' });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const intent = event.data.object;
          console.info('[donate] 💸 Donation received:', {
            id: intent.id,
            amount: intent.amount,
            currency: intent.currency,
            email: intent.receipt_email || 'anonymous',
            created: new Date(intent.created * 1000).toISOString(),
          });
          break;
        }
        case 'payment_intent.payment_failed': {
          const intent = event.data.object;
          console.warn('[donate] Payment failed:', { id: intent.id, reason: intent.last_payment_error?.message });
          break;
        }
        default:
          // Unhandled event types — acknowledge but do nothing
          break;
      }

      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
