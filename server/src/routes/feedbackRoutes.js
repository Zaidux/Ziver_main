const express = require('express');
const router = express.Router();
const multer = require('multer');

// DEBUG: Check middleware imports
try {
  console.log('🔍 Checking middleware imports...');
  const { protect } = require('../middleware/authMiddleware');
  const { adminOnly } = require('../middleware/adminMiddleware');
  
  console.log('✅ Middleware loaded successfully');
  console.log('📋 protect type:', typeof protect);
  console.log('📋 adminOnly type:', typeof adminOnly);
  
  if (typeof protect !== 'function') {
    console.log('❌ protect is not a function');
  }
  if (typeof adminOnly !== 'function') {
    console.log('❌ adminOnly is not a function');
  }
} catch (error) {
  console.error('❌ Failed to load middleware:', error);
  process.exit(1);
}

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const feedbackController = require('../controllers/settings/feedbackController');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

console.log('🔍 Setting up routes...');

// Public routes (require authentication)
router.post('/', protect, upload.array('attachments', 5), feedbackController.submitFeedback);
console.log('✅ POST / route configured');

router.get('/my-feedback', protect, feedbackController.getUserFeedback);
console.log('✅ GET /my-feedback route configured');

router.get('/:id', protect, feedbackController.getFeedbackDetails);
console.log('✅ GET /:id route configured');

// Admin routes
router.get('/', protect, adminOnly, feedbackController.getAllFeedback);
console.log('✅ GET / (admin) route configured');

router.get('/stats/overview', protect, adminOnly, feedbackController.getFeedbackStats);
console.log('✅ GET /stats/overview route configured');

router.put('/:id/status', protect, adminOnly, feedbackController.updateFeedbackStatus);
console.log('✅ PUT /:id/status route configured');

router.post('/:id/reward', protect, adminOnly, feedbackController.rewardUser);
console.log('✅ POST /:id/reward route configured');

console.log('🎯 All feedback routes configured successfully');

module.exports = router;