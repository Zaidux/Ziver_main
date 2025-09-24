const express = require('express');
const router = express.Router();

// Import the controller functions - FIXED IMPORTS
const { 
  registerUser, 
  loginUser, 
  getReferrerInfo, 
  createPendingReferral 
} = require('../controllers/authController');

// @route   GET /api/auth/referrer-info/:referralCode
// @desc    Get referrer information by referral code
// @access  Public
router.get('/referrer-info/:referralCode', getReferrerInfo);

// @route   POST /api/auth/pending-referral
// @desc    Create a pending referral record
// @access  Public
router.post('/pending-referral', createPendingReferral);

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginUser);

module.exports = router;