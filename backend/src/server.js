const express = require('express');
const cors = require('cors');
require('dotenv').config();

const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes   = require('./routes/adminRoutes');
const banxaRoutes   = require('./routes/banxaRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// ─── RAW BODY for webhook signature verification ───────────────────────────────
// NOWPayments and Stripe webhook signature checks require raw Buffer payload
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/stripe-webhook', express.raw({ type: 'application/json' }));
// Banxa webhook — capture raw body for HMAC-SHA256 signature verification
app.use('/api/payments/banxa/webhook', (req, res, next) => {
  let data = '';
  req.on('data', chunk => { data += chunk; });
  req.on('end', () => { req.rawBody = data; next(); });
});

// ─── JSON body parser (for all other API routes) ──────────────────────────────
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/payments', paymentRoutes);
app.use('/api/payments/banxa', banxaRoutes);
app.use('/api/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TrustAid API is running' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
