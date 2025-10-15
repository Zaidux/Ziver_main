const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const TaskValidation = require('../models/TaskValidation');
const TaskValidators = require('../utils/taskValidators');
const TelegramUtils = require('../utils/telegramUtils');
const Transaction = require('../models/Transaction');

// @desc    Get all available tasks for the logged-in user with progress
// @route   GET /api/tasks
const getAvailableTasks = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const query = `
    SELECT
      t.id, t.title, t.description, t.zp_reward, t.seb_reward, t.link_url,
      t.task_type, t.verification_required, t.completion_count,
      CASE WHEN uct.user_id IS NOT NULL THEN true ELSE false END AS is_completed
    FROM tasks t
    LEFT JOIN user_completed_tasks uct ON t.id = uct.task_id AND uct.user_id = $1
    WHERE t.is_active = true
    ORDER BY 
      is_completed ASC,
      t.task_type DESC,
      t.created_at DESC;
  `;

  try {
    const { rows: tasks } = await db.query(query, [userId]);

    // Get progress for each task
    const tasksWithProgress = await Promise.all(
      tasks.map(async (task) => {
        if (task.is_completed || task.task_type === 'link') {
          return {
            ...task,
            progress: null, // No progress for completed or link tasks
            canComplete: !task.is_completed
          };
        }

        // For in-app tasks, get completion progress
        const progress = await TaskValidation.getUserTaskProgress(userId, task.id);
        return {
          ...task,
          progress,
          canComplete: progress.canComplete && !task.is_completed
        };
      })
    );

    console.log(`Found ${tasks.length} tasks for user ${userId}`);
    res.json(tasksWithProgress);
  } catch (error) {
    console.error('Database error in getAvailableTasks:', error);
    res.status(500).json({ 
      message: 'Error fetching tasks',
      error: error.message 
    });
  }
});

// @desc    Mark a task as complete for the logged-in user
// @route   POST /api/tasks/:id/complete
const completeTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: taskId } = req.params;

  console.log(`User ${userId} attempting to complete task ${taskId}`);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Check if the user has already completed this task
    const completedCheck = await client.query(
      'SELECT * FROM user_completed_tasks WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );

    if (completedCheck.rows.length > 0) {
      throw new Error('Task already completed');
    }

    // 2. Get the task's details
    const taskResult = await client.query(
      'SELECT zp_reward, seb_reward, task_type, link_url, verification_required FROM tasks WHERE id = $1 AND is_active = true', 
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error('Task not found or is not active');
    }

    const task = taskResult.rows[0];
    console.log(`Task found: ${task.zp_reward} ZP, ${task.seb_reward} SEB`);

    // 3. VALIDATION: Check if user can complete this task
    if (task.task_type === 'in_app') {
      const validationResult = await TaskValidation.validateTaskCompletion(userId, taskId);

      if (!validationResult.isValid) {
        throw new Error(`Task requirements not met: ${validationResult.failedRules?.join(', ') || validationResult.message}`);
      }
      console.log('In-app task validation passed');
    } else if (task.task_type === 'link' && task.link_url) {
      console.log(`User ${userId} completing link task: ${task.link_url}`);

      if (task.verification_required) {
        // Use the TelegramUtils for verification (FIXED VERSION)
        const verificationResult = await TelegramUtils.verifyLinkTask(userId, task.link_url);

        if (!verificationResult.verified) {
          throw new Error(`Link verification failed: ${verificationResult.error || 'Please complete the required action first'}`);
        }

        console.log('Link task verification passed:', verificationResult);
      } else {
        console.log('Link task completed without verification (trust-based)');
      }
    }

    // 4. Insert completion record
    await client.query(
      'INSERT INTO user_completed_tasks (user_id, task_id) VALUES ($1, $2)',
      [userId, taskId]
    );

    // 5. Update task completion count
    await client.query(
      'UPDATE tasks SET completion_count = completion_count + 1 WHERE id = $1',
      [taskId]
    );

    // 6. Reward the user
    const userUpdateQuery = `
      UPDATE users
      SET 
        zp_balance = zp_balance + $1,
        social_capital_score = social_capital_score + $2
      WHERE id = $3
      RETURNING id, username, email, zp_balance, social_capital_score, role, 
                mining_session_start_time, last_claim_time, daily_streak_count,
                referral_code, referred_by;
    `;

    const updatedUserResult = await client.query(userUpdateQuery, [
      task.zp_reward, 
      task.seb_reward, 
      userId
    ]);

    // ✅ NEW: Create task completion transaction
    await Transaction.create({
      userId: userId,
      type: 'task_reward',
      amount: task.zp_reward,
      currency: 'ZP',
      description: `Task completed: ${task.title}`,
      referenceId: taskId,
      referenceType: 'task',
      metadata: {
        taskTitle: task.title,
        sebPoints: task.seb_reward,
        taskType: task.task_type
      }
    });

    await client.query('COMMIT');

    console.log(`Task ${taskId} completed successfully for user ${userId}`);

    res.json({
      message: 'Task completed successfully!',
      user: updatedUserResult.rows[0],
      rewards: {
        zp: task.zp_reward,
        seb: task.seb_reward
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing task:', error);
    res.status(400).json({ 
      message: error.message 
    });
  } finally {
    client.release();
  }
});

// @desc    Debug endpoint: Get task validation rules for a task
// @route   GET /api/tasks/:id/validation-rules
const getTaskValidationRules = asyncHandler(async (req, res) => {
  const { id: taskId } = req.params;

  try {
    const rules = await TaskValidation.getTaskValidationRules(taskId);

    res.json({
      taskId,
      rulesCount: rules.length,
      rules: rules
    });
  } catch (error) {
    console.error('Error fetching validation rules:', error);
    res.status(500).json({ 
      message: 'Error fetching validation rules',
      error: error.message 
    });
  }
});

// @desc    Debug endpoint: Validate a task for current user
// @route   POST /api/tasks/:id/validate
const validateTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: taskId } = req.params;

  try {
    const validationResult = await TaskValidation.validateTaskCompletion(userId, taskId);

    res.json({
      taskId,
      userId,
      isValid: validationResult.isValid,
      message: validationResult.message,
      failedRules: validationResult.failedRules || [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error validating task:', error);
    res.status(500).json({ 
      message: 'Error validating task',
      error: error.message 
    });
  }
});

// @desc    Debug endpoint: Get system status of task validation
// @route   GET /api/tasks/validation-status
const getValidationSystemStatus = asyncHandler(async (req, res) => {
  try {
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'task_validation_rules'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    // Count rules
    const rulesCount = tableExists ? await db.query('SELECT COUNT(*) as count FROM task_validation_rules') : { rows: [{ count: 0 }] };

    // Count tasks with rules
    const tasksWithRules = tableExists ? await db.query(`
      SELECT COUNT(DISTINCT task_id) as count FROM task_validation_rules WHERE is_active = true
    `) : { rows: [{ count: 0 }] };

    res.json({
      tableExists,
      totalValidationRules: parseInt(rulesCount.rows[0].count),
      tasksWithValidationRules: parseInt(tasksWithRules.rows[0].count),
      systemStatus: tableExists ? 'operational' : 'table_missing',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking validation system status:', error);
    res.status(500).json({ 
      message: 'Error checking validation system status',
      error: error.message 
    });
  }
});

// @desc    Verify link task completion (for external verification)
// @route   POST /api/tasks/:id/verify-link
const verifyLinkTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: taskId } = req.params;

  try {
    // Get task details
    const taskResult = await db.query(
      'SELECT link_url, verification_required FROM tasks WHERE id = $1 AND is_active = true', 
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    const task = taskResult.rows[0];

    if (!task.verification_required) {
      return res.json({ 
        success: true, 
        verified: true,
        message: 'No verification required for this task' 
      });
    }

    // Perform verification
    const verificationResult = await TelegramUtils.verifyLinkTask(userId, task.link_url);

    res.json({
      success: true,
      verified: verificationResult.verified,
      message: verificationResult.verified ? 'Verification successful' : verificationResult.error,
      details: verificationResult
    });

  } catch (error) {
    console.error('Error verifying link task:', error);
    res.status(500).json({ 
      success: false,
      verified: false,
      message: 'Verification failed: ' + error.message 
    });
  }
});

// @desc    Check if user has Telegram connected
// @route   GET /api/tasks/telegram-status
const getTelegramStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const telegramResult = await db.query(
      'SELECT telegram_id FROM telegram_user_map WHERE user_id = $1',
      [userId]
    );

    const hasTelegram = telegramResult.rows.length > 0;

    res.json({
      hasTelegram,
      telegramId: hasTelegram ? telegramResult.rows[0].telegram_id : null
    });

  } catch (error) {
    console.error('Error checking Telegram status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error checking Telegram connection' 
    });
  }
});

// @desc    Get user's task completion statistics
// @route   GET /api/tasks/stats
const getTaskStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_completed,
        COALESCE(SUM(t.zp_reward), 0) as total_zp_earned,
        COALESCE(SUM(t.seb_reward), 0) as total_seb_earned
      FROM user_completed_tasks uct
      JOIN tasks t ON uct.task_id = t.id
      WHERE uct.user_id = $1
    `;

    const { rows } = await db.query(statsQuery, [userId]);
    res.json(rows[0] || { total_completed: 0, total_zp_earned: 0, total_seb_earned: 0 });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ 
      message: 'Error fetching task statistics',
      error: error.message 
    });
  }
});

// @desc    Get user's statistics for task progress
// @route   GET /api/tasks/user-stats
const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const stats = await TaskValidators.getUserStatistics(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      message: 'Error fetching user statistics',
      error: error.message 
    });
  }
});

// @desc    Get task progress details
// @route   GET /api/tasks/:id/progress
const getTaskProgress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: taskId } = req.params;

  try {
    const progress = await TaskValidation.getUserTaskProgress(userId, taskId);
    res.json(progress);
  } catch (error) {
    console.error('Error fetching task progress:', error);
    res.status(500).json({ 
      message: 'Error fetching task progress',
      error: error.message 
    });
  }
});

module.exports = {
  getAvailableTasks,
  completeTask,
  getTaskStats,
  getUserStats,
  getTaskProgress,
  verifyLinkTask,
  getTelegramStatus,
  getTaskValidationRules,
  validateTask,
  getValidationSystemStatus
};