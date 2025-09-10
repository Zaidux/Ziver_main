const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getReferralData,
  removeReferral,
} = require('../controllers/referralsController');

// @route   GET /api/referrals
// @desc    Get the logged-in user's referral code and list of referred users
// @access  Private
router.get('/', protect, getReferralData);

// @route   DELETE /api/referrals/:userId
// @desc    Remove a user from the referrer's list
// @access  Private
router.delete('/:userId', protect, removeReferral);

module.exports = router;