const express = require('express');
const router = express.Router();
const {
  createStripeCheckout,
  handleStripeWebhook,
  handleWebhook,
} = require('../controllers/paymentController');

// POST /api/payments/stripe/create-checkout
// Creates a Stripe checkout session for Card, Apple Pay, Google Pay, Link
router.post('/stripe/create-checkout', createStripeCheckout);

// POST /api/payments/stripe-webhook
// Stripe webhook event receiver
router.post('/stripe-webhook', handleStripeWebhook);

// POST /api/payments/webhook
// NOWPayments IPN callback receiver
router.post('/webhook', handleWebhook);

module.exports = router;
