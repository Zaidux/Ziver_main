const asyncHandler = require('express-async-handler');
const Feedback = require('../../models/Feedback');
const { uploadToS3, deleteFromS3 } = require('../../utils/fileUpload');

// Utility: sanitize string
function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

const feedbackController = {
  // =====================================================
  // 1️⃣ Submit new feedback (User)
  // =====================================================
  submitFeedback: asyncHandler(async (req, res) => {
    console.log('🟢 Feedback submission started...');

    // --- Authentication check
    const userId = req.user?.id;
    if (!userId) {
      console.warn('⚠️ Unauthorized feedback submission attempt.');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Please log in first.'
      });
    }

    // --- Extract body fields
    const { title, message, type, priority } = req.body;
    console.log('📥 Body received:', { title, message, type, priority });

    // --- Validation
    if (!title || !cleanString(title)) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }
    if (!message || !cleanString(message)) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    // --- Handle file uploads (if any)
    let attachments = [];
    try {
      if (Array.isArray(req.files) && req.files.length > 0) {
        console.log(`📎 Processing ${req.files.length} attachment(s)...`);
        for (const file of req.files) {
          const uploaded = await uploadToS3(file);
          attachments.push({
            filename: file.originalname,
            key: uploaded.key,
            url: uploaded.url,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      } else {
        console.log('📁 No attachments uploaded.');
      }
    } catch (uploadErr) {
      console.error('❌ File upload error:', uploadErr.message);
      return res.status(500).json({
        success: false,
        message: 'Attachment upload failed. Please retry.'
      });
    }

    // --- Save feedback to database
    try {
      const feedback = await Feedback.create({
        userId,
        title: cleanString(title),
        message: cleanString(message),
        type: type || 'suggestion',
        priority: priority || 'medium',
        attachments
      });

      console.log('✅ Feedback saved successfully:', feedback.id);

      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully.',
        feedback: {
          id: feedback.id,
          title: feedback.title,
          type: feedback.type,
          priority: feedback.priority,
          status: feedback.status,
          createdAt: feedback.created_at
        }
      });
    } catch (dbErr) {
      console.error('❌ Database save failed:', dbErr.message);

      // Rollback any uploaded files
      if (attachments.length > 0) {
        console.log('🧹 Rolling back uploaded files...');
        for (const a of attachments) {
          try {
            await deleteFromS3(a.key);
          } catch (cleanupErr) {
            console.error('Cleanup failed for', a.key, cleanupErr.message);
          }
        }
      }

      return res.status(500).json({
        success: false,
        message: 'Internal error while saving feedback.'
      });
    }
  }),

  // =====================================================
  // 2️⃣ Get user’s feedback (User)
  // =====================================================
  getUserFeedback: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized access.' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
      const result = await Feedback.findByUserId(userId, page, limit);
      return res.json({
        success: true,
        feedback: result.feedback,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });
    } catch (err) {
      console.error('❌ getUserFeedback error:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback history.'
      });
    }
  }),

  // =====================================================
  // 3️⃣ Get all feedback (Admin only)
  // =====================================================
  getAllFeedback: asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, type, priority } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (priority) filters.priority = priority;

    try {
      const result = await Feedback.findAll(page, limit, filters);
      return res.json({
        success: true,
        feedback: result.feedback,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });
    } catch (error) {
      console.error('❌ getAllFeedback error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback list.'
      });
    }
  }),

  // =====================================================
  // 4️⃣ Feedback statistics (Admin)
  // =====================================================
  getFeedbackStats: asyncHandler(async (req, res) => {
    try {
      const stats = await Feedback.getStats();

      const formatted = {
        byStatus: { pending: 0, reviewed: 0, in_progress: 0, resolved: 0, rewarded: 0, closed: 0 },
        byType: { suggestion: 0, bug: 0, complaint: 0, feature: 0 },
        byPriority: { low: 0, medium: 0, high: 0 }
      };

      stats.forEach(s => {
        if (formatted.byStatus[s.status] !== undefined) formatted.byStatus[s.status] = parseInt(s.count);
        if (formatted.byType[s.type] !== undefined) formatted.byType[s.type] = parseInt(s.count);
        if (formatted.byPriority[s.priority] !== undefined) formatted.byPriority[s.priority] = parseInt(s.count);
      });

      return res.json({ success: true, stats: formatted });
    } catch (error) {
      console.error('❌ getFeedbackStats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to load feedback stats.'
      });
    }
  }),

  // =====================================================
  // 5️⃣ Update feedback status (Admin)
  // =====================================================
  updateFeedbackStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'in_progress', 'resolved', 'rewarded', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    try {
      const feedback = await Feedback.updateStatus(id, status, adminNotes);
      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found.' });
      }

      return res.json({
        success: true,
        message: 'Feedback status updated successfully.',
        feedback
      });
    } catch (error) {
      console.error('❌ updateFeedbackStatus error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to update feedback status.'
      });
    }
  }),

  // =====================================================
  // 6️⃣ Reward user (Admin)
  // =====================================================
  rewardUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { zpReward = 0, sebReward = 0, adminNotes } = req.body;

    if (zpReward < 0 || sebReward < 0) {
      return res.status(400).json({ success: false, message: 'Rewards cannot be negative.' });
    }
    if (zpReward === 0 && sebReward === 0) {
      return res.status(400).json({ success: false, message: 'At least one reward is required.' });
    }

    try {
      const feedback = await Feedback.rewardUser(id, {
        zpReward: parseInt(zpReward),
        sebReward: parseInt(sebReward),
        adminNotes
      });

      return res.json({
        success: true,
        message: 'User rewarded successfully.',
        feedback
      });
    } catch (error) {
      console.error('❌ rewardUser error:', error.message);
      const message = error.message === 'Feedback not found' ? 'Feedback not found.' : 'Failed to reward user.';
      return res.status(error.message === 'Feedback not found' ? 404 : 500).json({
        success: false,
        message
      });
    }
  }),

  // =====================================================
  // 7️⃣ Get single feedback (User or Admin)
  // =====================================================
  getFeedbackDetails: asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const feedback = await Feedback.findById(id);
      if (!feedback) {
        return res.status(404).json({ success: false, message: 'Feedback not found.' });
      }

      // Only admin or owner can access
      if (feedback.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }

      return res.json({ success: true, feedback });
    } catch (error) {
      console.error('❌ getFeedbackDetails error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback details.'
      });
    }
  })
};

module.exports = feedbackController;