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
const { admin } = require('../middleware/adminMiddleware'); // FIXED: Changed from adminProtect to admin

const router = express.Router();

// Debug: Check what we're actually importing
console.log('=== FEEDBACK CONTROLLER DEBUG ===');
console.log('submitFeedback:', typeof submitFeedback);
console.log('getUserFeedback:', typeof getUserFeedback);
console.log('getAllFeedback:', typeof getAllFeedback);
console.log('getFeedbackStats:', typeof getFeedbackStats);
console.log('updateFeedbackStatus:', typeof updateFeedbackStatus);
console.log('rewardUser:', typeof rewardUser);
console.log('getFeedbackDetails:', typeof getFeedbackDetails);
console.log('=== MIDDLEWARE DEBUG ===');
console.log('protect:', typeof protect);
console.log('admin:', typeof admin); // FIXED: Changed from adminProtect to admin
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

// Admin routes - FIXED: Changed from adminProtect to admin
router.get('/admin/all', protect, admin, getAllFeedback);
router.get('/admin/stats', protect, admin, getFeedbackStats);
router.put('/admin/:id/status', protect, admin, updateFeedbackStatus);
router.post('/admin/:id/reward', protect, admin, rewardUser);

module.exports = router;