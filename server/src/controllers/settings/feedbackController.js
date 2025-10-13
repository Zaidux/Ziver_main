const asyncHandler = require('express-async-handler');
const Feedback = require('../../models/Feedback');
const { uploadToS3, deleteFromS3 } = require('../../utils/fileUpload');

const feedbackController = {
  // Submit new feedback - FIXED VERSION
  submitFeedback: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { title, message, type, priority } = req.body;

    console.log('📝 Feedback submission started for user:', userId);

    // Validate required fields
    if (!title || !title.trim()) {
      console.log('❌ Validation failed: Title required');
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }

    if (!message || !message.trim()) {
      console.log('❌ Validation failed: Message required');
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Process file uploads
    let attachments = [];
    if (req.files && req.files.length > 0) {
      try {
        console.log(`📎 Processing ${req.files.length} attachment(s)`);
        for (const file of req.files) {
          const uploadResult = await uploadToS3(file);
          attachments.push({
            filename: file.originalname,
            key: uploadResult.key,
            url: uploadResult.url,
            size: file.size,
            mimetype: file.mimetype
          });
        }
      } catch (uploadError) {
        console.error('❌ File upload failed:', uploadError.message);
        return res.status(500).json({
          success: false,
          message: 'Error uploading attachments'
        });
      }
    }

    try {
      console.log('💾 Saving feedback to database');
      const feedback = await Feedback.create({
        userId,
        title: title.trim(),
        message: message.trim(),
        type: type || 'suggestion',
        priority: priority || 'medium',
        attachments
      });

      console.log('✅ Feedback saved successfully, ID:', feedback.id);

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        feedback: {
          id: feedback.id,
          title: feedback.title,
          type: feedback.type,
          priority: feedback.priority,
          status: feedback.status,
          createdAt: feedback.created_at
        }
      });

    } catch (error) {
      console.error('❌ Feedback submission failed:', error.message);

      // Clean up uploaded files if feedback creation fails
      if (attachments.length > 0) {
        console.log('🧹 Cleaning up uploaded files');
        for (const attachment of attachments) {
          try {
            await deleteFromS3(attachment.key);
          } catch (deleteError) {
            console.error('Cleanup error:', deleteError.message);
          }
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to submit feedback'
      });
    }
  }),

  // Get user's feedback history
  getUserFeedback: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    try {
      const result = await Feedback.findByUserId(userId, page, limit);

      res.json({
        success: true,
        feedback: result.feedback,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });

    } catch (error) {
      console.error('Get user feedback error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  }),

  // Get all feedback (Admin only)
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

      res.json({
        success: true,
        feedback: result.feedback,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });

    } catch (error) {
      console.error('Get all feedback error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback'
      });
    }
  }),

  // Get feedback statistics (Admin only)
  getFeedbackStats: asyncHandler(async (req, res) => {
    try {
      const stats = await Feedback.getStats();

      const formattedStats = {
        byStatus: {},
        byType: {},
        byPriority: {}
      };

      const allStatuses = ['pending', 'reviewed', 'in_progress', 'resolved', 'rewarded', 'closed'];
      const allTypes = ['suggestion', 'bug', 'complaint', 'feature'];
      const allPriorities = ['low', 'medium', 'high'];

      allStatuses.forEach(status => formattedStats.byStatus[status] = 0);
      allTypes.forEach(type => formattedStats.byType[type] = 0);
      allPriorities.forEach(priority => formattedStats.byPriority[priority] = 0);

      stats.forEach(stat => {
        if (stat.status && formattedStats.byStatus.hasOwnProperty(stat.status)) {
          formattedStats.byStatus[stat.status] = parseInt(stat.count) || 0;
        }
        if (stat.type && formattedStats.byType.hasOwnProperty(stat.type)) {
          formattedStats.byType[stat.type] = parseInt(stat.count) || 0;
        }
        if (stat.priority && formattedStats.byPriority.hasOwnProperty(stat.priority)) {
          formattedStats.byPriority[stat.priority] = parseInt(stat.count) || 0;
        }
      });

      res.json({
        success: true,
        stats: formattedStats
      });

    } catch (error) {
      console.error('Get feedback stats error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback statistics'
      });
    }
  }),

  // Update feedback status (Admin only)
  updateFeedbackStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['pending', 'reviewed', 'in_progress', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    try {
      const feedback = await Feedback.updateStatus(id, status, adminNotes);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.json({
        success: true,
        message: 'Feedback status updated successfully',
        feedback
      });

    } catch (error) {
      console.error('Update feedback status error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to update feedback status'
      });
    }
  }),

  // Reward user for feedback (Admin only)
  rewardUser: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { zpReward = 0, sebReward = 0, adminNotes } = req.body;

    if (zpReward < 0 || sebReward < 0) {
      return res.status(400).json({
        success: false,
        message: 'Rewards cannot be negative'
      });
    }

    if (zpReward === 0 && sebReward === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one reward must be provided'
      });
    }

    try {
      const feedback = await Feedback.rewardUser(id, {
        zpReward: parseInt(zpReward),
        sebReward: parseInt(sebReward),
        adminNotes
      });

      res.json({
        success: true,
        message: 'User rewarded successfully',
        feedback
      });

    } catch (error) {
      console.error('Reward user error:', error.message);

      if (error.message === 'Feedback not found') {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to reward user'
      });
    }
  }),

  // Get single feedback details
  getFeedbackDetails: asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const feedback = await Feedback.findById(id);

      if (!feedback) {
        return res.status(404).json({
          success: false,
          message: 'Feedback not found'
        });
      }

      if (feedback.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        feedback
      });

    } catch (error) {
      console.error('Get feedback details error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch feedback details'
      });
    }
  })
};

module.exports = feedbackController;