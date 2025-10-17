const express = require('express');
const router = express.Router();
const backgroundMiningChecker = require('../services/backgroundMiningChecker');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @route   POST /api/background-checker/start
// @desc    Start background mining checker
// @access  Private/Admin
router.post('/start', protect, adminOnly, (req, res) => {
  try {
    backgroundMiningChecker.start();
    res.json({
      success: true,
      message: 'Background mining checker started',
      status: backgroundMiningChecker.getStatus()
    });
  } catch (error) {
    console.error('Error starting background checker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start background checker'
    });
  }
});

// @route   POST /api/background-checker/stop
// @desc    Stop background mining checker
// @access  Private/Admin
router.post('/stop', protect, adminOnly, (req, res) => {
  try {
    backgroundMiningChecker.stop();
    res.json({
      success: true,
      message: 'Background mining checker stopped',
      status: backgroundMiningChecker.getStatus()
    });
  } catch (error) {
    console.error('Error stopping background checker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop background checker'
    });
  }
});

// @route   POST /api/background-checker/manual-check
// @desc    Manually trigger a mining status check
// @access  Private/Admin
router.post('/manual-check', protect, adminOnly, async (req, res) => {
  try {
    await backgroundMiningChecker.manualCheck();
    res.json({
      success: true,
      message: 'Manual mining check completed',
      status: backgroundMiningChecker.getStatus()
    });
  } catch (error) {
    console.error('Error during manual check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform manual check'
    });
  }
});

// @route   GET /api/background-checker/status
// @desc    Get background checker status
// @access  Private/Admin
router.get('/status', protect, adminOnly, (req, res) => {
  try {
    res.json({
      success: true,
      status: backgroundMiningChecker.getStatus()
    });
  } catch (error) {
    console.error('Error getting background checker status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get background checker status'
    });
  }
});

module.exports = router;