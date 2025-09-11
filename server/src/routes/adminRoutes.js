const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const {
  getDashboardSummary,
  searchUsers, // Make sure this is imported
  getAllTasks,
  createTask,
  updateTask,
  getAppSettings,
  updateAppSetting,
  rewardUser,
} = require('../controllers/adminController');

// --- Dashboard Routes ---
router.get('/summary', protect, admin, getDashboardSummary);

// --- User Management Routes ---
router.get('/users/search', protect, admin, searchUsers); // Add this route
router.post('/users/reward', protect, admin, rewardUser);

// --- Task Management Routes ---
router.route('/tasks')
  .get(protect, admin, getAllTasks)
  .post(protect, admin, createTask);

router.route('/tasks/:id')
  .put(protect, admin, updateTask);

// --- App Settings Routes ---
router.route('/settings')
  .get(protect, admin, getAppSettings)
  .put(protect, admin, updateAppSetting);

module.exports = router;