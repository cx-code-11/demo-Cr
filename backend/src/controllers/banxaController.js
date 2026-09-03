/**
 * banxaController.js
 * Handles Banxa Hosted Checkout v2 integration for TrustAid.
 *
 * Flow:
 *   createBanxaOrder  → creates DB record → calls Banxa API → returns checkoutUrl
 *   banxaWebhook      → verifies HMAC → updates donation status
 */

const crypto = require('crypto');
const prisma = require('../prismaClient');

// ── Config ───────────────────────────────────────────────────────────────────
const BANXA_PARTNER_ID     = process.env.BANXA_PARTNER_ID     || '';
const BANXA_API_KEY        = process.env.BANXA_API_KEY        || '';
const BANXA_WEBHOOK_SECRET = process.env.BANXA_WEBHOOK_SECRET || '';
const BANXA_WALLET         = process.env.BANXA_USDT_TRC20_WALLET || 'TXPB74Bkku6dWFk7RQw1XxVWiHDRjDVXES';
const BANXA_SANDBOX        = process.env.BANXA_SANDBOX === 'true';

const BANXA_BASE_URL = BANXA_SANDBOX
  ? `https://${BANXA_PARTNER_ID}.banxa-sandbox.com`
  : `https://${BANXA_PARTNER_ID}.banxa.com`;

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ── Banxa Status → TrustAid Status mapping ───────────────────────────────────
const STATUS_MAP = {
  pending:         'WAITING',
  waiting_payment: 'WAITING',
  processing:      'CONFIRMING',
  completed:       'FINISHED',
  failed:          'FAILED',
  cancelled:       'FAILED',
  expired:         'EXPIRED',
};

// ── Helper: call Banxa REST API ───────────────────────────────────────────────
async function banxaRequest(method, path, body = null) {
  const url = `${BANXA_BASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BANXA_API_KEY,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();

  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok) {
    const msg = json?.message || json?.error || text || 'Banxa API error';
    throw Object.assign(new Error(msg), { status: res.status, banxaResponse: json });
  }
  return json;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/banxa/create-order
// ─────────────────────────────────────────────────────────────────────────────
async function createBanxaOrder(req, res) {
  const {
    amount,
    currency = 'USD',
    donorName,
    donorEmail,
    settlementType = 'M0',
  } = req.body;

  const usdAmount = parseFloat(amount);
  if (!usdAmount || usdAmount < 1) {
    return res.status(400).json({ error: 'Amount must be at least 1 USD.' });
  }

  const resolvedName  = (donorName  || '').trim() || 'Anonymous Donor';
  const resolvedEmail = (donorEmail || '').trim() || null;

  const nameParts = resolvedName.split(' ');
  const firstName = nameParts[0] || 'Anonymous';
  const lastName  = nameParts.slice(1).join(' ') || 'Donor';

  if (!BANXA_PARTNER_ID || !BANXA_API_KEY) {
    return res.status(503).json({
      error: 'Banxa is not yet configured. Please contact the administrator.',
    });
  }

  let donation;
  try {
    donation = await prisma.donation.create({
      data: {
        provider:            'BANXA',
        frequency:           'ONE_TIME',
        donorName:           resolvedName,
        donorEmail:          resolvedEmail,
        usdAmount,
        originalAmount:      usdAmount,
        originalCurrency:    currency.toUpperCase(),
        walletAddress:       BANXA_WALLET,
        paymentStatus:       'WAITING',
        settlementType,
        netSettlementAmount: usdAmount,
      },
    });
  } catch (dbErr) {
    console.error('[BANXA] DB create error:', dbErr.message);
    return res.status(500).json({ error: 'Failed to create donation record.' });
  }

  try {
    const orderBody = {
      account_reference: donation.id,
      fiat_amount:       usdAmount,
      fiat_currency:     currency.toUpperCase(),
      coin_currency:     'USDT',
      wallet_address:    BANXA_WALLET,
      blockchain:        'TRX',
      return_url:        `${FRONTEND_URL}/thank-you?donation=${donation.id}`,
      cancel_url:        `${FRONTEND_URL}?cancelled=true`,
      customer: {
        email:      resolvedEmail || `${donation.id}@trustaid.donor`,
        first_name: firstName,
        last_name:  lastName,
      },
      meta_data: {
        donation_id:     donation.id,
        platform:        'TrustAid',
        settlement_type: settlementType,
      },
    };

    const banxaRes = await banxaRequest('POST', `/${BANXA_PARTNER_ID}/v2/buy`, orderBody);

    const banxaOrderId = banxaRes?.data?.order?.id    || banxaRes?.order_id;
    const checkoutUrl  = banxaRes?.data?.order?.checkout_url || banxaRes?.checkout_url;

    if (!checkoutUrl) throw new Error('Banxa did not return a checkout URL.');

    await prisma.donation.update({
      where: { id: donation.id },
      data:  { banxaOrderId, banxaCheckoutUrl: checkoutUrl },
    });

    console.log(`[BANXA] Order created: ${banxaOrderId} for donation ${donation.id}`);
    return res.status(200).json({ donationId: donation.id, banxaOrderId, checkoutUrl });

  } catch (err) {
    console.error('[BANXA CREATE ORDER ERROR]', err.message, err.banxaResponse || '');
    await prisma.donation.delete({ where: { id: donation.id } }).catch(() => {});
    return res.status(err.status || 500).json({ error: err.message || 'Failed to create Banxa order.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhooks/banxa
// ─────────────────────────────────────────────────────────────────────────────
async function banxaWebhook(req, res) {
  const signature = req.headers['x-banxa-signature'] || req.headers['x-signature'] || '';

  if (BANXA_WEBHOOK_SECRET) {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', BANXA_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expected) {
      console.warn('[BANXA WEBHOOK] Invalid signature — rejected');
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }
  }

  const payload      = req.body;
  const banxaOrderId = payload?.data?.order?.id || payload?.order_id;
  const rawStatus    = payload?.data?.order?.status || payload?.status;

  if (!banxaOrderId || !rawStatus) {
    return res.status(400).json({ error: 'Missing order_id or status.' });
  }

  const trustAidStatus = STATUS_MAP[rawStatus] || 'WAITING';
  console.log(`[BANXA WEBHOOK] Order ${banxaOrderId} → ${rawStatus} → ${trustAidStatus}`);

  try {
    const donation = await prisma.donation.findUnique({ where: { banxaOrderId } });
    if (!donation) {
      console.warn(`[BANXA WEBHOOK] No donation for banxaOrderId: ${banxaOrderId}`);
      return res.status(200).json({ received: true });
    }

    const updateData = {
      paymentStatus: trustAidStatus,
      paymentMethod: 'card',
    };

    const txHash = payload?.data?.order?.transaction_hash;
    if (txHash) updateData.transactionHash = txHash;

    if (trustAidStatus === 'FINISHED') {
      updateData.settlementStatus = 'PROCESSING';
      updateData.settledAt = new Date();
    }

    await prisma.donation.update({ where: { id: donation.id }, data: updateData });

    if (trustAidStatus === 'FINISHED') {
      try {
        const { processDonationSettlement } = require('../services/settlementService');
        await processDonationSettlement(donation.id);
      } catch (sErr) {
        console.error('[BANXA WEBHOOK] Settlement error:', sErr.message);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[BANXA WEBHOOK ERROR]', err.message);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
}

module.exports = { createBanxaOrder, banxaWebhook };
