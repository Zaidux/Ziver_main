const express = require('express');
const router = express.Router();

const { 
  getUserProfile, 
  updateUserActivity,
  recordHeartbeat // <-- NEW
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/user/me
router.get('/me', protect, getUserProfile);

// @route   POST /api/user/activity
router.post('/activity', protect, updateUserActivity);

// @route   POST /api/user/heartbeat  <-- NEW ROUTE
// @desc    Record that the user is currently active
// @access  Private
router.post('/heartbeat', protect, recordHeartbeat);

module.exports = router;