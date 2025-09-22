const express = require('express');
const router = express.Router();
const {
  setWebhook,
  handleTelegramWebhook,
  getTelegramReferral,
  verifyConnectionCode,
  setWebhookManual,
  getWebhookInfo,
  sendTestMessage
} = require('../controllers/telegramController');

// @route   POST /api/telegram/webhook
// @desc    Handle incoming Telegram webhook messages
// @access  Public
router.post('/webhook', handleTelegramWebhook);

// @route   POST /api/telegram/set-webhook
// @desc    Set the Telegram webhook URL
// @access  Private
router.post('/set-webhook', setWebhookManual);

// @route   GET /api/telegram/webhook-info
// @desc    Get webhook information
// @access  Private
router.get('/webhook-info', getWebhookInfo);

// @route   POST /api/telegram/test-message
// @desc    Send a test message
// @access  Private
router.post('/test-message', sendTestMessage);

// @route   GET /api/telegram/referral/:telegramId
// @desc    Get referral info for a Telegram user
// @access  Private
router.get('/referral/:telegramId', getTelegramReferral);

// @route   POST /api/telegram/verify-connection
// @desc    Verify connection code from app
// @access  Private
router.post('/verify-connection', verifyConnectionCode);

module.exports = router;