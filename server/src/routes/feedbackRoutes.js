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

// Debug: Check what we're actually importing
console.log('=== FEEDBACK CONTROLLER DEBUG ===');
console.log('submitFeedback:', typeof submitFeedback);
console.log('getUserFeedback:', typeof getUserFeedback);
console.log('getAllFeedback:', typeof getAllFeedback); // This is the problematic one
console.log('getFeedbackStats:', typeof getFeedbackStats);
console.log('updateFeedbackStatus:', typeof updateFeedbackStatus);
console.log('rewardUser:', typeof rewardUser);
console.log('getFeedbackDetails:', typeof getFeedbackDetails);
console.log('==============================');

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