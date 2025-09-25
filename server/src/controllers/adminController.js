const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get dashboard summary data
// @route   GET /api/admin/summary
const getDashboardSummary = asyncHandler(async (req, res) => {
  const totalUsersResult = await db.query('SELECT COUNT(*) FROM users');
  const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

  const onlineUsersResult = await db.query(
    "SELECT COUNT(*) FROM users WHERE last_seen > NOW() - INTERVAL '5 minutes'"
  );
  const onlineUsers = parseInt(onlineUsersResult.rows[0].count, 10);

  const totalTasksResult = await db.query('SELECT COUNT(*) FROM tasks');
  const totalTasks = parseInt(totalTasksResult.rows[0].count, 10);

  const activeTasksResult = await db.query('SELECT COUNT(*) FROM tasks WHERE is_active = true');
  const activeTasks = parseInt(activeTasksResult.rows[0].count, 10);

  res.json({
    totalUsers,
    onlineUsers,
    totalTasks,
    activeTasks
  });
});

// @desc    Search for users by username or email
// @route   GET /api/admin/users/search
const searchUsers = asyncHandler(async (req, res) => {
  const { searchTerm } = req.query;
  if (!searchTerm) {
    return res.json([]);
  }
  
  const query = `
    SELECT id, username, email, zp_balance, social_capital_score, 
           last_seen, role, created_at, referral_count
    FROM users 
    WHERE username ILIKE $1 OR email ILIKE $1
    ORDER BY created_at DESC
    LIMIT 50
  `;
  
  const { rows } = await db.query(query, [`%${searchTerm}%`]);
  res.json(rows);
});

// @desc    Get all tasks with completion stats
// @route   GET /api/admin/tasks
const getAllTasks = asyncHandler(async (req, res) => {
  const query = `
    SELECT t.*, 
           COUNT(uct.user_id) as completion_count,
           (SELECT COUNT(*) FROM users) as total_users,
           ROUND((COUNT(uct.user_id)::decimal / NULLIF((SELECT COUNT(*) FROM users), 0) * 100), 2) as completion_rate
    FROM tasks t
    LEFT JOIN user_completed_tasks uct ON t.id = uct.task_id
    GROUP BY t.id
    ORDER BY t.created_at DESC
  `;
  
  const { rows } = await db.query(query);
  res.json(rows);
});

// @desc    Create a new task
// @route   POST /api/admin/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, zp_reward, seb_reward, link_url, task_type, verification_required, is_active } = req.body;
  
  if (!title || zp_reward === undefined || seb_reward === undefined) {
    res.status(400);
    throw new Error('Please provide title, ZP reward, and SEB reward');
  }

  // Validate task type
  if (task_type && !['in_app', 'link'].includes(task_type)) {
    res.status(400);
    throw new Error('Task type must be either "in_app" or "link"');
  }

  // For link tasks, require URL
  if (task_type === 'link' && !link_url) {
    res.status(400);
    throw new Error('Link tasks require a URL');
  }

  const query = `
    INSERT INTO tasks (title, description, zp_reward, seb_reward, link_url, task_type, verification_required, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  const { rows } = await db.query(query, [
    title, 
    description, 
    zp_reward, 
    seb_reward, 
    link_url || null, 
    task_type || 'in_app',
    verification_required || false,
    is_active !== false
  ]);
  
  res.status(201).json(rows[0]);
});

// @desc    Update an existing task
// @route   PUT /api/admin/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, zp_reward, seb_reward, link_url, task_type, verification_required, is_active } = req.body;
  
  const query = `
    UPDATE tasks
    SET title = $1, description = $2, zp_reward = $3, seb_reward = $4, 
        link_url = $5, task_type = $6, verification_required = $7, is_active = $8,
        updated_at = NOW()
    WHERE id = $9
    RETURNING *
  `;
  
  const { rows } = await db.query(query, [
    title, description, zp_reward, seb_reward, link_url, 
    task_type, verification_required, is_active, id
  ]);
  
  if (rows.length === 0) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  res.json(rows[0]);
});

// @desc    Get task completion analytics
// @route   GET /api/admin/tasks/analytics
const getTaskAnalytics = asyncHandler(async (req, res) => {
  const analyticsQuery = `
    SELECT 
      t.id,
      t.title,
      t.task_type,
      t.is_active,
      COUNT(uct.user_id) as completions,
      (SELECT COUNT(*) FROM users) as total_users,
      ROUND((COUNT(uct.user_id)::decimal / NULLIF((SELECT COUNT(*) FROM users), 0) * 100), 2) as completion_rate,
      SUM(t.zp_reward) as total_zp_rewarded,
      SUM(t.seb_reward) as total_seb_rewarded
    FROM tasks t
    LEFT JOIN user_completed_tasks uct ON t.id = uct.task_id
    GROUP BY t.id
    ORDER BY completions DESC
  `;
  
  const { rows } = await db.query(analyticsQuery);
  res.json(rows);
});

// Existing functions remain the same...
const getAppSettings = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM app_settings ORDER BY id');
  res.json(rows);
});

const updateAppSetting = asyncHandler(async (req, res) => {
  const { setting_key, setting_value } = req.body;
  if (!setting_key || setting_value === undefined) {
    res.status(400);
    throw new Error('Please provide setting_key and setting_value');
  }
  
  const query = `
    UPDATE app_settings
    SET setting_value = $1
    WHERE setting_key = $2
    RETURNING *
  `;
  
  const { rows } = await db.query(query, [setting_value, setting_key]);
  if (rows.length === 0) {
    res.status(404);
    throw new Error(`Setting with key '${setting_key}' not found`);
  }
  
  res.json(rows[0]);
});

const rewardUser = asyncHandler(async (req, res) => {
  const { userId, zpAmount, sebAmount } = req.body;
  if (!userId || (!zpAmount && !sebAmount)) {
    res.status(400);
    throw new Error('Please provide userId and an amount for ZP or SEB');
  }
  
  const query = `
    UPDATE users
    SET 
      zp_balance = zp_balance + $1,
      social_capital_score = social_capital_score + $2
    WHERE id = $3
    RETURNING id, username, email, zp_balance, social_capital_score
  `;
  
  const { rows } = await db.query(query, [zpAmount || 0, sebAmount || 0, userId]);
  if (rows.length === 0) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json({ message: 'User rewarded successfully', user: rows[0] });
});

module.exports = {
  getDashboardSummary,
  searchUsers,
  getAllTasks,
  createTask,
  updateTask,
  getTaskAnalytics,
  getAppSettings,
  updateAppSetting,
  rewardUser,
};