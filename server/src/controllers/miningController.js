const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// Helper function for random points (same as before)
function getRandomPoints(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// @desc    Claim mining rewards
// @route   POST /api/mining/claim
const claimReward = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  const now = new Date();
  
  // Mining cycle is 4 hours (4 * 60 * 60 * 1000 milliseconds)
  const MINING_CYCLE_DURATION = 4 * 60 * 60 * 1000;

  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const timePassed = now.getTime() - startTime.getTime();

    if (timePassed < MINING_CYCLE_DURATION) {
      res.status(400);
      throw new Error('Mining cycle not yet complete.');
    }
  }

  // --- Calculate Daily Streak ---
  let newStreak = user.daily_streak_count;
  if (user.last_claim_time) {
    const lastClaimDate = new Date(user.last_claim_time);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastClaimDay = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate());
    
    const diffDays = (today - lastClaimDay) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      newStreak++; // Consecutive day
    } else if (diffDays > 1) {
      newStreak = 1; // Streak broken, reset to 1
    }
    // If diffDays is 0, it's the same day, so streak doesn't change
  } else {
    newStreak = 1; // First claim ever
  }

  // --- Calculate Rewards ---
  const zpToAdd = 50; // Fixed ZP reward
  const pointsToAdd = getRandomPoints(5, 15); // Random SEB points

  // --- Update Database ---
  const query = `
    UPDATE users
    SET
      zp_balance = zp_balance + $1,
      social_capital_score = social_capital_score + $2,
      daily_streak_count = $3,
      mining_session_start_time = NOW(),
      last_claim_time = NOW()
    WHERE id = $4
    RETURNING *;
  `;
  const { rows } = await db.query(query, [zpToAdd, pointsToAdd, newStreak, userId]);

  // Exclude password from the returned user object
  const updatedUser = rows[0];
  delete updatedUser.password_hash;
  
  res.json(updatedUser);
});

module.exports = {
  claimReward,
};