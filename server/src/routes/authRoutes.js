const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getReferrerInfo,
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

// @route   GET /api/auth/referrer-info/:referralCode
// @desc    Get referrer info by referral code (alternative endpoint)
// @access  Public
router.get('/referrer-info/:referralCode', getReferrerInfo);

// @route   POST /api/auth/pending-referral
// @desc    Create a pending referral
// @access  Public
router.post('/pending-referral', createPendingReferral);

module.exports = router;