const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware'); // CHANGED: adminOnly to admin
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

// Admin routes - CHANGED: adminOnly to admin
router.get('/', protect, admin, feedbackController.getAllFeedback);
router.get('/stats/overview', protect, admin, feedbackController.getFeedbackStats);
router.put('/:id/status', protect, admin, feedbackController.updateFeedbackStatus);
router.post('/:id/reward', protect, admin, feedbackController.rewardUser);

module.exports = router;