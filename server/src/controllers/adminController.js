const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get dashboard summary data (total and online users) <-- UPDATED
const getDashboardSummary = asyncHandler(async (req, res) => {
  // Get total users
  const totalUsersResult = await db.query('SELECT COUNT(*) FROM users');
  const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);

  // Get online users (active in the last 5 minutes)
  const onlineUsersResult = await db.query(
    "SELECT COUNT(*) FROM users WHERE last_seen > NOW() - INTERVAL '5 minutes'"
  );
  const onlineUsers = parseInt(onlineUsersResult.rows[0].count, 10);

  res.json({
    totalUsers,
    onlineUsers, // <-- ADDED
  });
});

// @desc    Search for users by username or email  <-- NEW FUNCTION
const searchUsers = asyncHandler(async (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    res.status(400);
    throw new Error('Search term is required');
  }
  
  // ILIKE is a case-insensitive search. '%' is a wildcard.
  const query = `
    SELECT id, username, email, zp_balance, social_capital_score, last_seen, role 
    FROM users 
    WHERE username ILIKE $1 OR email ILIKE $1
  `;
  const { rows } = await db.query(query, [`%${searchTerm}%`]);

  res.json(rows);
});

// ... (getAllTasks, createTask, updateTask, getAppSettings, updateAppSetting, rewardUser functions remain the same)
const getAllTasks = asyncHandler(async (req, res) => { /* ... */ });
const createTask = asyncHandler(async (req, res) => { /* ... */ });
const updateTask = asyncHandler(async (req, res) => { /* ... */ });
const getAppSettings = asyncHandler(async (req, res) => { /* ... */ });
const updateAppSetting = asyncHandler(async (req, res) => { /* ... */ });
const rewardUser = asyncHandler(async (req, res) => { /* ... */ });


module.exports = {
  getDashboardSummary,
  searchUsers, // <-- EXPORT THE NEW FUNCTION
  getAllTasks,
  createTask,
  updateTask,
  getAppSettings,
  updateAppSetting,
  rewardUser,
};