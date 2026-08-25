const express = require('express');
const { createDonation, getMyDonationHistory, getPlatformStats } = require('../controllers/donationController');
const { authMiddleware, optionalAuthMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuthMiddleware, createDonation);
router.get('/history', authMiddleware, authorizeRoles('DONOR'), getMyDonationHistory);
router.get('/stats', getPlatformStats);

module.exports = router;
