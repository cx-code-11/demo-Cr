const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const donationRoutes = require('./routes/donationRoutes');
const ngoRoutes = require('./routes/ngoRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

// Determine CORS origin based on environment
const getCorsOrigin = () => {
  if (process.env.NODE_ENV === 'production' && process.env.CORS_ORIGIN) {
    return `https://${process.env.CORS_ORIGIN}`;
  }
  return 'http://localhost:3000'; // Local development
};

// Middleware
app.use(cors({
  origin: getCorsOrigin(),
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/admin', adminRoutes);

// Simple Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Charity API is running smoothly' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`Backend Server is running on port ${PORT}`);
});

