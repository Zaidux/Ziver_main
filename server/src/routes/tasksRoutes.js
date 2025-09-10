const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAvailableTasks,
  completeTask,
} = require('../controllers/tasksController');

// @route   GET /api/tasks
// @desc    Get all available tasks for the logged-in user
// @access  Private
router.get('/', protect, getAvailableTasks);

// @route   POST /api/tasks/:id/complete
// @desc    Mark a task as complete for the logged-in user
// @access  Private
router.post('/:id/complete', protect, completeTask);

module.exports = router;