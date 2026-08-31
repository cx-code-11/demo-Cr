const express = require('express');
const router = express.Router();
const {
  createStripeCheckout,
  handleStripeWebhook,
  handleWebhook,
  createPayPalOrder,
  capturePayPalOrder,
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

// POST /api/payments/paypal/create-order
// Creates a PayPal Checkout Order and a pending Donation record
router.post('/paypal/create-order', createPayPalOrder);

// POST /api/payments/paypal/capture-order
// Captures an approved PayPal Order and finalises the donation record
router.post('/paypal/capture-order', capturePayPalOrder);

module.exports = router;
