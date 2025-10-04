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
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/webhook', handleTelegramWebhook);

// Protected routes (require authentication)
router.post('/generate-connection-code', authMiddleware, generateConnectionCode);
router.post('/verify-connection', authMiddleware, verifyConnectionCode);
router.get('/connection-status', authMiddleware, getConnectionStatus);
router.post('/disconnect', authMiddleware, disconnectTelegram);
router.put('/notification-settings', authMiddleware, updateNotificationSettings);

// Admin/utility routes
router.post('/set-webhook', authMiddleware, setWebhookManual);
router.get('/webhook-info', authMiddleware, getWebhookInfo);
router.post('/test-message', authMiddleware, sendTestMessage);

module.exports = router;