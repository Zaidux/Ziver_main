const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const db = require('../config/db');

// --- NEW: Helper function to generate a unique referral code ---
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


// --- UPDATED: Controller for User Registration ---
const registerUser = asyncHandler(async (req, res) => {
  // Now accepts an optional referralCode from the frontend
  const { email, password, username, referralCode } = req.body;

  if (!email || !password || !username) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Check if user already exists
    const userExists = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new Error('User with that email already exists');
    }

    // 2. Handle the referral if a code was provided
    let referrerId = null;
    if (referralCode) {
      const referrerResult = await client.query('SELECT id, referral_count FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerResult.rows.length > 0) {
        const referrer = referrerResult.rows[0];
        // Check if the referrer can accept more referrals
        if (referrer.referral_count < 50) {
          referrerId = referrer.id;
          // Award referrer 150 ZP and increment their count
          await client.query(
            'UPDATE users SET zp_balance = zp_balance + 150, referral_count = referral_count + 1 WHERE id = $1',
            [referrerId]
          );
        }
      }
    }

    // 3. Hash password and generate a new unique referral code for the new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newReferralCode = generateReferralCode();

    // 4. Create the new user
    const newUserQuery = `
      INSERT INTO users (username, email, password_hash, referral_code, referred_by) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, username, email, created_at
    `;
    const newUserResult = await client.query(newUserQuery, [username, email, hashedPassword, newReferralCode, referrerId]);
    const user = newUserResult.rows[0];

    await client.query('COMMIT'); // Commit all changes

    // 5. Send back a response
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Undo all changes if something went wrong
    res.status(400);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});


// --- Controller for User Login --- (no changes needed)
const loginUser = asyncHandler(async (req, res) => { /* ... */ });

module.exports = {
  registerUser,
  loginUser,
};