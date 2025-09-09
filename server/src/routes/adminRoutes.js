const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// We will create these controller functions in the next file.
const {
  getDashboardSummary,
  getAllTasks,
  createTask,
  updateTask,
  getAppSettings,
  updateAppSetting,
  rewardUser,
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

module.exports = router;