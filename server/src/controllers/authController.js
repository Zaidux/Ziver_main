const asyncHandler = require('express-async-handler');
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

// Helper function to generate a JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      role: user.role
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '30d' }
  );
};

// Helper function to apply referral (ADD THIS FUNCTION)
const applyReferral = async (client, referralCode, userId) => {
  if (!referralCode) return null;
  
  const referrerResult = await client.query(
    'SELECT id, referral_count FROM users WHERE referral_code = $1', 
    [referralCode]
  );
  
  if (referrerResult.rows.length === 0) {
    return null;
  }
  
  const referrer = referrerResult.rows[0];
  
  // Apply referral bonus to referrer
  await client.query(
    'UPDATE users SET zp_balance = zp_balance + 50, referral_count = referral_count + 1 WHERE id = $1',
    [referrer.id]
  );
  
  // Apply referral bonus to new user
  await client.query(
    'UPDATE users SET zp_balance = zp_balance + 100, referred_by = $1 WHERE id = $2',
    [referrer.id, userId]
  );
  
  return referrer.id;
};

// --- Controller for User Registration ---
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, referralCode, telegramId } = req.body;

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

    // Check for Telegram referral if telegramId is provided
    let finalReferralCode = referralCode;
    if (telegramId && !finalReferralCode) {
      const telegramReferralResult = await client.query(
        'SELECT referral_code FROM telegram_referrals WHERE telegram_id = $1',
        [telegramId]
      );
      
      if (telegramReferralResult.rows.length > 0) {
        finalReferralCode = telegramReferralResult.rows[0].referral_code;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = generateReferralCode();

    const newUserQuery = `
      INSERT INTO users (username, email, password_hash, referral_code) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, username, email, created_at, role
    `;
    const newUserResult = await client.query(newUserQuery, [username, email, hashedPassword, newReferralCode]);
    const user = newUserResult.rows[0];

    // Apply referral if provided
    let referrerId = null;
    if (finalReferralCode) {
      referrerId = await applyReferral(client, finalReferralCode, user.id);
    }

    // Link Telegram account if telegramId is provided
    if (telegramId) {
      await client.query(
        'INSERT INTO telegram_user_map (telegram_id, user_id) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING',
        [telegramId, user.id]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user),
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
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
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  } finally {
    client.release();
  }
});

module.exports = {
  registerUser,
  loginUser,
};