const express = require('express');
const router = express.Router();
const { 
  claimReward, 
  getMiningStatus,
  startMining,
  getMiningConfig,
  updateMiningSettings,
  checkMiningCompletion // Add this
} = require('../controllers/miningController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/mining/claim
// @desc    Claim mining rewards and update streak
// @access  Private
router.post('/claim', protect, claimReward);

// @route   GET /api/mining/status
// @desc    Get current mining status and user data
// @access  Private
router.get('/status', protect, getMiningStatus);

// @route   GET /api/mining/check-completion
// @desc    Check if mining is complete (for manual checks)
// @access  Private
router.get('/check-completion', protect, checkMiningCompletion);

// @route   POST /api/mining/start
// @desc    Start a new mining session
// @access  Private
router.post('/start', protect, startMining);

// @route   GET /api/mining/config
// @desc    Get mining configuration settings
// @access  Private
router.get('/config', protect, getMiningConfig);

// @route   PUT /api/mining/settings
// @desc    Update mining settings
// @access  Private
router.put('/settings', protect, updateMiningSettings);

module.exports = router;