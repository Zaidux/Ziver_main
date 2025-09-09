const express = require('express');
const router = express.Router();
const { claimReward } = require('../controllers/miningController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/mining/claim
// @desc    Claim mining rewards and update streak
// @access  Private
router.post('/claim', protect, claimReward);

module.exports = router;