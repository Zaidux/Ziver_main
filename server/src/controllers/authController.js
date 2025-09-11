const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Note: This file doesn't seem to be used, but it's good to keep it for now.
const db = require('../config/db');

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const client = await db.getClient();

  try {
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const settingsResult = await client.query('SELECT * FROM app_settings');
      const appSettings = settingsResult.rows.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      // CRUCIAL: Add a new object that explicitly includes the user data you need.
      // This is a more reliable way to ensure the client receives the 'role'
      const userResponseData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role, // <-- We are now explicitly including the role here
        // Include any other user fields you want the client to have
        // e.g., zp_balance, social_capital_score, etc.
        // It's a good practice to not send all fields from the database, but only what's necessary
      };
      
      // Delete the password hash from the response to the client
      delete user.password_hash;
      
      // Send the cleaned user object in the response
      res.json({
        user: userResponseData,
        token: generateToken(user.id),
        appSettings,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } finally {
    client.release();
  }
});
