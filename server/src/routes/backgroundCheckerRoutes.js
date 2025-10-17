const express = require('express');
const router = express.Router();
const backgroundMiningChecker = require('../services/backgroundMiningChecker');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// @route   POST /api/background-checker/start
// @desc    Start background mining checker
// @access  Private/Admin
router.post('/start', protect, adminOnly, (req, res) => {
  backgroundMiningChecker.start();
  res.json({
    success: true,
    message: 'Background mining checker started',
    status: backgroundMiningChecker.getStatus()
  });
});

// @route   POST /api/background-checker/stop
// @desc    Stop background mining checker
// @access  Private/Admin
router.post('/stop', protect, adminOnly, (req, res) => {
  backgroundMiningChecker.stop();
  res.json({
    success: true,
    message: 'Background mining checker stopped',
    status: backgroundMiningChecker.getStatus()
  });
});

// @route   POST /api/background-checker/manual-check
// @desc    Manually trigger a mining status check
// @access  Private/Admin
router.post('/manual-check', protect, adminOnly, async (req, res) => {
  await backgroundMiningChecker.manualCheck();
  res.json({
    success: true,
    message: 'Manual mining check completed',
    status: backgroundMiningChecker.getStatus()
  });
});

// @route   GET /api/background-checker/status
// @desc    Get background checker status
// @access  Private/Admin
router.get('/status', protect, adminOnly, (req, res) => {
  res.json({
    success: true,
    status: backgroundMiningChecker.getStatus()
  });
});

module.exports = router;