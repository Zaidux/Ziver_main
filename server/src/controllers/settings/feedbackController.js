const Feedback = require('../../models/Feedback');
const UploadHandler = require('../../utils/uploadHandler');
const { uploadToS3, deleteFromS3 } = require('../../utils/fileUpload');

// Cleanup function
async function cleanupAttachments(attachments) {
  if (!attachments || attachments.length === 0) return;
  console.log(`🧹 Cleaning up ${attachments.length} attachment(s)...`);
  for (const attachment of attachments) {
    try {
      await deleteFromS3(attachment.key);
      console.log(`✅ Cleaned up: ${attachment.filename}`);
    } catch (cleanupError) {
      console.error(`❌ Failed to cleanup ${attachment.filename}:`, cleanupError.message);
    }
  }
}

// Submit feedback
const submitFeedback = async (req, res) => {
  console.log('🟢 Feedback submission started...');
  let uploadedAttachments = [];

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in first.' });
    }

    console.log('👤 User ID:', userId);

    // Parse form data
    let fields, files;
    try {
      const result = await UploadHandler.parseFormData(req, res);
      fields = result.fields;
      files = result.files;
    } catch (parseError) {
      console.error('❌ Form parsing failed:', parseError.message);
      return res.status(400).json({ success: false, message: 'Invalid form data: ' + parseError.message });
    }

    const { title, message, type = 'suggestion', priority = 'medium' } = fields;
    console.log('📥 Parsed data:', { title, type, priority, fileCount: files.length });

    // Validate input
    const validationErrors = UploadHandler.validateFeedbackData({ title, message, type, priority });
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, message: validationErrors.join(', ') });
    }

    // Handle file uploads
    if (files.length > 0) {
      try {
        uploadedAttachments = await Promise.all(
          files.map(async (file) => {
            const uploaded = await uploadToS3(file);
            return {
              filename: file.originalname,
              key: uploaded.key,
              url: uploaded.url,
              size: file.size,
              mimetype: file.mimetype
            };
          })
        );
      } catch (uploadError) {
        await cleanupAttachments(uploadedAttachments);
        return res.status(500).json({ success: false, message: 'Failed to upload attachments.' });
      }
    }

    // Save to database
    const feedback = await Feedback.create({
      userId,
      title: title.trim(),
      message: message.trim(),
      type,
      priority,
      attachments: uploadedAttachments
    });

    console.log('✅ Feedback saved successfully with ID:', feedback.id);

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully!',
      feedback: {
        id: feedback.id,
        title: feedback.title,
        type: feedback.type,
        priority: feedback.priority,
        status: feedback.status,
        attachments: feedback.attachments?.length || 0,
        createdAt: feedback.created_at
      }
    });

  } catch (error) {
    console.error('💥 Critical error in submitFeedback:', error);
    if (uploadedAttachments.length > 0) {
      await cleanupAttachments(uploadedAttachments);
    }
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Get user feedback
const getUserFeedback = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized access.' });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const result = await Feedback.findByUserId(userId, page, limit);

    return res.json({
      success: true,
      feedback: result.feedback,
      pagination: { currentPage: result.currentPage, totalPages: result.totalPages, totalCount: result.totalCount }
    });
  } catch (error) {
    console.error('❌ getUserFeedback error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch feedback history.' });
  }
};

// Get all feedback for admin
const getAllFeedback = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const { status, type, priority } = req.query;

    const filters = {};
    if (status && status !== 'all') filters.status = status;
    if (type && type !== 'all') filters.type = type;
    if (priority && priority !== 'all') filters.priority = priority;

    const result = await Feedback.findAll(page, limit, filters);

    return res.json({
      success: true,
      feedback: result.feedback,
      pagination: { currentPage: result.currentPage, totalPages: result.totalPages, totalCount: result.totalCount }
    });
  } catch (error) {
    console.error('❌ getAllFeedback error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch feedback list.' });
  }
};

// Get feedback stats
const getFeedbackStats = async (req, res) => {
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
    return res.status(500).json({ success: false, message: 'Failed to load feedback stats.' });
  }
};

// Update feedback status
const updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const validStatuses = ['pending', 'reviewed', 'in_progress', 'resolved', 'rewarded', 'closed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const feedback = await Feedback.updateStatus(id, status, adminNotes);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    return res.json({ success: true, message: 'Feedback status updated successfully.', feedback });
  } catch (error) {
    console.error('❌ updateFeedbackStatus error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update feedback status.' });
  }
};

// Reward user
const rewardUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { zpReward = 0, sebReward = 0, adminNotes } = req.body;

    if (zpReward < 0 || sebReward < 0) {
      return res.status(400).json({ success: false, message: 'Rewards cannot be negative.' });
    }
    if (zpReward === 0 && sebReward === 0) {
      return res.status(400).json({ success: false, message: 'At least one reward is required.' });
    }

    const feedback = await Feedback.rewardUser(id, {
      zpReward: parseInt(zpReward),
      sebReward: parseInt(sebReward),
      adminNotes
    });

    return res.json({ success: true, message: 'User rewarded successfully.', feedback });
  } catch (error) {
    console.error('❌ rewardUser error:', error.message);
    const message = error.message === 'Feedback not found' ? 'Feedback not found.' : 'Failed to reward user.';
    return res.status(error.message === 'Feedback not found' ? 404 : 500).json({ success: false, message });
  }
};

// Get feedback details
const getFeedbackDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    if (feedback.user_id !== userId && userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.json({ success: true, feedback });
  } catch (error) {
    console.error('❌ getFeedbackDetails error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch feedback details.' });
  }
};

// Export all functions
module.exports = {
  submitFeedback,
  getUserFeedback,
  getAllFeedback,
  getFeedbackStats,
  updateFeedbackStatus,
  rewardUser,
  getFeedbackDetails
};