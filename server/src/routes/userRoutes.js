const express = require('express');
const router = express.Router();

const { 
  getUserProfile, 
  updateUserActivity,
  recordHeartbeat,
  verifyToken // NEW: Add this import
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/user/verify-token
// @desc    Verify if user's token is still valid
// @access  Private
router.get('/verify-token', protect, verifyToken);

// @route   GET /api/user/me
router.get('/me', protect, getUserProfile);

// @route   POST /api/user/activity
router.post('/activity', protect, updateUserActivity);

// @route   POST /api/user/heartbeat
// @desc    Record that the user is currently active
// @access  Private
router.post('/heartbeat', protect, recordHeartbeat);

module.exports = router;