const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  getReferrerInfo,
  googleCallback,
  createPendingReferral
} = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth
// @access  Public
router.post('/google', googleAuth);

// @route   GET /api/auth/referrer-info/:referralCode
// @desc    Get referrer info by referral code (alternative endpoint)
// @access  Public
router.get('/referrer-info/:referralCode', getReferrerInfo);

// @route   POST /api/auth/pending-referral
// @desc    Create a pending referral
// @access  Public
router.post('/pending-referral', createPendingReferral);

module.exports = router;