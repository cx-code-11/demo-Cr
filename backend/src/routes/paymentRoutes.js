const express = require('express');
const router = express.Router();
const { createInvoice, handleWebhook } = require('../controllers/paymentController');

// POST /api/payments/create-invoice
// Body: { amount: number, donorName: string, donorEmail?: string }
router.post('/create-invoice', createInvoice);

// POST /api/payments/webhook
// Raw body (handled in server.js with express.raw middleware)
router.post('/webhook', handleWebhook);

module.exports = router;
