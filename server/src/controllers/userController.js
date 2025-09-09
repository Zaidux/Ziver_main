const asyncHandler = require('express-async-handler');
const db = require('../config/db'); // We need this to update the user in the database

// --- Controller to get user profile ---
// @desc    Get user profile data
// @route   GET /api/user/me
const getUserProfile = asyncHandler(async (req, res) => {
  // Because this is a protected route, our 'protect' middleware has already
  // fetched the user data and attached it to the request object (req.user).
  // All we have to do here is send it back.
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
// @desc    Log a user activity
// @route   POST /api/user/activity
const updateUserActivity = asyncHandler(async (req, res) => {
  const { activityType } = req.body; // e.g., 'MINING_CLICK'
  const userId = req.user.id;
  let pointsToAdd = 0;
  let zpToAdd = 0; // Ziv Points

  switch (activityType) {
    case 'DAILY_LOGIN':
      pointsToAdd = getRandomPoints(1, 10);
      break;
    case 'MINING_CLICK':
      pointsToAdd = getRandomPoints(5, 15);
      zpToAdd = pointsToAdd * 10; // Let's say 1 point = 10 ZP for mining
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

  // Update the user in the database
  const query = `
    UPDATE users 
    SET 
      social_capital_score = social_capital_score + $1,
      zp_balance = zp_balance + $2
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


module.exports = {
  getUserProfile,
  updateUserActivity,
};
