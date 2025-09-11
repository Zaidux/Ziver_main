const asyncHandler = require('express-async-handler'); // ADD THIS IMPORT
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Helper function to generate a unique referral code
const generateReferralCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Helper function to generate a JWT (UPDATED)
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      role: user.role // Include role in token payload
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// --- Controller for User Registration ---
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, referralCode } = req.body;

  if (!email || !password || !username) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN'); // Start transaction

    const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new Error('User with that email already exists');
    }

    let referrerId = null;
    if (referralCode) {
      const referrerResult = await client.query('SELECT id, referral_count FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerResult.rows.length > 0) {
        const referrer = referrerResult.rows[0];
        if (referrer.referral_count < 50) {
          referrerId = referrer.id;
          await client.query(
            'UPDATE users SET zp_balance = zp_balance + 150, referral_count = referral_count + 1 WHERE id = $1',
            [referrerId]
          );
        }
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = generateReferralCode();

    const newUserQuery = `
      INSERT INTO users (username, email, password_hash, referral_code, referred_by) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, username, email, created_at
    `;
    const newUserResult = await client.query(newUserQuery, [username, email, hashedPassword, newReferralCode, referrerId]);
    const user = newUserResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user),
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});

// --- Controller for User Login ---
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

      // Create user response data with role included
      const userResponseData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        zp_balance: user.zp_balance,
        social_capital_score: user.social_capital_score,
        mining_session_start_time: user.mining_session_start_time,
        last_claim_time: user.last_claim_time,
        daily_streak_count: user.daily_streak_count
      };

      res.json({
        user: userResponseData,
        token: generateToken(user),
        appSettings,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    res.status(500);
    throw new Error('Server error during login');
  } finally {
    client.release();
  }
});

module.exports = {
  registerUser,
  loginUser,
};