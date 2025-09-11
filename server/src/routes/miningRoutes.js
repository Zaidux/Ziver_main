const express = require('express');
const router = express.Router();
const { claimReward, getMiningStatus } = require('../controllers/miningController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/mining/claim
// @desc    Claim mining rewards and update streak
// @access  Private
router.post('/claim', protect, claimReward);

// @route   GET /api/mining/status
// @desc    Get current mining status and user data
// @access  Private
router.get('/status', protect, getMiningStatus);

module.exports = router;