const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// --- Controller to verify token --- NEW FUNCTION
const verifyToken = asyncHandler(async (req, res) => {
  // If protect middleware passed, the token is valid
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
    case 'MINING_CLICK':
      pointsToAdd = getRandomPoints(5, 15);
      zpToAdd = pointsToAdd * 10;
      break;
    case 'TASK_PERFORMED':
      pointsToAdd = getRandomPoints(1, 8);
      break;
    case 'REFERRAL_SUCCESS':
      pointsToAdd = getRandomPoints(10, 20);
      break;
    default:
      pointsToAdd = 0;
  }

  const query = `
    UPDATE users 
    SET social_capital_score = social_capital_score + $1, zp_balance = zp_balance + $2
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
  verifyToken, // <-- ADD THIS EXPORT
  getUserProfile,
  updateUserActivity,
  recordHeartbeat,
};