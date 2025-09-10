const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get all available tasks for the logged-in user
// @route   GET /api/tasks
const getAvailableTasks = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // This SQL query is special. It gets all active tasks and uses a LEFT JOIN
  // to check against the user_completed_tasks table.
  // The result is a new 'is_completed' field for each task, which is true or false.
  const query = `
    SELECT
      t.id, t.title, t.description, t.zp_reward, t.seb_reward, t.link_url,
      CASE WHEN uct.user_id IS NOT NULL THEN true ELSE false END AS is_completed
    FROM tasks t
    LEFT JOIN user_completed_tasks uct ON t.id = uct.task_id AND uct.user_id = $1
    WHERE t.is_active = true
    ORDER BY t.created_at DESC;
  `;

  const { rows } = await db.query(query, [userId]);
  res.json(rows);
});

// @desc    Mark a task as complete for the logged-in user
// @route   POST /api/tasks/:id/complete
const completeTask = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id: taskId } = req.params;

  // A database transaction is like a "safe mode" for making multiple database changes.
  // If any step fails, all previous steps in the transaction are automatically undone.
  const client = await db.getClient(); // Get a client from the pool for the transaction
  try {
    await client.query('BEGIN'); // Start the transaction

    // 1. Check if the user has already completed this task
    const completedCheck = await client.query(
      'SELECT * FROM user_completed_tasks WHERE user_id = $1 AND task_id = $2',
      [userId, taskId]
    );
    if (completedCheck.rows.length > 0) {
      throw new Error('Task already completed');
    }

    // 2. Get the task's reward values
    const taskResult = await client.query('SELECT zp_reward, seb_reward FROM tasks WHERE id = $1 AND is_active = true', [taskId]);
    if (taskResult.rows.length === 0) {
      throw new Error('Task not found or is not active');
    }
    const task = taskResult.rows[0];

    // 3. Insert a record into the completion table
    await client.query(
      'INSERT INTO user_completed_tasks (user_id, task_id) VALUES ($1, $2)',
      [userId, taskId]
    );

    // 4. Update the task's completion count
    await client.query(
      'UPDATE tasks SET completion_count = completion_count + 1 WHERE id = $1',
      [taskId]
    );

    // 5. Reward the user by updating their balances
    const userUpdateQuery = `
      UPDATE users
      SET 
        zp_balance = zp_balance + $1,
        social_capital_score = social_capital_score + $2
      WHERE id = $3
      RETURNING id, username, email, zp_balance, social_capital_score, role, mining_session_start_time, last_claim_time, daily_streak_count;
    `;
    const updatedUserResult = await client.query(userUpdateQuery, [task.zp_reward, task.seb_reward, userId]);

    await client.query('COMMIT'); // If all steps succeeded, save the changes

    res.json({
      message: 'Task completed successfully!',
      user: updatedUserResult.rows[0],
    });

  } catch (error) {
    await client.query('ROLLBACK'); // If any step failed, undo all changes
    res.status(400); // Send a "Bad Request" status
    throw new Error(error.message);
  } finally {
    client.release(); // Release the client back to the pool
  }
});

module.exports = {
  getAvailableTasks,
  completeTask,
};