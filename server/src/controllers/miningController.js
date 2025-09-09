const asyncHandler = require('express-async-handler');
const db = require('../config/db');

function getRandomPoints(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const claimReward = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = req.user;
  const now = new Date();
  
  // --- 1. FETCH SETTINGS FROM DATABASE (no change here) ---
  const settingsResult = await db.query('SELECT * FROM app_settings');
  const appSettings = settingsResult.rows.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {});

  // --- 2. USE THE DYNAMIC MINING CYCLE DURATION ---
  const miningCycleHours = parseFloat(appSettings.MINING_CYCLE_HOURS || '4');
  const MINING_CYCLE_DURATION = miningCycleHours * 60 * 60 * 1000;

  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    if (now.getTime() - startTime.getTime() < MINING_CYCLE_DURATION) {
      res.status(400);
      throw new Error('Mining cycle not yet complete.');
    }
  }

  // --- 3. Calculate Daily Streak (no change here) ---
  let newStreak = user.daily_streak_count;
  if (user.last_claim_time) {
    const lastClaimDate = new Date(user.last_claim_time);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastClaimDay = new Date(lastClaimDate.getFullYear(), lastClaimDate.getMonth(), lastClaimDate.getDate());
    const diffDays = (today - lastClaimDay) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) newStreak++;
    else if (diffDays > 1) newStreak = 1;
  } else {
    newStreak = 1;
  }
  
  // --- 4. Calculate Rewards USING FETCHED SETTINGS (no change here) ---
  const zpToAdd = parseInt(appSettings.MINING_REWARD || '50', 10);
  const minSebPoints = parseInt(appSettings.SEB_MINING_MIN || '5', 10);
  const maxSebPoints = parseInt(appSettings.SEB_MINING_MAX || '15', 10);
  const pointsToAdd = getRandomPoints(minSebPoints, maxSebPoints);

  // --- 5. Update Database (no change here) ---
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

  const updatedUser = rows[0];
  delete updatedUser.password_hash;
  
  res.json(updatedUser);
});

module.exports = {
  claimReward,
};