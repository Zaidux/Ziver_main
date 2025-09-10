const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const db = require('../config/db');

// --- Helper function to generate a unique referral code ---
const generateReferralCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- Controller for User Registration --- (no changes needed)
const registerUser = asyncHandler(async (req, res) => {
  // Your existing registration code is correct and does not need to change.
  // ...
});

// --- UPDATED AND FIXED: Controller for User Login ---
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // 1. Borrow a single client from the connection pool
  const client = await db.getClient();
  
  try {
    // 2. Use that client to find the user
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    // 3. Check if user exists and password is correct
    if (user && (await bcrypt.compare(password, user.password_hash))) {
      // 4. Use the SAME client to fetch app settings
      const settingsResult = await client.query('SELECT * FROM app_settings');
      const appSettings = settingsResult.rows.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      delete user.password_hash;
      
      // 5. Send the complete response
      res.json({
        user,
        token: generateToken(user.id),
        appSettings,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } finally {
    // 6. ALWAYS release the client back to the pool when we're done.
    // This is the crucial step that prevents the server from freezing.
    client.release();
  }
});


module.exports = {
  registerUser,
  loginUser,
};