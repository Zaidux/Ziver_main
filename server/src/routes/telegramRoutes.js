const express = require('express');
const router = express.Router();
const {
  setWebhook,
  handleTelegramWebhook,
  getTelegramReferral,
  verifyConnectionCode
} = require('../controllers/telegramController');

// @route   POST /api/telegram/webhook
// @desc    Handle incoming Telegram webhook messages
// @access  Public (Telegram needs to access this)
router.post('/webhook', handleTelegramWebhook);

// @route   POST /api/telegram/set-webhook
// @desc    Set the Telegram webhook URL
// @access  Private (Admin only)
router.post('/set-webhook', setWebhook);

// @route   GET /api/telegram/referral/:telegramId
// @desc    Get referral info for a Telegram user
// @access  Private
router.get('/referral/:telegramId', getTelegramReferral);

// @route   POST /api/telegram/verify-connection
// @desc    Verify connection code from app
// @access  Private
router.post('/verify-connection', verifyConnectionCode);

module.exports = router;