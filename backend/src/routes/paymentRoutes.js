const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/paymentController');

// POST /api/payments/webhook
// IPN handler — raw body (set up in server.js with express.raw middleware)
router.post('/webhook', handleWebhook);

module.exports = router;
