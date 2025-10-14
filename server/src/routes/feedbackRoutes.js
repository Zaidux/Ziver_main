// server/src/routes/feedbackRoutes.js
const express = require('express');
const multer = require('multer');
const asyncHandler = require('express-async-handler');
const feedbackController = require('../controllers/settings/feedbackController');
const { protect } = require('../middleware/authMiddleware'); // adjust if needed

const router = express.Router();

// Use in-memory storage for uploading to S3
const upload = multer({ storage: multer.memoryStorage() });

// Health check
router.get('/', (req, res) => res.json({ status: 'Feedback API working' }));

// Handle feedback submission with multiple attachments
router.post(
  '/',
  protect, // ensure user is authenticated
  upload.array('attachments'), // <-- must match frontend field name
  asyncHandler(async (req, res) => {
    console.log('📥 Incoming feedback submission');
    await feedbackController.submitFeedback(req, res);
  })
);

// Optional: get user feedback
router.get('/user', protect, feedbackController.getUserFeedback);

module.exports = router;