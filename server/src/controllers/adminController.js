const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get dashboard summary data (e.g., total users)
// @route   GET /api/admin/summary
const getDashboardSummary = asyncHandler(async (req, res) => {
  const totalUsersResult = await db.query('SELECT COUNT(*) FROM users');
  const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

  // Note: "Online users" is a more complex feature involving websockets or frequent polling.
  // For now, we'll just return the total user count.
  res.json({
    totalUsers,
  });
});

// @desc    Get all tasks
// @route   GET /api/admin/tasks
const getAllTasks = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at DESC');
  res.json(rows);
});

// @desc    Create a new task
// @route   POST /api/admin/tasks
const createTask = asyncHandler(async (req, res) => {
  const { title, description, zp_reward, seb_reward, link_url, is_active } = req.body;
  if (!title || !zp_reward || !seb_reward) {
    res.status(400);
    throw new Error('Please provide title, ZP reward, and SEB reward');
  }
  const query = `
    INSERT INTO tasks (title, description, zp_reward, seb_reward, link_url, is_active)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const { rows } = await db.query(query, [title, description, zp_reward, seb_reward, link_url, is_active]);
  res.status(201).json(rows[0]);
});

// @desc    Update an existing task
// @route   PUT /api/admin/tasks/:id
const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, zp_reward, seb_reward, link_url, is_active } = req.body;
  const query = `
    UPDATE tasks
    SET title = $1, description = $2, zp_reward = $3, seb_reward = $4, link_url = $5, is_active = $6
    WHERE id = $7
    RETURNING *
  `;
  const { rows } = await db.query(query, [title, description, zp_reward, seb_reward, link_url, is_active, id]);
  if (rows.length === 0) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json(rows[0]);
});

// @desc    Get all app settings
// @route   GET /api/admin/settings
const getAppSettings = asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM app_settings');
  res.json(rows);
});

// @desc    Update an app setting
// @route   PUT /api/admin/settings
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

// @desc    Reward a user with ZP and/or SEB points
// @route   POST /api/admin/users/reward
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
  getAllTasks,
  createTask,
  updateTask,
  getAppSettings,
  updateAppSetting,
  rewardUser,
};