const express = require('express');
const feedbackController = require('../controllers/settings/feedbackController');
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
router.post('/', protect, feedbackController.submitFeedback);

// User routes
router.get('/user', protect, feedbackController.getUserFeedback);
router.get('/:id', protect, feedbackController.getFeedbackDetails);

// Admin routes
router.get('/admin/all', protect, adminProtect, feedbackController.getAllFeedback);
router.get('/admin/stats', protect, adminProtect, feedbackController.getFeedbackStats);
router.put('/admin/:id/status', protect, adminProtect, feedbackController.updateFeedbackStatus);
router.post('/admin/:id/reward', protect, adminProtect, feedbackController.rewardUser);

module.exports = router;