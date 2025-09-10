const jwt = require('jsonwebtoken');
const bcrypt =require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const db = require('../config/db');

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- Controller for User Registration --- (no changes)
const registerUser = asyncHandler(async (req, res) => {
  // ... (Full code for registerUser remains the same)
  const { email, password, username, referralCode } = req.body;
  if (!email || !password || !username) {
    res.status(400); throw new Error('Please provide all required fields');
  }
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) { throw new Error('User with that email already exists'); }
    let referrerId = null;
    if (referralCode) {
      const referrerResult = await client.query('SELECT id, referral_count FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerResult.rows.length > 0) {
        const referrer = referrerResult.rows[0];
        if (referrer.referral_count < 50) {
          referrerId = referrer.id;
          await client.query('UPDATE users SET zp_balance = zp_balance + 150, referral_count = referral_count + 1 WHERE id = $1', [referrerId]);
        }
      }
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = '...'; // Assume generateReferralCode() exists
    const newUserQuery = `INSERT INTO users (username, email, password_hash, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, created_at`;
    const newUserResult = await client.query(newUserQuery, [username, email, hashedPassword, newReferralCode, referrerId]);
    const user = newUserResult.rows[0];
    await client.query('COMMIT');
    res.status(201).json({ id: user.id, username: user.username, email: user.email, token: generateToken(user.id) });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400); throw new Error(error.message);
  } finally {
    client.release();
  }
});


// --- Controller for User Login --- (DIAGNOSTIC VERSION)
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findByEmail(email);

  if (user && (await bcrypt.compare(password, user.password_hash))) {
    
    // --- DIAGNOSTIC STEP: Temporarily removed the settings fetch ---
    // const settingsResult = await db.query('SELECT * FROM app_settings');
    // const appSettings = settingsResult.rows.reduce((acc, setting) => {
    //   acc[setting.setting_key] = setting.setting_value;
    //   return acc;
    // }, {});

    delete user.password_hash;
    
    // Send back the response without the app settings for now
    res.json({
      user,
      token: generateToken(user.id),
      // appSettings, // Temporarily removed for debugging
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