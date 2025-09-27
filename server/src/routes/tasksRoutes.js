const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAvailableTasks,
  completeTask,
  getTaskStats,
  getUserStats,
  getTaskProgress
} = require('../controllers/tasksController');

// @route   GET /api/tasks
// @desc    Get all available tasks for the logged-in user with progress
// @access  Private
router.get('/', protect, getAvailableTasks);

// @route   POST /api/tasks/:id/complete
// @desc    Mark a task as complete for the logged-in user
// @access  Private
router.post('/:id/complete', protect, completeTask);

// @route   GET /api/tasks/stats
// @desc    Get user's task completion statistics
// @access  Private
router.get('/stats', protect, getTaskStats);

// @route   GET /api/tasks/user-stats
// @desc    Get user's statistics for task progress
// @access  Private
router.get('/user-stats', protect, getUserStats);

// @route   GET /api/tasks/:id/progress
// @desc    Get detailed progress for a specific task
// @access  Private
router.get('/:id/progress', protect, getTaskProgress);

module.exports = router;