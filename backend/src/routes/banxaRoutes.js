const express = require('express');
const router  = express.Router();
const { createBanxaOrder, banxaWebhook } = require('../controllers/banxaController');

// Donor initiates a card payment via Banxa
router.post('/create-order', createBanxaOrder);

// Banxa sends webhook updates (status changes)
// Raw body is captured in server.js for HMAC verification
router.post('/webhook', banxaWebhook);

module.exports = router;
