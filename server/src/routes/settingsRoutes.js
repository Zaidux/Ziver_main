const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settings');

// Security routes
router.put('/security/password', protect, settingsController.security.changePassword);
router.post('/security/two-factor', protect, settingsController.security.toggleTwoFactor);
router.get('/security/two-factor/setup', protect, settingsController.security.generateTwoFactorSetup);
router.get('/security', protect, settingsController.security.getSecuritySettings);

// Appearance routes
router.put('/appearance/theme', protect, settingsController.appearance.updateTheme);
router.put('/appearance/language', protect, settingsController.appearance.updateLanguage);
router.get('/appearance', protect, settingsController.appearance.getAppearanceSettings);

// Notification routes
router.put('/notifications', protect, settingsController.notifications.updateNotifications);
router.get('/notifications', protect, settingsController.notifications.getNotificationSettings);

// Account routes
router.put('/account/email', protect, settingsController.account.updateEmail);
router.get('/account', protect, settingsController.account.getAccountSettings);
router.delete('/account', protect, settingsController.account.deleteAccount);

module.exports = router;