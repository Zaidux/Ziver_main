const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const feedbackController = require('../controllers/settings/feedbackController');

console.log('🔄 Loading feedback routes...');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Multer processing file:', file.originalname);
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('❌ Multer rejected file:', file.originalname, file.mimetype);
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ✅ FIXED: Single POST route with proper middleware chain
router.post('/', 
  (req, res, next) => {
    console.log('🔐 Starting feedback submission process...');
    next();
  },
  protect,
  (req, res, next) => {
    console.log('✅ Authentication passed, user:', req.user?.id);
    next();
  },
  upload.array('attachments', 5),
  (req, res, next) => {
    console.log('✅ File upload completed, files count:', req.files ? req.files.length : 0);
    if (req.files) {
      req.files.forEach((file, index) => {
        console.log(`   File ${index + 1}: ${file.originalname} (${file.size} bytes)`);
      });
    }
    console.log('📝 Body fields:', Object.keys(req.body));
    next();
  },
  feedbackController.submitFeedback
);

// ❌❌❌ DELETE THIS DUPLICATE ROUTE - IT'S CAUSING THE ISSUE ❌❌❌
// router.post('/', protect, upload.array('attachments', 5), feedbackController.submitFeedback);

// Public routes (require authentication)
router.get('/my-feedback', protect, feedbackController.getUserFeedback);
router.get('/:id', protect, feedbackController.getFeedbackDetails);

// Admin routes
router.get('/', protect, admin, feedbackController.getAllFeedback);
router.get('/stats/overview', protect, admin, feedbackController.getFeedbackStats);
router.put('/:id/status', protect, admin, feedbackController.updateFeedbackStatus);
router.post('/:id/reward', protect, admin, feedbackController.rewardUser);

module.exports = router;