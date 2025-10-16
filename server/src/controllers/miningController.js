const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { sendMiningNotification } = require('./telegramController');
const Transaction = require('../models/Transaction');

function getRandomPoints(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const claimReward = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  // Get user data with ALL required fields from database
  const userResult = await db.query(`
    SELECT mining_session_start_time, last_claim_time, daily_streak_count,
           zp_balance, social_capital_score
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
  const sebPointsToAdd = getRandomPoints(minSebPoints, maxSebPoints);

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const query = `
      UPDATE users
      SET
        zp_balance = zp_balance + $1,
        social_capital_score = social_capital_score + $2,
        daily_streak_count = $3,
        mining_session_start_time = NULL, -- Reset mining session after claim
        last_claim_time = NOW(),
        last_activity = NOW()
      WHERE id = $4
      RETURNING id, username, email, zp_balance, social_capital_score,
                daily_streak_count, mining_session_start_time, last_claim_time;
    `;

    const { rows } = await client.query(query, [zpToAdd, sebPointsToAdd, newStreak, userId]);

    const updatedUser = rows[0];

    // ✅ Create mining transaction record
    await Transaction.create({
      userId: userId,
      type: 'mining_reward',
      amount: zpToAdd,
      currency: 'ZP',
      description: `Mining reward + ${sebPointsToAdd} SEB points`,
      metadata: {
        sebPoints: sebPointsToAdd,
        streak: newStreak,
        miningCycle: miningCycleHours
      }
    });

    await client.query('COMMIT');

    // 🔥 Send Telegram notification for mining completion
    try {
      await sendMiningNotification(userId, zpToAdd, sebPointsToAdd);
      console.log(`Telegram mining notification sent to user: ${userId}`);
    } catch (notificationError) {
      console.error('Error sending Telegram mining notification:', notificationError);
      // Don't fail the claim if notification fails
    }

    res.json({
      success: true,
      message: 'Reward claimed successfully',
      userData: updatedUser,
      rewards: {
        zp: zpToAdd,
        seb: sebPointsToAdd
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

// Function to get current mining status
const getMiningStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userResult = await db.query(`
    SELECT mining_session_start_time, last_claim_time, daily_streak_count,
           zp_balance, social_capital_score, last_activity
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

  let miningStatus = {
    canClaim: false,
    timeRemaining: 0,
    progress: 0,
    userData: user
  };

  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const elapsed = new Date().getTime() - startTime.getTime();
    const progress = Math.min(elapsed / MINING_CYCLE_DURATION, 1); // Cap at 1

    if (elapsed >= MINING_CYCLE_DURATION) {
      miningStatus.canClaim = true;
      miningStatus.progress = 1;
    } else {
      miningStatus.timeRemaining = MINING_CYCLE_DURATION - elapsed;
      miningStatus.progress = progress;
    }
  } else {
    miningStatus.canClaim = false; // Can't claim if no active session
    miningStatus.progress = 0;
  }

  res.json(miningStatus);
});

// Start a mining session
const startMining = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Check if user already has an active mining session
  const userResult = await db.query(`
    SELECT mining_session_start_time
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

  // If user has an active session that's not completed, return error
  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const elapsed = new Date().getTime() - startTime.getTime();

    if (elapsed < MINING_CYCLE_DURATION) {
      res.status(400);
      throw new Error('Mining session already in progress.');
    }
  }

  // Start new mining session
  const query = `
    UPDATE users
    SET mining_session_start_time = NOW(),
        last_activity = NOW()
    WHERE id = $1
    RETURNING id, username, email, zp_balance, social_capital_score,
              mining_session_start_time, last_claim_time, daily_streak_count
  `;

  const { rows } = await db.query(query, [userId]);

  if (rows.length === 0) {
    res.status(404);
    throw new Error('User not found');
  }

  // Return consistent response format with userData
  res.json({
    success: true,
    message: 'Mining started successfully',
    userData: rows[0]
  });
});

// Get mining configuration
const getMiningConfig = asyncHandler(async (req, res) => {
  // Get mining configuration from app_settings
  const settingsResult = await db.query(`
    SELECT setting_key, setting_value
    FROM app_settings
    WHERE setting_key LIKE 'MINING_%' OR setting_key LIKE 'SEB_%'
  `);

  const config = settingsResult.rows.reduce((acc, setting) => {
    acc[setting.setting_key] = setting.setting_value;
    return acc;
  }, {});

  res.json(config);
});

// Update mining settings (Admin only)
const updateMiningSettings = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    res.status(400);
    throw new Error('Settings object required');
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    for (const [key, value] of Object.entries(settings)) {
      await client.query(`
        UPDATE app_settings
        SET setting_value = $1,
            updated_at = NOW()
        WHERE setting_key = $2
      `, [value, key]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Mining settings updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500);
    throw new Error('Failed to update settings: ' + error.message);
  } finally {
    client.release();
  }
});

module.exports = {
  claimReward,
  getMiningStatus,
  startMining,
  getMiningConfig,
  updateMiningSettings
};