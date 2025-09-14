// In server/src/routes/telegramRoutes.js (create this file)
const express = require('express');
const router = express.Router();
const { handleTelegramWebhook, getTelegramReferral } = require('../controllers/telegramController');

router.post('/webhook', handleTelegramWebhook);
router.get('/referral/:telegramId', getTelegramReferral);

module.exports = router;