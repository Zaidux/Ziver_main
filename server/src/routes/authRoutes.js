const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleAuth,
  googleCallback,
  getReferrerInfo,
  createPendingReferral,
  verify2FALogin
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
// @desc    Authenticate with Google OAuth (direct token)
// @access  Public
router.post('/google', googleAuth);

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback handler
// @access  Public
router.get('/google/callback', googleCallback);

// @route   GET /api/auth/referrer-info/:referralCode
// @desc    Get referrer info by referral code
// @access  Public
router.get('/referrer-info/:referralCode', getReferrerInfo);

// @route   POST /api/auth/pending-referral
// @desc    Create a pending referral
// @access  Public
router.post('/pending-referral', createPendingReferral);

// @route   POST /api/auth/verify-2fa
// @desc    Verify 2FA code and complete login
// @access  Public
router.post('/verify-2fa', verify2FALogin);

module.exports = router;