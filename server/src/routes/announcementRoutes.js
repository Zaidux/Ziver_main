const express = require('express');
const router = express.Router();
const {
  sendAnnouncement,
  sendUserMessage,
  getAnnouncementHistory,
  getTelegramStats
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware'); // Changed from adminOnly to admin

// @route   POST /api/announcements/send
// @desc    Send announcement to Telegram users
// @access  Private/Admin
router.post('/send', protect, admin, sendAnnouncement);

// @route   POST /api/announcements/send-user
// @desc    Send message to specific Telegram user
// @access  Private/Admin
router.post('/send-user', protect, admin, sendUserMessage);

// @route   GET /api/announcements/history
// @desc    Get announcement history
// @access  Private/Admin
router.get('/history', protect, admin, getAnnouncementHistory);

// @route   GET /api/announcements/stats
// @desc    Get Telegram users statistics
// @access  Private/Admin
router.get('/stats', protect, admin, getTelegramStats);

module.exports = router;