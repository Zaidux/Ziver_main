const asyncHandler = require('express-async-handler');
const db = require('../config/db');

function getRandomPoints(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const claimReward = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Get user data with ALL required fields from database
  const userResult = await db.query(`
    SELECT mining_session_start_time, last_claim_time, daily_streak_count 
    FROM users WHERE id = $1
  `, [userId]);
  
  const user = userResult.rows[0];
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const settingsResult = await db.query('SELECT * FROM app_settings');
  const appSettings = settingsResult.rows.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {});

  const miningCycleHours = parseFloat(appSettings.MINING_CYCLE_HOURS || '4');
  const MINING_CYCLE_DURATION = miningCycleHours * 60 * 60 * 1000;

  // Check if mining session is active and not completed
  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const elapsed = now.getTime() - startTime.getTime();
    
    if (elapsed < MINING_CYCLE_DURATION) {
      res.status(400);
      throw new Error('Mining cycle not yet complete.');
    }
  }

  // Calculate daily streak
  let newStreak = user.daily_streak_count || 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (user.last_claim_time) {
    const lastClaimDate = new Date(user.last_claim_time);
    const lastClaimDay = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate());

    const diffTime = today.getTime() - lastClaimDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Claimed yesterday, continue streak
      newStreak++;
    } else if (diffDays === 0) {
      // Already claimed today, don't change streak
      // This prevents multiple claims per day from increasing streak
    } else if (diffDays > 1) {
      // Missed one or more days, reset streak
      newStreak = 1;
    }
  } else {
    // First time claiming
    newStreak = 1;
  }

  const zpToAdd = parseInt(appSettings.MINING_REWARD || '50', 10);
  const minSebPoints = parseInt(appSettings.SEB_MINING_MIN || '5', 10);
  const maxSebPoints = parseInt(appSettings.SEB_MINING_MAX || '15', 10);
  const pointsToAdd = getRandomPoints(minSebPoints, maxSebPoints);

  const query = `
    UPDATE users
    SET
      zp_balance = zp_balance + $1,
      social_capital_score = social_capital_score + $2,
      daily_streak_count = $3,
      mining_session_start_time = NOW(),
      last_claim_time = NOW()
    WHERE id = $4
    RETURNING id, username, email, zp_balance, social_capital_score, 
              daily_streak_count, mining_session_start_time, last_claim_time;
  `;
  
  const { rows } = await db.query(query, [zpToAdd, pointsToAdd, newStreak, userId]);

  const updatedUser = rows[0];
  res.json(updatedUser);
});

// NEW: Function to get current mining status
const getMiningStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  const userResult = await db.query(`
    SELECT mining_session_start_time, last_claim_time, daily_streak_count,
           zp_balance, social_capital_score
    FROM users WHERE id = $1
  `, [userId]);
  
  const user = userResult.rows[0];
  const settingsResult = await db.query('SELECT * FROM app_settings');
  const appSettings = settingsResult.rows.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {});

  const miningCycleHours = parseFloat(appSettings.MINING_CYCLE_HOURS || '4');
  const MINING_CYCLE_DURATION = miningCycleHours * 60 * 60 * 1000;

  let miningStatus = {
    canClaim: false,
    timeRemaining: 0,
    userData: user
  };

  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const elapsed = new Date().getTime() - startTime.getTime();
    
    if (elapsed >= MINING_CYCLE_DURATION) {
      miningStatus.canClaim = true;
    } else {
      miningStatus.timeRemaining = MINING_CYCLE_DURATION - elapsed;
    }
  } else {
    miningStatus.canClaim = true;
  }

  res.json(miningStatus);
});

module.exports = {
  claimReward,
  getMiningStatus // Export the new function
};