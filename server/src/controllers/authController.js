const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sendReferralNotification } = require('./telegramController');
const { OAuth2Client } = require('google-auth-library');
const TwoFactorUtils = require('../utils/twoFactor');

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
const generateToken = (user, options = {}) => {
  const payload = { 
    id: user.id,
    role: user.role
  };

  // Add 2FA status if provided
  if (options.twoFactorPending) {
    payload.twoFactorPending = true;
  }

  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: options.twoFactorPending ? '15m' : '30d' // Short expiry for 2FA pending tokens
  });
};

// Generate temporary token for 2FA verification
const generate2FAToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      twoFactorPending: true,
      temp: true
    }, 
    process.env.JWT_SECRET, 
    { expiresIn: '15m' } // 15 minutes for 2FA verification
  );
};

// Google OAuth Callback Handler
const googleCallback = asyncHandler(async (req, res) => {
  try {
    // 1. Get the temporary code from the query string
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=No authorization code provided`);
    }

    // 2. Exchange the code for access and ID tokens
    const { tokens } = await googleClient.getToken({
      code: code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.BACKEND_URL}/api/auth/google/callback`
    });

    googleClient.setCredentials(tokens);

    // 3. Get user profile info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Check if user exists with this Google ID
      let userResult = await client.query(
        'SELECT * FROM users WHERE google_id = $1 OR email = $2',
        [googleId, email]
      );

      let user = userResult.rows[0];

      if (!user) {
        // Create new user with Google OAuth
        const newReferralCode = generateReferralCode();
        const username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 5);

        const newUserQuery = `
          INSERT INTO users (username, email, google_id, auth_provider, avatar_url, referral_code, zp_balance) 
          VALUES ($1, $2, $3, $4, $5, $6, 100) 
          RETURNING id, username, email, created_at, role, zp_balance, social_capital_score, avatar_url, auth_provider, two_factor_enabled
        `;

        const newUserResult = await client.query(newUserQuery, [
          username, email, googleId, 'google', picture, newReferralCode
        ]);

        user = newUserResult.rows[0];
      } else if (user && !user.google_id) {
        // Link existing user with Google account
        await client.query(
          'UPDATE users SET google_id = $1, auth_provider = $2, avatar_url = $3 WHERE id = $4',
          [googleId, 'google', picture, user.id]
        );
      }

      // Check if 2FA is enabled
      if (user.two_factor_enabled) {
        // Generate temporary token for 2FA verification
        const tempToken = generate2FAToken(user);
        
        await client.query('COMMIT');
        
        // Redirect to frontend with temp token for 2FA
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/2fa?token=${tempToken}&isNewUser=${!userResult.rows[0]}`);
      }

      // Generate full JWT token (no 2FA required)
      const token = generateToken(user);

      await client.query('COMMIT');

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/success?token=${token}&isNewUser=${!userResult.rows[0]}`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
  }
});

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

// COMPLETELY REWRITTEN: Google OAuth Authentication with proper user lookup
const googleAuth = asyncHandler(async (req, res) => {
  const { token: googleToken, referralCode } = req.body;

  if (!googleToken) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  console.log('Received Google token for authentication');

  const client = await db.getClient();
  try {
    // Check if it's an access token (starts with 'ya29.') or ID token
    const isAccessToken = googleToken.startsWith('ya29.');

    let payload;

    if (isAccessToken) {
      console.log('Processing Google access token');
      // For access tokens, we need to get user info from Google API
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          'Authorization': `Bearer ${googleToken}`
        }
      });

      if (!userInfoResponse.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await userInfoResponse.json();

      // Create a payload similar to what verifyIdToken would return
      payload = {
        sub: userInfo.sub, // Google ID
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        email_verified: userInfo.email_verified
      };

      console.log('User info from access token:', payload.email);

    } else {
      console.log('Processing Google ID token');
      // For ID tokens, verify normally
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      console.log('User info from ID token:', payload.email);
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      throw new Error('No email found in Google token');
    }

    await client.query('BEGIN');

    // STEP 1: First check if user exists with this Google ID
    console.log('Checking for user with Google ID:', googleId);
    let userResult = await client.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user = userResult.rows[0];
    let isNewUser = false;

    if (user) {
      console.log('Found existing user by Google ID:', user.email);
      // User exists with this Google ID - normal login
    } else {
      // STEP 2: Check if user exists with this email (but different auth method)
      console.log('No user found with Google ID, checking by email:', email);
      userResult = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      user = userResult.rows[0];

      if (user) {
        console.log('Found existing user by email:', user.email);
        // User exists with this email but different auth method - link Google account
        console.log('Linking Google account to existing user');
        await client.query(
          'UPDATE users SET google_id = $1, auth_provider = $2, avatar_url = $3 WHERE id = $4',
          [googleId, 'google', picture, user.id]
        );
        // Refresh user data
        userResult = await client.query('SELECT * FROM users WHERE id = $1', [user.id]);
        user = userResult.rows[0];
      } else {
        // STEP 3: No user found - create new user
        console.log('No existing user found, creating new user with email:', email);
        isNewUser = true;
        const newReferralCode = generateReferralCode();

        // Generate username from name or email
        let username;
        if (name) {
          username = name.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substr(2, 5);
        } else {
          username = email.split('@')[0] + '_' + Math.random().toString(36).substr(2, 5);
        }

        const newUserQuery = `
          INSERT INTO users (username, email, google_id, auth_provider, avatar_url, referral_code, zp_balance) 
          VALUES ($1, $2, $3, $4, $5, $6, 100) 
          RETURNING id, username, email, created_at, role, zp_balance, social_capital_score, avatar_url, auth_provider, two_factor_enabled
        `;

        const newUserResult = await client.query(newUserQuery, [
          username, email, googleId, 'google', picture, newReferralCode
        ]);

        user = newUserResult.rows[0];
        console.log('Created new user with ID:', user.id);

        // Apply referral logic only for new users
        if (referralCode) {
          console.log('Applying referral code for new user:', referralCode);
          const referrerInfo = await applyReferral(client, referralCode, user.id);
          if (referrerInfo) {
            console.log(`Referral applied: ${referrerInfo.username} -> ${username}`);
            try {
              await sendReferralNotification(referrerInfo.id, username);
            } catch (notificationError) {
              console.error('Error sending Telegram referral notification:', notificationError);
            }
          }
        }

        // Clean up pending referrals
        await client.query(
          'DELETE FROM pending_referrals WHERE referral_code = $1',
          [referralCode]
        );
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
      auth_provider: user.auth_provider,
      two_factor_enabled: user.two_factor_enabled
    };

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      console.log('2FA is enabled for user, generating temporary token');
      const tempToken = generate2FAToken(user);
      
      await client.query('COMMIT');

      return res.json({
        user: userResponseData,
        token: tempToken,
        appSettings,
        isNewUser: isNewUser,
        twoFactorRequired: true,
        message: 'Two-factor authentication required'
      });
    }

    // No 2FA required - generate full token
    const token = generateToken(user);

    await client.query('COMMIT');

    console.log(`Google OAuth successful: ${isNewUser ? 'NEW USER' : 'EXISTING USER'} - ${user.email}`);

    res.json({
      user: userResponseData,
      token: token,
      appSettings,
      isNewUser: isNewUser,
      twoFactorRequired: false
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Google OAuth error:', error);

    if (error.message.includes('Token used too late')) {
      return res.status(401).json({ message: 'Google token has expired' });
    }

    res.status(400).json({ 
      message: 'Google authentication failed',
      details: error.message 
    });
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
      RETURNING id, username, email, created_at, role, zp_balance, social_capital_score, two_factor_enabled
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
      auth_provider: 'email',
      two_factor_enabled: user.two_factor_enabled
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

// --- UPDATED: Controller for User Login with 2FA Support ---
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
        auth_provider: user.auth_provider,
        two_factor_enabled: user.two_factor_enabled
      };

      // Check if 2FA is enabled
      if (user.two_factor_enabled) {
        console.log('2FA is enabled for user, generating temporary token');
        const tempToken = generate2FAToken(user);

        return res.json({
          user: userResponseData,
          token: tempToken,
          appSettings,
          twoFactorRequired: true,
          message: 'Two-factor authentication required'
        });
      }

      // No 2FA required - generate full token
      const token = generateToken(user);

      res.json({
        user: userResponseData,
        token: token,
        appSettings,
        twoFactorRequired: false
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

// --- NEW: Verify 2FA Code and Complete Login ---
const verify2FALogin = asyncHandler(async (req, res) => {
  const { token: tempToken, verificationCode } = req.body;

  if (!tempToken || !verificationCode) {
    return res.status(400).json({ 
      success: false,
      message: 'Token and verification code are required' 
    });
  }

  try {
    // Verify the temporary token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    
    if (!decoded.twoFactorPending) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token for 2FA verification'
      });
    }

    const userId = decoded.id;

    // Get user's 2FA secret
    const userResult = await db.query(
      'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    if (!user.two_factor_enabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled for this user'
      });
    }

    if (!user.two_factor_secret) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication not properly configured'
      });
    }

    // Verify the 2FA code
    const isValid = TwoFactorUtils.verifyToken(user.two_factor_secret, verificationCode);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Get complete user data
    const fullUserResult = await db.query(
      `SELECT 
        id, username, email, role, zp_balance, social_capital_score,
        mining_session_start_time, last_claim_time, daily_streak_count,
        referral_code, referred_by, avatar_url, auth_provider
       FROM users WHERE id = $1`,
      [userId]
    );

    const fullUser = fullUserResult.rows[0];

    // Get app settings
    const settingsResult = await db.query('SELECT * FROM app_settings');
    const appSettings = settingsResult.rows.reduce((acc, setting) => {
      acc[setting.setting_key] = setting.setting_value;
      return acc;
    }, {});

    // Generate full access token
    const accessToken = generateToken(fullUser);

    res.json({
      success: true,
      user: fullUser,
      token: accessToken,
      appSettings,
      message: 'Two-factor authentication successful'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Verification session expired. Please login again.'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error during 2FA verification'
    });
  }
});

module.exports = {
  registerUser,
  loginUser,
  googleAuth,
  googleCallback,
  getReferrerInfo,
  createPendingReferral,
  verify2FALogin
};