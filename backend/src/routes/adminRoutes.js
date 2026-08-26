const express = require('express');
const router = express.Router();
const {
  getDonations,
  getStats,
  processM1SettlementBatch,
  updateSettlement,
  exportSettlementsCsv,
} = require('../controllers/adminController');

// GET /api/admin/stats
router.get('/stats', getStats);

// GET /api/admin/donations?page=1&limit=20&status=FINISHED&settlementType=M0&settlementStatus=SETTLED
router.get('/donations', getDonations);

// POST /api/admin/settlements/process-m1
router.post('/settlements/process-m1', processM1SettlementBatch);

// POST /api/admin/settlements/:id/update
router.post('/settlements/:id/update', updateSettlement);

// GET /api/admin/settlements/export
router.get('/settlements/export', exportSettlementsCsv);

module.exports = router;
