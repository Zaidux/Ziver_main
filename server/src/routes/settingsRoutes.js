const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const twoFactorMiddleware = require('../middleware/twoFactorMiddleware');
const settingsController = require('../controllers/settings');

// Security routes - FIXED: Add PUT method for toggleTwoFactor
router.put('/security/password', protect, settingsController.security.changePassword);
router.post('/security/two-factor', protect, settingsController.security.toggleTwoFactor);
router.put('/security/two-factor', protect, settingsController.security.toggleTwoFactor); // ADD THIS LINE
router.get('/security/two-factor/setup', protect, settingsController.security.generateTwoFactorSetup);
router.post('/security/backup-codes', protect, settingsController.security.generateBackupCodes);
router.get('/security', protect, settingsController.security.getSecuritySettings);
router.post('/security/two-factor/verify', protect, settingsController.security.verifyTwoFactor);
router.get('/security/two-factor/status', protect, settingsController.security.getTwoFactorStatus);

// Appearance routes
router.put('/appearance/theme', protect, settingsController.appearance.updateTheme);
router.put('/appearance/language', protect, settingsController.appearance.updateLanguage);
router.put('/appearance', protect, settingsController.appearance.updateAppearanceSettings);
router.get('/appearance', protect, settingsController.appearance.getAppearanceSettings);
router.delete('/appearance/reset', protect, settingsController.appearance.resetAppearanceSettings);

// Notification routes
router.put('/notifications', protect, settingsController.notifications.updateNotifications);
router.put('/notifications/category', protect, settingsController.notifications.updateNotificationCategories);
router.get('/notifications', protect, settingsController.notifications.getNotificationSettings);
router.delete('/notifications/reset', protect, settingsController.notifications.resetNotificationSettings);

// Account routes
router.put('/account/email', protect, settingsController.account.updateEmail);
router.get('/account', protect, settingsController.account.getAccountSettings);
router.delete('/account', protect, settingsController.account.deleteAccount);
router.get('/account/export', protect, settingsController.account.exportData);

// 2FA protected routes (example - for sensitive operations)
router.get('/security/sensitive-data', protect, twoFactorMiddleware.require2FA, (req, res) => {
  res.json({
    success: true,
    message: 'Access granted to sensitive data',
    data: {
      // Sensitive data here
    }
  });
});

module.exports = router;