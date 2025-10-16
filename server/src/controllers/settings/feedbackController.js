const Feedback = require('../../models/Feedback');
const UploadHandler = require('../../utils/uploadHandler');
const { uploadToS3, deleteFromS3 } = require('../../utils/s3Upload');
const Transaction = require('../../models/Transaction'); // ADD THIS IMPORT
const db = require('../../config/db'); // ADD THIS IMPORT

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
  console.log('🟢 ===== FEEDBACK SUBMISSION STARTED =====');
  console.log('📨 Request details:', {
    method: req.method,
    url: req.url,
    headers: {
      contentType: req.headers['content-type'],
      authorization: req.headers.authorization ? 'Present' : 'Missing',
      contentLength: req.headers['content-length']
    },
    user: req.user ? `User ID: ${req.user.id}` : 'No user'
  });

  let uploadedAttachments = [];

  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ success: false, message: 'Unauthorized: Please log in first.' });
    }

    console.log('👤 User ID:', userId);

    // Parse form data
    let fields, files;
    try {
      console.log('🔄 Starting form data parsing with UploadHandler...');
      const result = await UploadHandler.parseFormData(req, res);
      fields = result.fields;
      files = result.files;
      console.log('✅ Form parsing completed successfully');
      console.log('📊 Parsed data:', {
        fields: Object.keys(fields),
        filesCount: files.length,
        fieldValues: {
          title: fields.title ? `${fields.title.substring(0, 50)}...` : 'Missing',
          type: fields.type || 'Not provided',
          priority: fields.priority || 'Not provided'
        }
      });
    } catch (parseError) {
      console.error('❌ Form parsing failed:', parseError.message);
      console.error('❌ Parse error stack:', parseError.stack);
      return res.status(400).json({ success: false, message: 'Invalid form data: ' + parseError.message });
    }

    const { title, message, type = 'suggestion', priority = 'medium' } = fields;

    // Validate input
    console.log('🔍 Validating input data...');
    const validationErrors = UploadHandler.validateFeedbackData({ title, message, type, priority });
    if (validationErrors.length > 0) {
      console.warn('❌ Validation errors:', validationErrors);
      return res.status(400).json({ success: false, message: validationErrors.join(', ') });
    }
    console.log('✅ Input validation passed');

    // Handle file uploads
    if (files.length > 0) {
      console.log(`📎 Processing ${files.length} attachment(s)...`);
      try {
        uploadedAttachments = await Promise.all(
          files.map(async (file, index) => {
            console.log(`📤 [${index + 1}/${files.length}] Uploading: ${file.originalname} (${file.size} bytes)`);
            const uploaded = await uploadToS3(file);
            console.log(`✅ Uploaded: ${file.originalname} → ${uploaded.url}`);
            return {
              filename: file.originalname,
              key: uploaded.key,
              url: uploaded.url,
              size: file.size,
              mimetype: file.mimetype
            };
          })
        );
        console.log('✅ All attachments uploaded successfully');
      } catch (uploadError) {
        console.error('❌ File upload error:', uploadError.message);
        console.error('❌ Upload error stack:', uploadError.stack);
        await cleanupAttachments(uploadedAttachments);
        return res.status(500).json({ success: false, message: 'Failed to upload attachments.' });
      }
    } else {
      console.log('📁 No attachments to upload');
    }

    // Save to database
    console.log('💾 Saving feedback to database...');
    try {
      const feedback = await Feedback.create({
        userId,
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        attachments: uploadedAttachments
      });

      console.log('✅ Feedback saved successfully with ID:', feedback.id);
      console.log('📋 Saved feedback:', {
        id: feedback.id,
        title: feedback.title,
        type: feedback.type,
        priority: feedback.priority,
        status: feedback.status,
        attachmentsCount: feedback.attachments?.length || 0
      });

      // Send success response
      console.log('📤 Sending success response...');
      const response = {
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
      };
      
      console.log('📄 Response payload:', JSON.stringify(response, null, 2));
      return res.status(201).json(response);

    } catch (dbError) {
      console.error('❌ Database save error:', dbError.message);
      console.error('❌ Database error stack:', dbError.stack);
      throw dbError;
    }

  } catch (error) {
    console.error('💥 Critical error in submitFeedback:', error.message);
    console.error('💥 Error stack:', error.stack);
    
    if (uploadedAttachments.length > 0) {
      console.log('🧹 Cleaning up uploaded files due to error...');
      await cleanupAttachments(uploadedAttachments);
    }

    const errorResponse = {
      success: false,
      message: 'Internal server error.'
    };
    
    console.log('📄 Error response:', JSON.stringify(errorResponse, null, 2));
    return res.status(500).json(errorResponse);
  } finally {
    console.log('🔚 ===== FEEDBACK SUBMISSION COMPLETED =====\n');
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

// Reward user - UPDATED WITH TRANSACTION RECORDING
const rewardUser = async (req, res) => {
  const client = await db.getClient(); // ADD TRANSACTION SUPPORT
  
  try {
    await client.query('BEGIN'); // START TRANSACTION

    const { id } = req.params;
    const { zpReward = 0, sebReward = 0, adminNotes } = req.body;

    if (zpReward < 0 || sebReward < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Rewards cannot be negative.' });
    }
    if (zpReward === 0 && sebReward === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'At least one reward is required.' });
    }

    // Get feedback details first
    const feedbackResult = await client.query(
      'SELECT * FROM feedback WHERE id = $1',
      [id]
    );

    if (feedbackResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }

    const feedback = feedbackResult.rows[0];

    // Update user balances
    if (zpReward > 0) {
      await client.query(
        'UPDATE users SET zp_balance = zp_balance + $1 WHERE id = $2',
        [zpReward, feedback.user_id]
      );
    }

    if (sebReward > 0) {
      await client.query(
        'UPDATE users SET social_capital_score = social_capital_score + $1 WHERE id = $2',
        [sebReward, feedback.user_id]
      );
    }

    // Update feedback status and rewards
    const updateQuery = `
      UPDATE feedback 
      SET status = 'rewarded', 
          zp_reward = $1, 
          seb_reward = $2, 
          admin_notes = $3,
          rewarded_at = NOW(),
          updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;

    const updateResult = await client.query(updateQuery, [
      zpReward, 
      sebReward, 
      adminNotes, 
      id
    ]);

    const updatedFeedback = updateResult.rows[0];

    // ✅ RECORD TRANSACTIONS FOR REWARDS
    if (zpReward > 0) {
      await Transaction.createWithClient(client, {
        userId: feedback.user_id,
        type: 'feedback_reward',
        amount: zpReward,
        currency: 'ZP',
        description: `Feedback reward: ${feedback.title}`,
        referenceId: feedback.id,
        referenceType: 'feedback',
        metadata: {
          feedbackTitle: feedback.title,
          feedbackType: feedback.type,
          adminNotes: adminNotes || ''
        }
      });
    }

    if (sebReward > 0) {
      await Transaction.createWithClient(client, {
        userId: feedback.user_id,
        type: 'feedback_reward',
        amount: sebReward,
        currency: 'SEB',
        description: `Feedback reward: ${feedback.title}`,
        referenceId: feedback.id,
        referenceType: 'feedback',
        metadata: {
          feedbackTitle: feedback.title,
          feedbackType: feedback.type,
          adminNotes: adminNotes || ''
        }
      });
    }

    await client.query('COMMIT'); // COMMIT TRANSACTION

    console.log(`✅ User ${feedback.user_id} rewarded for feedback ${id}: ${zpReward} ZP + ${sebReward} SEB`);

    return res.json({ 
      success: true, 
      message: 'User rewarded successfully.', 
      feedback: updatedFeedback 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ rewardUser error:', error.message);
    const message = error.message === 'Feedback not found' ? 'Feedback not found.' : 'Failed to reward user.';
    return res.status(error.message === 'Feedback not found' ? 404 : 500).json({ 
      success: false, 
      message 
    });
  } finally {
    client.release();
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