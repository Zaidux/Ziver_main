const express = require('express');
const router = express.Router();

const { 
  getUserProfile, 
  updateUserActivity,
  recordHeartbeat,
  verifyToken,
  updateProfile,
  uploadAvatar
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/user/verify-token
// @desc    Verify if user's token is still valid
// @access  Private
router.get('/verify-token', protect, verifyToken);

// @route   GET /api/user/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getUserProfile);

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, updateProfile);

// @route   POST /api/user/avatar
// @desc    Upload user avatar
// @access  Private
router.post('/avatar', protect, uploadAvatar);

// @route   POST /api/user/activity
// @desc    Update user activity and score
// @access  Private
router.post('/activity', protect, updateUserActivity);

// @route   POST /api/user/heartbeat
// @desc    Record that the user is currently active
// @access  Private
router.post('/heartbeat', protect, recordHeartbeat);

module.exports = router;