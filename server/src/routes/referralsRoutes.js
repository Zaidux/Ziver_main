const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard
} = require('../controllers/referralsController');

// @route   POST /api/referrals/apply
// @desc    Apply a referral code to a user
// @access  Public (needed for registration)
router.post('/apply', applyReferral);

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