const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendReferralNotification } = require('./telegramController');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

// In your authController.js file
const googleCallback = asyncHandler(async (req, res) => {
  try {
    // 1. Get the temporary code from the query string
    const { code } = req.query;

    // 2. Exchange the code for access and ID tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    // 3. Get user profile info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // 4. Find or create a user in your database using `payload`
    // ... (Your user find/create logic here, similar to the `googleAuth` function we discussed earlier) ...

    // 5. Generate a JWT for your application
    const yourAppToken = generateToken(user);

    // 6. Redirect the user back to your frontend with the token
    // Option A: Redirect to frontend with token in URL (less secure)
    res.redirect(`https://yourfrontend.com/auth/success?token=${yourAppToken}`);

    // Option B: Better - Set a secure, httpOnly cookie and redirect
    // res.cookie('token', yourAppToken, { httpOnly: true, secure: true, sameSite: 'lax' });
    // res.redirect('https://yourfrontend.com/dashboard');

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    // Redirect to frontend with an error message
    res.redirect('https://yourfrontend.com/auth/error?message=Authentication failed');
  }
});


};

// NEW: Smart referral assignment when no referrer is provided
const assignSmartReferrer = async (client) => {
  try {
    // Find users with less than 50 referrals, ordered by ZP balance, SEB points, and streak
    const result = await client.query(
      `SELECT id, username, referral_count, zp_balance, social_capital_score, daily_streak_count 
       FROM users 
       WHERE referral_count < 50 
       ORDER BY zp_balance DESC, social_capital_score DESC, daily_streak_count DESC 
       LIMIT 1`
    );

    if (result.rows.length > 0) {
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        referralCode: await getUserReferralCode(client, result.rows[0].id)
      };
    }
    return null;
  } catch (error) {
    console.error('Error assigning smart referrer:', error);
    return null;
  }
};

// NEW: Get user's referral code
const getUserReferralCode = async (client, userId) => {
  const result = await client.query(
    'SELECT referral_code FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0]?.referral_code;
};

// UPDATED: Enhanced referral application with SEB points
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

    // 🔥 FIXED: Apply proper rewards
    // Referrer gets 150 ZP + 5-10 SEB points
    const sebPointsReward = Math.floor(Math.random() * 6) + 5; // Random between 5-10

    await client.query(
      `UPDATE users 
       SET zp_balance = zp_balance + 150, 
           referral_count = referral_count + 1,
           social_capital_score = social_capital_score + $1
       WHERE id = $2`,
      [sebPointsReward, referrer.id]
    );

    // New user gets 100 ZP and set referred_by
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
      username: referrer.username,
      sebPointsReward: sebPointsReward,
      zpReward: 150
    };

  } catch (error) {
    console.error('Error applying referral:', error);
    return null;
  }
};

// NEW: Google OAuth Authentication
const googleAuth = asyncHandler(async (req, res) => {
  const { token: googleToken, referralCode } = req.body;

  if (!googleToken) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  const client = await db.getClient();
  try {
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    await client.query('BEGIN');

    // Check if user exists with this Google ID
    let userResult = await client.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user = userResult.rows[0];

    if (!user) {
      // Check if user exists with this email but different auth provider
      userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      user = userResult.rows[0];

      if (user) {
        // User exists with email but different auth method - link Google account
        await client.query(
          'UPDATE users SET google_id = $1, auth_provider = $2, avatar_url = $3 WHERE id = $4',
          [googleId, 'google', picture, user.id]
        );
      } else {
        // Create new user with Google OAuth
        const newReferralCode = generateReferralCode();
        const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 5);

        const newUserQuery = `
          INSERT INTO users (username, email, google_id, auth_provider, avatar_url, referral_code, zp_balance) 
          VALUES ($1, $2, $3, $4, $5, $6, 100) 
          RETURNING id, username, email, created_at, role, zp_balance, social_capital_score, avatar_url, auth_provider
        `;
        
        const newUserResult = await client.query(newUserQuery, [
          username, email, googleId, 'google', picture, newReferralCode
        ]);
        
        user = newUserResult.rows[0];

        // 🔥 ENHANCED REFERRAL LOGIC for Google OAuth
        let referrerInfo = null;
        let effectiveReferralCode = referralCode;

        // If still no referral code, assign a smart referrer
        if (!effectiveReferralCode) {
          const smartReferrer = await assignSmartReferrer(client);
          if (smartReferrer) {
            effectiveReferralCode = smartReferrer.referralCode;
            console.log('Assigned smart referrer for Google user:', smartReferrer.username);
          }
        }

        // Apply referral if we have a valid code
        if (effectiveReferralCode) {
          referrerInfo = await applyReferral(client, effectiveReferralCode, user.id);

          if (referrerInfo) {
            console.log(`Google OAuth referral applied: ${referrerInfo.username} -> ${username}`);

            // Send Telegram notification to referrer
            try {
              await sendReferralNotification(referrerInfo.id, username);
              console.log(`Telegram referral notification sent to: ${referrerInfo.username}`);
            } catch (notificationError) {
              console.error('Error sending Telegram referral notification:', notificationError);
            }
          }

          // Clean up pending referrals
          await client.query(
            'DELETE FROM pending_referrals WHERE referral_code = $1',
            [effectiveReferralCode]
          );
        }
      }
    }

    // Get app settings
    const settingsResult = await client.query('SELECT * FROM app_settings');
    const appSettings = settingsResult.rows.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});

    // Prepare user response data
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
      referred_by: user.referred_by,
      avatar_url: user.avatar_url,
      auth_provider: user.auth_provider
    };

    await client.query('COMMIT');

    res.json({
      user: userResponseData,
      token: generateToken(user),
      appSettings,
      isNewUser: !userResult.rows[0] // Indicate if this is a new registration
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Google OAuth error:', error);
    
    if (error.message.includes('Token used too late')) {
      return res.status(401).json({ message: 'Google token has expired' });
    }
    
    res.status(400).json({ message: 'Google authentication failed' });
  } finally {
    client.release();
  }
});

// Get referrer info by referral code - ENHANCED
const getReferrerInfo = asyncHandler(async (req, res) => {
  const { referralCode } = req.params;

  try {
    // First check pending referrals for Telegram users
    const pendingResult = await db.query(
      `SELECT pr.referral_code, pr.referrer_username, u.username as actual_username, u.id as referrer_id
       FROM pending_referrals pr 
       LEFT JOIN users u ON pr.referrer_id = u.id 
       WHERE pr.referral_code = $1`,
      [referralCode]
    );

    if (pendingResult.rows.length > 0) {
      const referrer = pendingResult.rows[0];
      return res.json({
        success: true,
        referrer: {
          id: referrer.referrer_id,
          username: referrer.actual_username || referrer.referrer_username
        },
        isValid: true,
        source: 'pending'
      });
    }

    // Check if it's a valid user referral code
    const userResult = await db.query(
      'SELECT id, username, email, referral_count FROM users WHERE referral_code = $1',
      [referralCode]
    );

    if (userResult.rows.length > 0) {
      const referrer = userResult.rows[0];

      // Check if referrer has reached max referrals (50)
      if (referrer.referral_count >= 50) {
        return res.json({
          success: false,
          message: 'This referrer has reached the maximum number of referrals (50)',
          isValid: false
        });
      }

      return res.json({
        success: true,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          email: referrer.email
        },
        isValid: true,
        source: 'direct'
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

// Create pending referral - ENHANCED
const createPendingReferral = asyncHandler(async (req, res) => {
  const { referralCode, referrerUsername, telegramId, ipAddress, userAgent } = req.body;

  try {
    // Get referrer ID if user exists and check referral count
    const referrerResult = await db.query(
      'SELECT id, referral_count FROM users WHERE referral_code = $1 OR username = $2',
      [referralCode, referrerUsername]
    );

    let referrerId = null;
    let canAcceptReferrals = true;

    if (referrerResult.rows.length > 0) {
      referrerId = referrerResult.rows[0].id;
      // Check if referrer has reached max referrals
      if (referrerResult.rows[0].referral_count >= 50) {
        canAcceptReferrals = false;
      }
    }

    if (!canAcceptReferrals) {
      return res.status(400).json({
        success: false,
        message: 'This referrer has reached the maximum number of referrals (50)'
      });
    }

    // Create pending referral with 24-hour expiry
    await db.query(
      `INSERT INTO pending_referrals 
       (referral_code, referrer_username, referrer_id, telegram_id, ip_address, user_agent, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours')
       ON CONFLICT (referral_code) 
       DO UPDATE SET updated_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'`,
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

// --- UPDATED: Controller for User Registration with Smart Referral ---
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, referralCode, telegramId, ipAddress } = req.body;

  if (!email || !password || !username) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check if user already exists
    const userExists = await client.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (userExists.rows.length > 0) {
      throw new Error('User with that email or username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = generateReferralCode();

    // Create new user with initial 100 ZP
    const newUserQuery = `
      INSERT INTO users (username, email, password_hash, referral_code, zp_balance, auth_provider) 
      VALUES ($1, $2, $3, $4, 100, 'email') 
      RETURNING id, username, email, created_at, role, zp_balance, social_capital_score
    `;
    const newUserResult = await client.query(newUserQuery, [username, email, hashedPassword, newReferralCode]);
    const user = newUserResult.rows[0];

    // 🔥 ENHANCED REFERRAL LOGIC
    let referrerInfo = null;
    let effectiveReferralCode = referralCode;

    // If no direct referral code, check pending referrals (Telegram)
    if (!effectiveReferralCode && telegramId) {
      const pendingRef = await client.query(
        'SELECT referral_code FROM pending_referrals WHERE telegram_id = $1 AND expires_at > NOW()',
        [telegramId]
      );

      if (pendingRef.rows.length > 0) {
        effectiveReferralCode = pendingRef.rows[0].referral_code;
        console.log('Using pending Telegram referral:', effectiveReferralCode);
      }
    }

    // If still no referral code, assign a smart referrer
    if (!effectiveReferralCode) {
      const smartReferrer = await assignSmartReferrer(client);
      if (smartReferrer) {
        effectiveReferralCode = smartReferrer.referralCode;
        console.log('Assigned smart referrer:', smartReferrer.username);
      }
    }

    // Apply referral if we have a valid code
    if (effectiveReferralCode) {
      referrerInfo = await applyReferral(client, effectiveReferralCode, user.id);

      if (referrerInfo) {
        console.log(`Referral applied: ${referrerInfo.username} -> ${username}`);

        // 🔥 NEW: Send Telegram notification to referrer
        try {
          await sendReferralNotification(referrerInfo.id, username);
          console.log(`Telegram referral notification sent to: ${referrerInfo.username}`);
        } catch (notificationError) {
          console.error('Error sending Telegram referral notification:', notificationError);
          // Don't fail registration if notification fails
        }
      } else {
        console.log('Referral code was invalid:', effectiveReferralCode);
      }

      // Clean up pending referrals
      await client.query(
        'DELETE FROM pending_referrals WHERE referral_code = $1 OR telegram_id = $2',
        [effectiveReferralCode, telegramId]
      );
    }

    // Link Telegram account if telegramId is provided
    if (telegramId) {
      await client.query(
        'INSERT INTO telegram_user_map (telegram_id, user_id) VALUES ($1, $2) ON CONFLICT (telegram_id) DO NOTHING',
        [telegramId, user.id]
      );
    }

    await client.query('COMMIT');

    // Prepare response
    const responseData = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      zp_balance: user.zp_balance,
      social_capital_score: user.social_capital_score,
      token: generateToken(user),
      referralApplied: !!referrerInfo,
      referrer: referrerInfo,
      bonusReceived: referrerInfo ? 100 : 0,
      auth_provider: 'email'
    };

    if (referrerInfo) {
      responseData.referrerBonus = {
        zp: referrerInfo.zpReward,
        sebPoints: referrerInfo.sebPointsReward
      };
    }

    res.status(201).json(responseData);

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
        referred_by: user.referred_by,
        avatar_url: user.avatar_url,
        auth_provider: user.auth_provider
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
  googleAuth,
  googleCallback,
  getReferrerInfo,
  createPendingReferral
};