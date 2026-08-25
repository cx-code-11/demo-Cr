const express = require('express');
const {
  getNgoProfile,
  updateNgoProfile,
  requestPayout,
  getPayouts,
  getNgoDashboard,
} = require('../controllers/ngoController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Apply auth protection & role check to all NGO routes
router.use(authMiddleware, authorizeRoles('NGO'));

router.get('/profile', getNgoProfile);
router.put('/profile', updateNgoProfile);
router.post('/payouts', requestPayout);
router.get('/payouts', getPayouts);
router.get('/dashboard', getNgoDashboard);

module.exports = router;
