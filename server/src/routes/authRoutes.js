const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);


// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginUser);

// Add these to your existing authRoutes.js
router.get('/referrer-info/:referralCode', getReferrerInfo);
router.post('/pending-referral', createPendingReferral);


module.exports = router;
