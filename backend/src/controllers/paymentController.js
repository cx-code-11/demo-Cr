const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../prismaClient');

const NOWPAYMENTS_API = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/create-invoice
// Creates a NOWPayments invoice and a pending Donation record
// ─────────────────────────────────────────────────────────────────────────────
exports.createInvoice = async (req, res) => {
  try {
    const { amount, donorName, donorEmail } = req.body;

    // ── Validate input ────────────────────────────────────────────────────────
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid positive amount is required.' });
    }
    if (!donorName || donorName.trim().length < 2) {
      return res.status(400).json({ error: 'Donor name is required (min 2 chars).' });
    }

    const usdAmount = parseFloat(Number(amount).toFixed(2));

    // ── Create pending Donation record first (get the ID for order_id) ────────
    const donation = await prisma.donation.create({
      data: {
        donorName: donorName.trim(),
        donorEmail: donorEmail?.trim() || null,
        usdAmount,
        paymentStatus: 'WAITING',
      },
    });

    // ── Call NOWPayments Invoice API ──────────────────────────────────────────
    const nowPaymentsPayload = {
      price_amount: usdAmount,
      price_currency: 'usd',
      order_id: donation.id,           // our donation ID as the order reference
      order_description: `TrustAid donation by ${donorName.trim()}`,
      ipn_callback_url: `${process.env.BACKEND_BASE_URL}/api/payments/webhook`,
      success_url: process.env.SUCCESS_URL || 'http://localhost:3000/thank-you',
      cancel_url: process.env.CANCEL_URL || 'http://localhost:3000',
      is_fee_paid_by_user: false,
    };

    const response = await axios.post(
      `${NOWPAYMENTS_API}/invoice`,
      nowPaymentsPayload,
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const invoice = response.data;

    // ── Update Donation with invoice details ──────────────────────────────────
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        invoiceId: String(invoice.id),
      },
    });

    console.log(`[PAYMENT] Invoice created: ${invoice.id} for donation ${donation.id} — $${usdAmount}`);

    return res.status(201).json({
      donationId: donation.id,
      invoiceId: invoice.id,
      invoiceUrl: invoice.invoice_url,
    });

  } catch (err) {
    console.error('[PAYMENT] createInvoice error:', err?.response?.data || err.message);
    return res.status(500).json({
      error: 'Failed to create payment invoice. Please try again.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// IPN handler — receives payment status updates from NOWPayments
// Body is raw Buffer (for HMAC verification)
// ─────────────────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  try {
    // ── 1. Get raw body and signature header ──────────────────────────────────
    const rawBody = req.body; // Buffer (from express.raw middleware)
    const receivedSig = req.headers['x-nowpayments-sig'];

    if (!receivedSig) {
      console.warn('[WEBHOOK] Missing x-nowpayments-sig header');
      return res.status(400).json({ error: 'Missing signature header' });
    }

    // ── 2. Verify HMAC-SHA512 signature ───────────────────────────────────────
    // NOWPayments requires: sort JSON keys alphabetically, then HMAC-SHA512
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      console.error('[WEBHOOK] Invalid JSON body');
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort());
    const expectedSig = crypto
      .createHmac('sha512', IPN_SECRET)
      .update(sortedPayload)
      .digest('hex');

    if (expectedSig !== receivedSig) {
      console.warn('[WEBHOOK] Signature mismatch — request rejected');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // ── 3. Acknowledge immediately (NOWPayments requires 200 fast) ────────────
    res.status(200).json({ received: true });

    // ── 4. Extract payment data ───────────────────────────────────────────────
    const {
      payment_id,       // unique NOWPayments payment ID
      order_id,         // this is our donation.id
      payment_status,   // waiting | confirming | confirmed | sending | finished | failed | expired | partially_paid | refunded
      pay_currency,     // currency user paid in (btc, eth, etc.)
      pay_amount,       // amount user paid
      actually_paid,    // actual amount received
      price_amount,     // original USD amount requested
      outcome_amount,   // USD amount actually settled
    } = payload;

    console.log(`[WEBHOOK] payment_id=${payment_id} order_id=${order_id} status=${payment_status}`);

    // ── 5. Idempotency — skip if already FINISHED ─────────────────────────────
    const existing = await prisma.donation.findUnique({
      where: { id: order_id },
    });

    if (!existing) {
      console.warn(`[WEBHOOK] No donation found for order_id=${order_id}`);
      return;
    }

    if (existing.paymentStatus === 'FINISHED') {
      console.log(`[WEBHOOK] Already FINISHED — skipping duplicate for ${order_id}`);
      return;
    }

    // ── 6. Map NOWPayments status to our status ───────────────────────────────
    const statusMap = {
      waiting:       'WAITING',
      confirming:    'CONFIRMING',
      confirmed:     'CONFIRMED',
      sending:       'SENDING',
      finished:      'FINISHED',
      partially_paid:'PARTIALLY_PAID',
      failed:        'FAILED',
      expired:       'EXPIRED',
      refunded:      'REFUNDED',
    };
    const mappedStatus = statusMap[payment_status] || payment_status.toUpperCase();

    // ── 7. Update donation record ─────────────────────────────────────────────
    const updatedDonation = await prisma.donation.update({
      where: { id: order_id },
      data: {
        nowPaymentsId:    payment_id ? String(payment_id) : undefined,
        paymentStatus:    mappedStatus,
        paymentMethod:    pay_currency || null,
        originalCurrency: pay_currency || null,
        originalAmount:   actually_paid ? parseFloat(actually_paid) : (pay_amount ? parseFloat(pay_amount) : null),
        usdAmount:        outcome_amount ? parseFloat(outcome_amount) : (price_amount ? parseFloat(price_amount) : existing.usdAmount),
        updatedAt:        new Date(),
      },
    });

    console.log(`[WEBHOOK] Donation ${order_id} updated to ${mappedStatus}`);

    // ── 8. On FINISHED → update campaign raised amount ────────────────────────
    if (mappedStatus === 'FINISHED' && updatedDonation.campaignId) {
      await prisma.campaign.update({
        where: { id: updatedDonation.campaignId },
        data: {
          raised: {
            increment: updatedDonation.usdAmount,
          },
        },
      });
      console.log(`[WEBHOOK] Campaign ${updatedDonation.campaignId} raised incremented by $${updatedDonation.usdAmount}`);
    }

  } catch (err) {
    console.error('[WEBHOOK] Processing error:', err.message);
    // Response already sent (200), just log the error
  }
};
