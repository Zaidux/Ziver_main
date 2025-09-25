const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get all available tasks for the logged-in user
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
      t.is_completed ASC,
      t.task_type DESC,
      t.created_at DESC;
  `;

  const { rows } = await db.query(query, [userId]);
  res.json(rows);
});

// @desc    Mark a task as complete for the logged-in user
// @route   POST /api/tasks/:id/complete
const completeTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: taskId } = req.params;

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
      'SELECT zp_reward, seb_reward, task_type, link_url FROM tasks WHERE id = $1 AND is_active = true', 
      [taskId]
    );
    
    if (taskResult.rows.length === 0) {
      throw new Error('Task not found or is not active');
    }
    
    const task = taskResult.rows[0];

    // 3. For link tasks with verification, we might want additional checks
    // This is where you could add Telegram channel join verification, etc.
    if (task.task_type === 'link' && task.link_url) {
      // Additional verification can be added here
      // For example: check if user actually joined Telegram channel
      // This would require integration with Telegram API
      console.log(`User ${userId} completing link task: ${task.link_url}`);
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

    await client.query('COMMIT');

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
    res.status(400);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});

// @desc    Get user's task completion statistics
// @route   GET /api/tasks/stats
const getTaskStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

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
});

module.exports = {
  getAvailableTasks,
  completeTask,
  getTaskStats
};