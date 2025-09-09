const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// Helper function to generate a JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // The token will be valid for 30 days
  });
};


// --- Controller for User Registration ---
// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  // 1. Validation: Check if all fields are provided
  if (!email || !password || !username) {
    res.status(400);
    throw new Error('Please provide all required fields (email, password, username)');
  }

  // 2. Check if user already exists
  const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userExists.rows.length > 0) {
    res.status(400);
    throw new Error('User with that email already exists');
  }

  // 3. Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Create the new user in the database
  const newUserQuery = `
    INSERT INTO users (username, email, password_hash, zp_balance, social_capital_score) 
    VALUES ($1, $2, $3, 0, 0) 
    RETURNING id, username, email, created_at
  `;
  const newUser = await db.query(newUserQuery, [username, email, hashedPassword]);

  // 5. Send back user data and token
  if (newUser.rows.length > 0) {
    const user = newUser.rows[0];
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});


// --- Controller for User Login ---
// @desc    Authenticate a user
// @route   POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1. Find user by email
  const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userResult.rows[0];

  // 2. Check if user exists and if password matches
  if (user && (await bcrypt.compare(password, user.password_hash))) {
    // 3. Send back user data and a new token
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
    });
  } else {
    res.status(401); // Unauthorized
    throw new Error('Invalid email or password');
  }
});


module.exports = {
  registerUser,
  loginUser,
};

