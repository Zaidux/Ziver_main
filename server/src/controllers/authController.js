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

// Helper function to apply referral with bonus
const applyReferral = async (client, referralCode, userId) => {
  if (!referralCode) return null;

  try {
    // Find the referrer by referral code
    const referrerResult = await client.query(
      `SELECT id, username, referral_count FROM users WHERE referral_code = $1`, 
      [referralCode]
    );

    if (referrerResult.rows.length === 0) {
      return null;
    }

    const referrer = referrerResult.rows[0];

    // Apply referral bonus to referrer (50 ZP)
    await client.query(
      'UPDATE users SET zp_balance = zp_balance + 50, referral_count = referral_count + 1 WHERE id = $1',
      [referrer.id]
    );

    // Apply referral bonus to new user (100 ZP) and set referred_by
    await client.query(
      'UPDATE users SET zp_balance = zp_balance + 100, referred_by = $1 WHERE id = $2',
      [referrer.id, userId]
    );

    // Clean up pending referral
    await client.query(
      'DELETE FROM pending_referrals WHERE referral_code = $1',
      [referralCode]
    );

    return {
      id: referrer.id,
      username: referrer.username
    };

  } catch (error) {
    console.error('Error applying referral:', error);
    return null;
  }
};

// Get referrer info by referral code
const getReferrerInfo = asyncHandler(async (req, res) => {
  const { referralCode } = req.params;

  try {
    // First check pending referrals
    const pendingResult = await db.query(
      `SELECT pr.referrer_username, u.username as actual_username 
       FROM pending_referrals pr 
       LEFT JOIN users u ON pr.referrer_id = u.id 
       WHERE pr.referral_code = $1 AND pr.expires_at > NOW()`,
      [referralCode]
    );

    if (pendingResult.rows.length > 0) {
      const referrer = pendingResult.rows[0];
      return res.json({
        success: true,
        referrerUsername: referrer.actual_username || referrer.referrer_username,
        isValid: true
      });
    }

    // Check if it's a valid user referral code
    const userResult = await db.query(
      'SELECT username FROM users WHERE referral_code = $1',
      [referralCode]
    );

    if (userResult.rows.length > 0) {
      return res.json({
        success: true,
        referrerUsername: userResult.rows[0].username,
        isValid: true
      });
    }

    res.json({
      success: false,
      message: 'Invalid referral code',
      isValid: false
    });

  } catch (error) {
    console.error('Error getting referrer info:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking referral code'
    });
  }
});

// Create pending referral
const createPendingReferral = asyncHandler(async (req, res) => {
  const { referralCode, referrerUsername, telegramId, ipAddress, userAgent } = req.body;

  try {
    // Get referrer ID if user exists
    const referrerResult = await db.query(
      'SELECT id FROM users WHERE referral_code = $1 OR username = $2',
      [referralCode, referrerUsername]
    );

    let referrerId = null;
    if (referrerResult.rows.length > 0) {
      referrerId = referrerResult.rows[0].id;
    }

    // Create pending referral
    await db.query(
      `INSERT INTO pending_referrals 
       (referral_code, referrer_username, referrer_id, telegram_id, ip_address, user_agent) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (referral_code) 
       DO UPDATE SET updated_at = NOW()`,
      [referralCode, referrerUsername, referrerId, telegramId, ipAddress, userAgent]
    );

    res.json({
      success: true,
      message: 'Pending referral created'
    });

  } catch (error) {
    console.error('Error creating pending referral:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pending referral'
    });
  }
});

// --- Controller for User Registration ---
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, referralCode, telegramId, ipAddress } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN'); // Start transaction

    // Check if user already exists
    const userExists = await client.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userExists.rows.length > 0) {
      throw new Error('User with that email or username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = generateReferralCode();

    // Create new user
    const newUserQuery = `
      INSERT INTO users (username, email, password_hash, referral_code) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, username, email, created_at, role, zp_balance
    `;
    const newUserResult = await client.query(newUserQuery, [username, email, hashedPassword, newReferralCode]);
    const user = newUserResult.rows[0];

    // Apply referral if provided
    let referrerInfo = null;
    if (referralCode) {
      referrerInfo = await applyReferral(client, referralCode, user.id);
    }

    // Link Telegram account if telegramId is provided
    if (telegramId) {
      await client.query(
        'INSERT INTO telegram_user_map (telegram_id, user_id) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING',
        [telegramId, user.id]
      );

      // Clean up Telegram referrals
      await client.query(
        'DELETE FROM telegram_referrals WHERE telegram_id = $1',
        [telegramId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      zp_balance: user.zp_balance,
      token: generateToken(user),
      referralApplied: !!referrerInfo,
      referrer: referrerInfo,
      bonusReceived: referrerInfo ? 100 : 0
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

      const userResponseData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        zp_balance: user.zp_balance,
        social_capital_score: user.social_capital_score,
        mining_session_start_time: user.mining_session_start_time,
        last_claim_time: user.last_claim_time,
        daily_streak_count: user.daily_streak_count,
        referral_code: user.referral_code,
        referred_by: user.referred_by
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
  getReferrerInfo,
  createPendingReferral
};