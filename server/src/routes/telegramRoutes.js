const express = require('express');
const router = express.Router();
const {
  setWebhook,
  handleTelegramWebhook,
  generateConnectionCode,
  verifyConnectionCode,
  getConnectionStatus,
  disconnectTelegram,
  updateNotificationSettings,
  setWebhookManual,
  getWebhookInfo,
  sendTestMessage
} = require('../controllers/telegramController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/webhook', handleTelegramWebhook);

// NEW: Health check endpoint (public)
router.get('/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    hasBotToken: !!process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || `${process.env.BASE_URL}/api/telegram/webhook`
  });
});

// Protected routes (require authentication)
router.post('/generate-connection-code', protect, generateConnectionCode);
router.post('/verify-connection', protect, verifyConnectionCode);
router.get('/connection-status', protect, getConnectionStatus);
router.post('/disconnect', protect, disconnectTelegram);
router.put('/notification-settings', protect, updateNotificationSettings);

// Admin/utility routes
router.post('/set-webhook', protect, setWebhookManual);
router.get('/webhook-info', protect, getWebhookInfo);
router.post('/test-message', protect, sendTestMessage);

module.exports = router;