const crypto = require('crypto');
const prisma = require('../prismaClient');
const { processDonationSettlement, calculateSettlement } = require('../services/settlementService');

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Lazy initialize Stripe if API key is provided
let stripe = null;
if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== 'your_stripe_secret_key_here') {
  stripe = require('stripe')(STRIPE_SECRET_KEY);
}

// ─────────────────────────────────────────────────────────────────────────────
// PayPal: OAuth2 Access Token (cached per process)
// ─────────────────────────────────────────────────────────────────────────────
let _paypalToken = null;
let _paypalTokenExpiry = 0;

async function getPayPalAccessToken() {
  if (_paypalToken && Date.now() < _paypalTokenExpiry) return _paypalToken;

  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await response.json();
  _paypalToken = data.access_token;
  // Expire 60 seconds before actual expiry for safety
  _paypalTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return _paypalToken;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/stripe/create-checkout
// Creates a Stripe Checkout session for Card, Apple Pay, Google Pay, Link, etc.
// ─────────────────────────────────────────────────────────────────────────────
exports.createStripeCheckout = async (req, res) => {
  try {
    const {
      amount,
      currency = 'usd',
      donorName,
      donorEmail,
      frequency = 'ONE_TIME',
      campaignId,
      settlementType = 'M0',
    } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid positive donation amount is required.' });
    }
    if (!donorName || donorName.trim().length < 2) {
      return res.status(400).json({ error: 'Donor name is required (minimum 2 characters).' });
    }

    const usdAmount = parseFloat(Number(amount).toFixed(2));
    const targetCurrency = currency.toLowerCase();

    // If Stripe key isn't configured, provide clear error
    if (!stripe) {
      // Fallback: If in test/demo mode without live Stripe key, create a simulated checkout
      const donation = await prisma.donation.create({
        data: {
          provider: 'STRIPE',
          donorName: donorName.trim(),
          donorEmail: donorEmail?.trim() || null,
          usdAmount,
          originalAmount: usdAmount,
          originalCurrency: targetCurrency.toUpperCase(),
          frequency: frequency.toUpperCase(),
          settlementType: settlementType.toUpperCase(),
          paymentStatus: 'WAITING',
          paymentMethod: 'card',
          campaignId: campaignId || null,
        },
      });

      return res.json({
        sessionId: `demo_session_${donation.id}`,
        checkoutUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/thank-you?session_id=demo_${donation.id}`,
        donationId: donation.id,
        isSimulated: true,
      });
    }

    // 1. Create preliminary donation record
    const donation = await prisma.donation.create({
      data: {
        provider: 'STRIPE',
        donorName: donorName.trim(),
        donorEmail: donorEmail?.trim() || null,
        usdAmount,
        originalAmount: usdAmount,
        originalCurrency: targetCurrency.toUpperCase(),
        frequency: frequency.toUpperCase(),
        settlementType: settlementType.toUpperCase(),
        paymentStatus: 'WAITING',
        campaignId: campaignId || null,
      },
    });

    // 2. Build Stripe Checkout Session
    const isRecurring = frequency.toUpperCase() === 'MONTHLY';
    const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/thank-you?session_id={CHECKOUT_SESSION_ID}&donation_id=${donation.id}`;
    const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}?canceled=true`;

    const lineItem = {
      price_data: {
        currency: targetCurrency,
        product_data: {
          name: isRecurring ? 'Monthly Charity Support — TrustAid' : 'Charity Donation — TrustAid',
          description: `Donation by ${donorName.trim()}`,
        },
        unit_amount: Math.round(usdAmount * 100), // in cents
        ...(isRecurring ? { recurring: { interval: 'month' } } : {}),
      },
      quantity: 1,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      mode: isRecurring ? 'subscription' : 'payment',
      customer_email: donorEmail?.trim() || undefined,
      client_reference_id: donation.id,
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        donationId: donation.id,
        donorName: donorName.trim(),
        donorEmail: donorEmail?.trim() || '',
        settlementType: settlementType.toUpperCase(),
      },
    });

    await prisma.donation.update({
      where: { id: donation.id },
      data: { stripeSessionId: session.id },
    });

    return res.status(201).json({
      sessionId: session.id,
      checkoutUrl: session.url,
      donationId: donation.id,
    });
  } catch (err) {
    console.error('[STRIPE CHECKOUT ERROR]', err.message);
    return res.status(500).json({ error: err.message || 'Failed to initialize Stripe checkout.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/stripe-webhook
// Stripe Webhook handler with signature verification
// ─────────────────────────────────────────────────────────────────────────────
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const rawBody = req.body;

  let event;

  if (STRIPE_WEBHOOK_SECRET && STRIPE_WEBHOOK_SECRET !== 'your_stripe_webhook_secret_here' && stripe) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.warn('[STRIPE WEBHOOK] Signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Development fallback without secret
    try {
      event = JSON.parse(rawBody.toString('utf8'));
    } catch {
      return res.status(400).send('Invalid JSON');
    }
  }

  // Acknowledge immediately
  res.json({ received: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const donationId = session.client_reference_id || session.metadata?.donationId;
        const paymentIntentId = session.payment_intent;

        console.log(`[STRIPE WEBHOOK] checkout.session.completed for donationId=${donationId}`);

        let donation = null;
        if (donationId) {
          donation = await prisma.donation.findUnique({ where: { id: donationId } });
        } else if (session.id) {
          donation = await prisma.donation.findUnique({ where: { stripeSessionId: session.id } });
        }

        if (donation) {
          if (donation.paymentStatus === 'FINISHED') {
            console.log('[STRIPE WEBHOOK] Duplicate webhook event, skipping.');
            return;
          }

          const paidAmount = session.amount_total ? session.amount_total / 100 : donation.usdAmount;
          const currency = (session.currency || donation.originalCurrency || 'USD').toUpperCase();

          const updated = await prisma.donation.update({
            where: { id: donation.id },
            data: {
              paymentStatus: 'FINISHED',
              paymentMethod: 'card',
              originalAmount: paidAmount,
              originalCurrency: currency,
              usdAmount: paidAmount,
              stripePaymentIntentId: typeof paymentIntentId === 'string' ? paymentIntentId : undefined,
              updatedAt: new Date(),
            },
          });

          // Auto-trigger M0 or M1 settlement
          await processDonationSettlement(updated.id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object;
        console.warn(`[STRIPE WEBHOOK] Payment failed for intent: ${intent.id}`);
        break;
      }

      default:
        // Other event types
        break;
    }
  } catch (err) {
    console.error('[STRIPE WEBHOOK PROCESSING ERROR]', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// NOWPayments IPN handler (Crypto, Wallets, Card widget)
// ─────────────────────────────────────────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  try {
    const rawBody = req.body;
    const receivedSig = req.headers['x-nowpayments-sig'];

    if (!receivedSig) {
      console.warn('[NOWPAYMENTS WEBHOOK] Missing x-nowpayments-sig header');
      return res.status(400).json({ error: 'Missing signature header' });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      console.error('[NOWPAYMENTS WEBHOOK] Invalid JSON body');
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    if (IPN_SECRET && IPN_SECRET !== 'your_ipn_secret_here') {
      const sortedPayload = JSON.stringify(payload, Object.keys(payload).sort());
      const expectedSig = crypto
        .createHmac('sha512', IPN_SECRET)
        .update(sortedPayload)
        .digest('hex');

      if (expectedSig !== receivedSig) {
        console.warn('[NOWPAYMENTS WEBHOOK] Signature mismatch — request rejected');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      console.log('[NOWPAYMENTS WEBHOOK] IPN_SECRET not set or using default, skipping HMAC validation');
    }

    res.status(200).json({ received: true });

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

    console.log(`[NOWPAYMENTS WEBHOOK] payment_id=${payment_id} order_id=${order_id} status=${payment_status}`);

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

    if (donation) {
      if (donation.paymentStatus === 'FINISHED' && mappedStatus === 'FINISHED') {
        console.log(`[NOWPAYMENTS WEBHOOK] Already FINISHED — skipping duplicate for donation ${donation.id}`);
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

      console.log(`[NOWPAYMENTS WEBHOOK] Donation ${updated.id} updated to ${mappedStatus}`);

      if (['FINISHED', 'CONFIRMED'].includes(mappedStatus)) {
        await processDonationSettlement(updated.id);
      }
    } else {
      const { fee, net } = calculateSettlement(calculatedUsdAmount, 'M0');
      const isSuccess = ['FINISHED', 'CONFIRMED'].includes(mappedStatus);

      const created = await prisma.donation.create({
        data: {
          provider: 'NOWPAYMENTS',
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

      console.log(`[NOWPAYMENTS WEBHOOK] New direct donation: ${created.id} ($${calculatedUsdAmount}) [${mappedStatus}]`);

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
            notes: 'NOWPayments widget direct instant M0 settlement.',
          },
        });
      }
    }

  } catch (err) {
    console.error('[NOWPAYMENTS WEBHOOK ERROR]', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/paypal/create-order
// Creates a PayPal Order and a pending Donation record in the DB.
// ─────────────────────────────────────────────────────────────────────────────
exports.createPayPalOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      donorName,
      donorEmail,
      frequency = 'ONE_TIME',
      campaignId,
      settlementType = 'M0',
    } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid positive donation amount is required.' });
    }
    if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === 'your_paypal_client_id_here') {
      return res.status(503).json({ error: 'PayPal is not configured on this server.' });
    }

    const usdAmount = parseFloat(Number(amount).toFixed(2));
    const resolvedName = (donorName && donorName.trim().length >= 1) ? donorName.trim() : 'Anonymous Donor';

    // 1. Create preliminary donation record
    const donation = await prisma.donation.create({
      data: {
        provider: 'PAYPAL',
        donorName: resolvedName,
        donorEmail: donorEmail?.trim() || null,
        usdAmount,
        originalAmount: usdAmount,
        originalCurrency: currency.toUpperCase(),
        frequency: frequency.toUpperCase(),
        settlementType: settlementType.toUpperCase(),
        paymentStatus: 'WAITING',
        paymentMethod: 'paypal',
        campaignId: campaignId || null,
      },
    });

    // 2. Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // 3. Create PayPal Order via REST API
    // NOTE: Do NOT include payment_source/experience_context here — that is only
    // for redirect-based flows. The JS SDK Smart Buttons handle UX on their own.
    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: donation.id,
          description: `Donation by ${resolvedName} via TrustAid`,
          amount: {
            currency_code: currency.toUpperCase(),
            value: usdAmount.toFixed(2),
          },
        },
      ],
    };

    const ppRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': donation.id,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!ppRes.ok) {
      const ppErrText = await ppRes.text();
      let ppErrMessage = 'Failed to create PayPal order.';
      try {
        const ppErrJson = JSON.parse(ppErrText);
        const detail = ppErrJson.details?.[0];
        if (detail?.issue === 'PAYEE_ACCOUNT_RESTRICTED') {
          ppErrMessage = 'PayPal merchant account is not yet verified/active. Please complete account setup at paypal.com.';
        } else if (ppErrJson.message) {
          ppErrMessage = ppErrJson.message;
        }
        console.error('[PAYPAL CREATE ORDER ERROR]', ppErrText);
      } catch (_) {
        console.error('[PAYPAL CREATE ORDER ERROR]', ppErrText);
      }
      // Clean up the pending donation record
      await prisma.donation.delete({ where: { id: donation.id } });
      return res.status(502).json({ error: ppErrMessage });
    }

    const ppOrder = await ppRes.json();

    // 4. Store paypal order id on donation
    await prisma.donation.update({
      where: { id: donation.id },
      data: { paypalOrderId: ppOrder.id },
    });

    console.log(`[PAYPAL] Order created: ${ppOrder.id} for donation ${donation.id}`);
    return res.status(201).json({ paypalOrderId: ppOrder.id, donationId: donation.id });

  } catch (err) {
    console.error('[PAYPAL CREATE ORDER ERROR]', err.message);
    return res.status(500).json({ error: err.message || 'Failed to create PayPal order.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/paypal/capture-order
// Captures an approved PayPal Order and finalises the donation.
// ─────────────────────────────────────────────────────────────────────────────
exports.capturePayPalOrder = async (req, res) => {
  try {
    const { paypalOrderId, donationId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({ error: 'paypalOrderId is required.' });
    }

    // Get access token
    const accessToken = await getPayPalAccessToken();

    // Capture the order with PayPal
    const captureRes = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = await captureRes.json();

    if (!captureRes.ok || captureData.status !== 'COMPLETED') {
      console.error('[PAYPAL CAPTURE ERROR]', JSON.stringify(captureData));
      return res.status(502).json({ error: 'PayPal capture failed.', details: captureData });
    }

    // Extract capture details from the response
    const captureUnit = captureData.purchase_units?.[0];
    const capture = captureUnit?.payments?.captures?.[0];
    const capturedAmount = parseFloat(capture?.amount?.value || 0);
    const capturedCurrency = capture?.amount?.currency_code || 'USD';

    // Find the donation — first by donationId, then by paypalOrderId
    let donation = null;
    if (donationId) {
      donation = await prisma.donation.findUnique({ where: { id: donationId } });
    }
    if (!donation) {
      donation = await prisma.donation.findUnique({ where: { paypalOrderId } });
    }

    if (!donation) {
      console.error(`[PAYPAL CAPTURE] Donation not found for order ${paypalOrderId}`);
      return res.status(404).json({ error: 'Donation record not found.' });
    }

    if (donation.paymentStatus === 'FINISHED') {
      console.log(`[PAYPAL CAPTURE] Already FINISHED — skipping duplicate for ${donation.id}`);
      return res.json({ success: true, donationId: donation.id, alreadyCaptured: true });
    }

    // Update donation to FINISHED
    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        paymentStatus: 'FINISHED',
        paypalOrderId,
        originalAmount: capturedAmount || donation.usdAmount,
        usdAmount: capturedAmount || donation.usdAmount,
        originalCurrency: capturedCurrency,
        updatedAt: new Date(),
      },
    });

    // Trigger settlement processing
    await processDonationSettlement(updated.id);

    console.log(`[PAYPAL] Order ${paypalOrderId} captured — Donation ${updated.id} FINISHED. $${capturedAmount}`);
    return res.json({ success: true, donationId: updated.id });

  } catch (err) {
    console.error('[PAYPAL CAPTURE ERROR]', err.message);
    return res.status(500).json({ error: err.message || 'Failed to capture PayPal order.' });
  }
};
