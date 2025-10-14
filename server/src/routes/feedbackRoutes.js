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
const { admin } = require('../middleware/adminMiddleware');

const router = express.Router();

console.log('=== FEEDBACK ROUTES LOADED ===');

// Health check
router.get('/', (req, res) => {
  console.log('🏥 Health check endpoint hit');
  res.json({ 
    status: 'Feedback API working',
    timestamp: new Date().toISOString()
  });
});

// ===== TEST ENDPOINTS =====
// Test without authentication
router.post('/test-no-auth', (req, res) => {
  console.log('🧪 Test endpoint (no auth) hit');
  res.json({ 
    success: true, 
    message: 'Test endpoint without auth works',
    timestamp: new Date().toISOString()
  });
});

// Test with authentication
router.post('/test-with-auth', protect, (req, res) => {
  console.log('🧪 Test endpoint (with auth) hit - User:', req.user?.id);
  res.json({ 
    success: true, 
    message: 'Test endpoint with auth works',
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });
});

// Test form data parsing
router.post('/test-form-data', protect, async (req, res) => {
  console.log('🧪 Test form data endpoint hit');
  try {
    const UploadHandler = require('../../utils/uploadHandler');
    const result = await UploadHandler.parseFormData(req, res);
    res.json({
      success: true,
      message: 'Form data parsing works',
      fields: Object.keys(result.fields),
      filesCount: result.files.length,
      user: req.user?.id
    });
  } catch (error) {
    console.error('❌ Form data test failed:', error);
    res.status(400).json({
      success: false,
      message: 'Form data parsing failed: ' + error.message
    });
  }
});
// ===== END TEST ENDPOINTS =====

// Submit feedback (with built-in form parsing)
router.post('/', protect, submitFeedback);

// User routes
router.get('/user', protect, getUserFeedback);
router.get('/:id', protect, getFeedbackDetails);

// Admin routes
router.get('/admin/all', protect, admin, getAllFeedback);
router.get('/admin/stats', protect, admin, getFeedbackStats);
router.put('/admin/:id/status', protect, admin, updateFeedbackStatus);
router.post('/admin/:id/reward', protect, admin, rewardUser);

module.exports = router;