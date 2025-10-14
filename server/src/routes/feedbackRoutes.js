const express = require('express');
const { 
  submitFeedback,
  getUserFeedback,
  getFeedbackDetails,
  getAllFeedback,
  getFeedbackStats,
  updateFeedbackStatus,
  rewardUser
} = require('../controllers/settings/feedbackController');
const { protect } = require('../middleware/authMiddleware');
const { adminProtect } = require('../middleware/adminMiddleware');

const router = express.Router();

// Health check
router.get('/', (req, res) => {
  res.json({ 
    status: 'Feedback API working',
    timestamp: new Date().toISOString()
  });
});

// Submit feedback (with built-in form parsing)
router.post('/', protect, submitFeedback);

// User routes
router.get('/user', protect, getUserFeedback);
router.get('/:id', protect, getFeedbackDetails);

// Admin routes
router.get('/admin/all', protect, adminProtect, getAllFeedback);
router.get('/admin/stats', protect, adminProtect, getFeedbackStats);
router.put('/admin/:id/status', protect, adminProtect, updateFeedbackStatus);
router.post('/admin/:id/reward', protect, adminProtect, rewardUser);

module.exports = router;