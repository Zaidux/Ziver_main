const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads (memory storage for Render.com compatibility)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 // 1MB limit
  }
});

// --- Controller to verify token ---
const verifyToken = asyncHandler(async (req, res) => {
  res.json({ valid: true, user: req.user });
});

// --- Controller to get user profile ---
const getUserProfile = asyncHandler(async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// NEW: Update user profile
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    avatar_url,
    bio,
    telegram_username,
    twitter_username,
    linkedin_url
  } = req.body;

  // Validate bio length (max 500 characters)
  if (bio && bio.length > 500) {
    res.status(400);
    throw new Error('Bio must be less than 500 characters');
  }

  // Validate Twitter username format
  if (twitter_username && !/^[A-Za-z0-9_]{1,15}$/.test(twitter_username)) {
    res.status(400);
    throw new Error('Twitter username must be 1-15 characters and contain only letters, numbers, and underscores');
  }

  // Validate LinkedIn URL format
  if (linkedin_url && !linkedin_url.includes('linkedin.com/in/')) {
    res.status(400);
    throw new Error('Please provide a valid LinkedIn profile URL');
  }

  // Check if telegram username is already taken
  if (telegram_username) {
    const existingUser = await User.findByTelegramUsername(telegram_username);
    if (existingUser && existingUser.id !== userId) {
      res.status(400);
      throw new Error('Telegram username is already taken');
    }
  }

  const updatedUser = await User.updateProfile(userId, {
    avatar_url,
    bio,
    telegram_username,
    twitter_username,
    linkedin_url
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: updatedUser
  });
});

// NEW: Upload avatar with file handling
const uploadAvatar = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  try {
    // Convert buffer to base64 for storage in database
    const base64Image = req.file.buffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const updatedUser = await User.updateProfile(userId, { avatar_url: dataUrl });

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw new Error('Failed to upload avatar');
  }
});

// NEW: Auto-save Telegram username
const autoSaveTelegramUsername = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { telegram_username } = req.body;

  if (!telegram_username) {
    res.status(400);
    throw new Error('Telegram username is required');
  }

  // Check if telegram username is already taken
  const existingUser = await User.findByTelegramUsername(telegram_username);
  if (existingUser && existingUser.id !== userId) {
    res.status(400);
    throw new Error('Telegram username is already taken');
  }

  const updatedUser = await User.updateProfile(userId, { telegram_username });

  res.json({
    success: true,
    message: 'Telegram username saved successfully',
    user: updatedUser
  });
});

// A helper function to get a random number within a range
function getRandomPoints(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- Controller to update user activity and score ---
const updateUserActivity = asyncHandler(async (req, res) => {
  const { activityType } = req.body;
  const userId = req.user.id;
  let pointsToAdd = 0;
  let zpToAdd = 0;

  switch (activityType) {
    case 'DAILY_LOGIN':
      pointsToAdd = getRandomPoints(1, 10);
      break;
    case 'TASK_PERFORMED':
      pointsToAdd = getRandomPoints(1, 8);
      break;
    case 'REFERRAL_SUCCESS':
      pointsToAdd = getRandomPoints(10, 20);
      break;
    case 'MINING_CLICK':
      // REMOVED: Mining rewards are now handled exclusively by miningController.js
      // This prevents SEB points from being added during mining progress
      pointsToAdd = 0;
      zpToAdd = 0;
      break;
    default:
      pointsToAdd = 0;
  }

  const query = `
    UPDATE users 
    SET social_capital_score = social_capital_score + $1, 
        zp_balance = zp_balance + $2,
        last_activity = NOW()
    WHERE id = $3
    RETURNING id, username, email, zp_balance, social_capital_score
  `;
  const { rows } = await db.query(query, [pointsToAdd, zpToAdd, userId]);
  if (rows.length > 0) {
    res.json(rows[0]);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- Controller to record user activity heartbeat ---
const recordHeartbeat = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const query = 'UPDATE users SET last_seen = NOW() WHERE id = $1';
  await db.query(query, [userId]);
  res.status(200).json({ message: 'Heartbeat recorded' });
});

module.exports = {
  verifyToken,
  getUserProfile,
  updateProfile,
  uploadAvatar: [upload.single('avatar'), uploadAvatar], // Add multer middleware
  autoSaveTelegramUsername,
  updateUserActivity,
  recordHeartbeat,
};