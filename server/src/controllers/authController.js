const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // <-- IMPORT THE USER MODEL

// Helper function to generate a JWT (no changes here)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- Controller for User Registration ---
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!email || !password || !username) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Use the model to check if the user exists
  const userExists = await User.findByEmail(email);
  if (userExists) {
    res.status(400);
    throw new Error('User with that email already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Use the model to create the new user
  const user = await User.create({ username, email, hashedPassword });

  if (user) {
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
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Use the model to find the user
  const user = await User.findByEmail(email);

  if (user && (await bcrypt.compare(password, user.password_hash))) {
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user.id),
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
