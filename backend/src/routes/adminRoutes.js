const express = require('express');
const {
  getAllNgos,
  verifyNgo,
  getAllPayoutRequests,
  processPayout,
  getAdminStats,
} = require('../controllers/adminController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply auth protection & role check to all admin routes
router.use(authMiddleware, authorizeRoles('ADMIN'));

router.get('/ngos', getAllNgos);
router.put('/ngos/:id/verify', verifyNgo);
router.get('/payouts', getAllPayoutRequests);
router.put('/payouts/:id/approve', processPayout);
router.get('/stats', getAdminStats);

module.exports = router;
