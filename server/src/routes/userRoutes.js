const express = require('express');
const router = express.Router();

// We will create this controller and middleware later
const { getUserProfile, updateUserActivity } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/user/me
// @desc    Get logged in user's profile
// @access  Private
router.get('/me', protect, getUserProfile);


// @route   POST /api/user/activity
// @desc    Log a user activity to update their score
// @access  Private
router.post('/activity', protect, updateUserActivity);


module.exports = router;

