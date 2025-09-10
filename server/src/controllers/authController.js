const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const db = require('../config/db'); // We need this for settings

// Helper function to generate a JWT
const generateToken = (id) => {
  // Keeping this at 30 days as you preferred
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- Controller for User Registration --- (no changes)
const registerUser = asyncHandler(async (req, res) => {
  // ... code is the same
});


// --- Controller for User Login --- (UPDATED)
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (user && (await bcrypt.compare(password, user.password_hash))) {
    // Fetch all app settings from the database
    const settingsResult = await db.query('SELECT * FROM app_settings');
    const appSettings = settingsResult.rows.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});

    delete user.password_hash;
    
    // Send back the user, their token, AND the app settings
    res.json({
      user,
      token: generateToken(user.id),
      appSettings,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

module.exports = {
  registerUser,
  loginUser,
};