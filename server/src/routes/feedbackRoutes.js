// server/src/routes/feedbackRoutes.js
const express = require('express');
const multer = require('multer');
// 💡 NOTE: asyncHandler is no longer needed for the POST route handler itself
// const asyncHandler = require('express-async-handler'); 
const feedbackController = require('../controllers/settings/feedbackController');
const { protect } = require('../middleware/authMiddleware'); // adjust if needed

const router = express.Router();

// Use in-memory storage for uploading to S3
const upload = multer({ storage: multer.memoryStorage() });

// Health check
router.get('/', (req, res) => res.json({ status: 'Feedback API working' }));

// Handle feedback submission with multiple attachments
// FIX: Removed the outer asyncHandler and the unnecessary anonymous async function.
// Express will execute middleware/handlers in order: protect, upload.array, feedbackController.submitFeedback.
// Since submitFeedback is already wrapped in asyncHandler, it handles errors gracefully.
router.post(
  '/',
  protect, 
  upload.array('attachments'), // <-- multer populates req.files and req.body
  feedbackController.submitFeedback // <-- Direct call to the wrapped controller function
);

// Optional: get user feedback
router.get('/user', protect, feedbackController.getUserFeedback);

module.exports = router;
