// server/src/routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');

const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const feedbackController = require('../controllers/settings/feedbackController');

console.log('🔄 Loading feedback routes...');

// Multer config: memoryStorage (keep as you had it)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 Multer processing file:', file.originalname, file.mimetype);
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('❌ Multer rejected file:', file.originalname, file.mimetype);
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/feedback
 * Middleware chain:
 *  - initial logger
 *  - protect (auth)
 *  - post-auth logger
 *  - upload.array('attachments', 5)
 *  - post-upload logger
 *  - controller
 */
router.post(
  '/',
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

/**
 * Public / authenticated routes (static paths first)
 * Important: keep static routes above param routes to avoid `/:id` swallowing them.
 */

// Get user's own feedback
router.get('/my-feedback', protect, feedbackController.getUserFeedback);

// Admin-only stats & listing
router.get('/stats/overview', protect, admin, feedbackController.getFeedbackStats);
router.get('/', protect, admin, feedbackController.getAllFeedback);

// Param routes last
router.get('/:id', protect, feedbackController.getFeedbackDetails);
router.put('/:id/status', protect, admin, feedbackController.updateFeedbackStatus);
router.post('/:id/reward', protect, admin, feedbackController.rewardUser);

/**
 * Router-level error handler to catch Multer errors and reply JSON.
 * This prevents empty responses or connection resets when multer throws.
 */
router.use((err, req, res, next) => {
  // Multer errors are instances of multer.MulterError
  if (err instanceof multer.MulterError) {
    console.error('🧯 MulterError in feedback routes:', err.code, err.message);
    // Common codes: 'LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'
    let message = err.message || 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'One or more files exceed the maximum size of 5MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded. Maximum is 5.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Invalid file type or unexpected file field.';
    }
    return res.status(400).json({
      success: false,
      message
    });
  }

  // If it's another error, pass it to the next error handler (global)
  next(err);
});

module.exports = router;