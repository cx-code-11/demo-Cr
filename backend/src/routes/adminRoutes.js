const express = require('express');
const router = express.Router();
const { getDonations, getStats } = require('../controllers/adminController');

// GET /api/admin/stats
router.get('/stats', getStats);

// GET /api/admin/donations?page=1&limit=20&status=FINISHED
router.get('/donations', getDonations);

module.exports = router;
