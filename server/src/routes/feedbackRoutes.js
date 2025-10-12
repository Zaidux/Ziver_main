const express = require('express');
const router = express.Router();
const multer = require('multer');
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

// Public routes (require authentication)
router.post('/', protect, upload.array('attachments', 5), feedbackController.submitFeedback);
router.get('/my-feedback', protect, feedbackController.getUserFeedback);
router.get('/:id', protect, feedbackController.getFeedbackDetails);

// Admin routes
router.get('/', protect, adminOnly, feedbackController.getAllFeedback);
router.get('/stats/overview', protect, adminOnly, feedbackController.getFeedbackStats);
router.put('/:id/status', protect, adminOnly, feedbackController.updateFeedbackStatus);
router.post('/:id/reward', protect, adminOnly, feedbackController.rewardUser);

module.exports = router;