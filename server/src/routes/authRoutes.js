const express = require('express');
const router = express.Router();

// Import the controller functions
const { registerUser, loginUser } = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerUser);


// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginUser);


module.exports = router;
