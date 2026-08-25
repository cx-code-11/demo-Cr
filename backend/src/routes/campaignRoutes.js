const express = require('express');
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAllCampaigns);
router.get('/:id', getCampaignById);
router.post('/', authMiddleware, authorizeRoles('NGO'), createCampaign);
router.put('/:id', authMiddleware, authorizeRoles('NGO', 'ADMIN'), updateCampaign);
router.delete('/:id', authMiddleware, authorizeRoles('NGO', 'ADMIN'), deleteCampaign);

module.exports = router;
