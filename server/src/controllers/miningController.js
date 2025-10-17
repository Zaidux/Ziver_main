const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const { sendMiningNotification, sendMiningClaimedNotification } = require('./telegramController');
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
           zp_balance, social_capital_score, last_notification_sent, username
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
      newStreak++;
    } else if (diffDays === 0) {
      // Already claimed today, don't change streak
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  } else {
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
        mining_session_start_time = NULL,
        last_notification_sent = NULL, -- Clear notification flag
        last_claim_time = NOW(),
        last_activity = NOW()
      WHERE id = $4
      RETURNING id, username, email, zp_balance, social_capital_score,
                daily_streak_count, mining_session_start_time, last_claim_time;
    `;

    const { rows } = await client.query(query, [zpToAdd, sebPointsToAdd, newStreak, userId]);

    const updatedUser = rows[0];

    // Create mining transaction record
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

    // FIXED: Send Telegram notification that reward was CLAIMED
    try {
      console.log(`💰 Attempting to send mining claimed notification to user: ${userId}`);
      const notificationSent = await sendMiningClaimedNotification(userId, zpToAdd);
      
      if (notificationSent) {
        console.log(`✅ Telegram mining claimed notification sent successfully to user: ${userId}`);
      } else {
        console.log(`⏭️ No Telegram notification sent (user may not have Telegram connected or alerts disabled): ${userId}`);
      }
    } catch (notificationError) {
      console.error('❌ Error sending Telegram mining claimed notification:', notificationError);
      // Don't throw error - continue with successful claim response
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

// Function to get current mining status - FIXED: No spam notifications
const getMiningStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const userResult = await db.query(`
    SELECT mining_session_start_time, last_claim_time, daily_streak_count,
           zp_balance, social_capital_score, last_activity, last_notification_sent
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
    const progress = Math.min(elapsed / MINING_CYCLE_DURATION, 1);

    if (elapsed >= MINING_CYCLE_DURATION) {
      miningStatus.canClaim = true;
      miningStatus.progress = 1;

      // REMOVED: Telegram notification from here to prevent spam
      // The background checker will handle notifications automatically
    } else {
      miningStatus.timeRemaining = MINING_CYCLE_DURATION - elapsed;
      miningStatus.progress = progress;
    }
  } else {
    miningStatus.canClaim = false;
    miningStatus.progress = 0;
  }

  res.json(miningStatus);
});

// Manual mining completion check endpoint
const checkMiningCompletion = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();

  const userResult = await db.query(`
    SELECT mining_session_start_time, last_claim_time, last_notification_sent
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

  let miningCompleted = false;
  let rewardAmount = 0;

  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const elapsed = now.getTime() - startTime.getTime();

    if (elapsed >= MINING_CYCLE_DURATION) {
      miningCompleted = true;
      rewardAmount = parseInt(appSettings.MINING_REWARD || '50', 10);

      // Send Telegram notification only if not already sent recently
      const lastNotificationSent = user.last_notification_sent;
      const shouldSendNotification = !lastNotificationSent || 
        (now - new Date(lastNotificationSent)) > (60 * 60 * 1000);

      if (shouldSendNotification) {
        try {
          const notificationSent = await sendMiningNotification(userId, rewardAmount);

          if (notificationSent) {
            // Update last_notification_sent
            await db.query(
              'UPDATE users SET last_notification_sent = NOW() WHERE id = $1',
              [userId]
            );
            console.log(`✅ Manual check: Mining notification sent to user: ${userId}`);
          }
        } catch (notificationError) {
          console.error('❌ Error sending Telegram mining notification:', notificationError);
        }
      }
    }
  }

  res.json({
    miningCompleted,
    rewardAmount: miningCompleted ? rewardAmount : 0,
    message: miningCompleted ? 'Mining completed! Ready to claim.' : 'Mining in progress'
  });
});

const startMining = asyncHandler(async (req, res) => {
  const userId = req.user.id;

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

  if (user.mining_session_start_time) {
    const startTime = new Date(user.mining_session_start_time);
    const elapsed = new Date().getTime() - startTime.getTime();

    if (elapsed < MINING_CYCLE_DURATION) {
      res.status(400);
      throw new Error('Mining session already in progress.');
    }
  }

  // Start new mining session and clear previous notification flag
  const query = `
    UPDATE users
    SET mining_session_start_time = NOW(),
        last_notification_sent = NULL,
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

  res.json({
    success: true,
    message: 'Mining started successfully',
    userData: rows[0]
  });
});

const getMiningConfig = asyncHandler(async (req, res) => {
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

const updateMiningSettings = asyncHandler(async (req, res) => {
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
  updateMiningSettings,
  checkMiningCompletion
};