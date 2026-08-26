const crypto = require('crypto');
const prisma = require('../prismaClient');
const { processDonationSettlement, calculateSettlement } = require('../services/settlementService');

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// IPN handler — receives payment status updates directly from NOWPayments
// Body is raw Buffer (for HMAC verification)
// ─────────────────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  try {
    // ── 1. Get raw body and signature header ──────────────────────────────────
    const rawBody = req.body;
    const receivedSig = req.headers['x-nowpayments-sig'];

    if (!receivedSig) {
      console.warn('[WEBHOOK] Missing x-nowpayments-sig header');
      return res.status(400).json({ error: 'Missing signature header' });
    }

    // ── 2. Verify HMAC-SHA512 signature ───────────────────────────────────────
    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      console.error('[WEBHOOK] Invalid JSON body');
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (IPN_SECRET && IPN_SECRET !== 'your_ipn_secret_here') {
      const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort());
      const expectedSig = crypto
        .createHmac('sha512', IPN_SECRET)
        .update(sortedPayload)
        .digest('hex');

      if (expectedSig !== receivedSig) {
        console.warn('[WEBHOOK] Signature mismatch — request rejected');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      console.log('[WEBHOOK] IPN_SECRET not set or using default, skipping HMAC validation');
    }

    // ── 3. Acknowledge immediately ────────────────────────────────────────────
    res.status(200).json({ received: true });

    // ── 4. Extract payment data ───────────────────────────────────────────────
    const {
      payment_id,
      order_id,
      payment_status,
      pay_currency,
      pay_amount,
      actually_paid,
      price_amount,
      outcome_amount,
    } = payload;

    console.log(`[WEBHOOK] payment_id=${payment_id} order_id=${order_id} status=${payment_status}`);

    const statusMap = {
      waiting:        'WAITING',
      confirming:     'CONFIRMING',
      confirmed:      'CONFIRMED',
      sending:        'SENDING',
      finished:       'FINISHED',
      partially_paid: 'PARTIALLY_PAID',
      failed:         'FAILED',
      expired:        'EXPIRED',
      refunded:       'REFUNDED',
    };
    const mappedStatus = statusMap[payment_status] || (payment_status ? payment_status.toUpperCase() : 'WAITING');

    const calculatedUsdAmount = outcome_amount 
      ? parseFloat(outcome_amount) 
      : (price_amount ? parseFloat(price_amount) : 0);

    const calculatedOriginalAmount = actually_paid 
      ? parseFloat(actually_paid) 
      : (pay_amount ? parseFloat(pay_amount) : null);

    // ── 5. Find existing donation by order_id or nowPaymentsId ─────────────────
    let donation = null;
    if (order_id) {
      donation = await prisma.donation.findUnique({
        where: { id: order_id },
      });
    }

    if (!donation && payment_id) {
      donation = await prisma.donation.findUnique({
        where: { nowPaymentsId: String(payment_id) },
      });
    }

    // ── 6. Idempotency / Upsert donation ──────────────────────────────────────
    if (donation) {
      if (donation.paymentStatus === 'FINISHED' && mappedStatus === 'FINISHED') {
        console.log(`[WEBHOOK] Already FINISHED — skipping duplicate for donation ${donation.id}`);
        return;
      }

      const updated = await prisma.donation.update({
        where: { id: donation.id },
        data: {
          nowPaymentsId: payment_id ? String(payment_id) : donation.nowPaymentsId,
          paymentStatus: mappedStatus,
          paymentMethod: pay_currency || donation.paymentMethod,
          originalCurrency: pay_currency || donation.originalCurrency,
          originalAmount: calculatedOriginalAmount || donation.originalAmount,
          usdAmount: calculatedUsdAmount || donation.usdAmount,
          updatedAt: new Date(),
        },
      });

      console.log(`[WEBHOOK] Donation ${updated.id} updated to ${mappedStatus}`);

      // Auto-trigger settlement on successful payment
      if (['FINISHED', 'CONFIRMED'].includes(mappedStatus)) {
        await processDonationSettlement(updated.id);
      }
    } else {
      // Direct payment from widget without pre-created invoice
      const { fee, net } = calculateSettlement(calculatedUsdAmount, 'M0');
      const isSuccess = ['FINISHED', 'CONFIRMED'].includes(mappedStatus);

      const created = await prisma.donation.create({
        data: {
          donorName: 'Anonymous Donor',
          nowPaymentsId: payment_id ? String(payment_id) : undefined,
          usdAmount: calculatedUsdAmount,
          originalAmount: calculatedOriginalAmount,
          originalCurrency: pay_currency || null,
          paymentMethod: pay_currency || null,
          paymentStatus: mappedStatus,
          settlementType: 'M0',
          settlementStatus: isSuccess ? 'SETTLED' : 'PENDING',
          feeAmount: isSuccess ? fee : 0,
          netSettlementAmount: isSuccess ? net : 0,
          settledAt: isSuccess ? new Date() : null,
        },
      });

      console.log(`[WEBHOOK] New direct donation created from widget: ${created.id} ($${calculatedUsdAmount}) [${mappedStatus}]`);

      if (isSuccess) {
        await prisma.settlementLog.create({
          data: {
            donationId: created.id,
            fromStatus: 'PENDING',
            toStatus: 'SETTLED',
            settlementType: 'M0',
            amount: calculatedUsdAmount,
            fee,
            netAmount: net,
            notes: 'Direct widget payment instant M0 settlement.',
          },
        });
      }
    }

  } catch (err) {
    console.error('[WEBHOOK] Processing error:', err.message);
  }
};
