const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard,
  getReferrerInfo,
  clearPendingReferral
} = require('../controllers/referralsController');

// @route   GET /api/referrals/referrer-info/:referralCode
// @desc    Get referrer information by referral code (for registration)
// @access  Public (needed for registration page)
router.get('/referrer-info/:referralCode', getReferrerInfo);

// @route   POST /api/referrals/apply
// @desc    Apply a referral code to a user
// @access  Public (needed for registration)
router.post('/apply', applyReferral);

// @route   DELETE /api/referrals/pending/:referralCode
// @desc    Clear a pending referral
// @access  Public (needed for cleanup)
router.delete('/pending/:referralCode', clearPendingReferral);

// @route   GET /api/referrals
// @desc    Get the logged-in user's referral data
// @access  Private
router.get('/', protect, getReferralData);

// @route   DELETE /api/referrals/:userId
// @desc    Remove a user from the referrer's list
// @access  Private
router.delete('/:userId', protect, removeReferral);

// @route   GET /api/referrals/leaderboard
// @desc    Get referral leaderboard
// @access  Private
router.get('/leaderboard', protect, getLeaderboard);

module.exports = router;