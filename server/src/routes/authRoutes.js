const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

const {
  getDashboardSummary,
  getAllTasks,
  createTask,
  updateTask,
  getAppSettings,
  updateAppSetting,
  rewardUser,
  searchUsers, // <-- NEW
} = require('../controllers/adminController');

// --- Dashboard Routes ---
router.get('/summary', protect, admin, getDashboardSummary);

// --- Task Management Routes ---
router.route('/tasks').get(protect, admin, getAllTasks).post(protect, admin, createTask);
router.route('/tasks/:id').put(protect, admin, updateTask);

// --- App Settings Routes ---
router.route('/settings').get(protect, admin, getAppSettings).put(protect, admin, updateAppSetting);

// --- User Management Routes ---
router.post('/users/reward', protect, admin, rewardUser);
router.get('/users/search', protect, admin, searchUsers); // <-- NEW ROUTE

module.exports = router;