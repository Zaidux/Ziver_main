const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const Transaction = require('../models/Transaction');

// @desc    Get referrer info by referral code
// @route   GET /api/referrals/referrer-info/:referralCode
const getReferrerInfo = asyncHandler(async (req, res) => {
  const { referralCode } = req.params;

  try {
    // Check if it's a valid user referral code
    const userResult = await db.query(
      'SELECT id, username, email, referral_count FROM users WHERE referral_code = $1',
      [referralCode]
    );

    if (userResult.rows.length > 0) {
      const referrer = userResult.rows[0];

      // Check max referrals (50)
      if (referrer.referral_count >= 50) {
        return res.json({
          success: false,
          message: 'This referrer has reached the maximum number of referrals (50)',
          isValid: false
        });
      }

      return res.json({
        success: true,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          email: referrer.email,
          referral_code: referralCode
        },
        isValid: true
      });
    }

    res.status(404).json({
      success: false,
      message: 'Invalid referral code',
      isValid: false
    });

  } catch (error) {
    console.error('Error getting referrer info:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking referral code'
    });
  }
});

// @desc    Get smart referrer suggestion for new users
// @route   GET /api/referrals/smart-suggestion
const getSmartReferrerSuggestion = asyncHandler(async (req, res) => {
  try {
    console.log('Getting smart referrer suggestion using last_activity column...');

    // Smart referral algorithm using the existing last_activity column
    const smartReferrerResult = await db.query(
      `SELECT id, username, referral_code, referral_count, social_capital_score,
              daily_streak_count, last_activity
       FROM users 
       WHERE referral_count < 50 
         AND social_capital_score > 0
         AND last_activity > NOW() - INTERVAL '7 days'
       ORDER BY 
         social_capital_score DESC,
         daily_streak_count DESC,
         referral_count ASC, -- Prefer users with fewer referrals to distribute opportunities
         RANDOM() -- Add some randomness
       LIMIT 1`
    );

    if (smartReferrerResult.rows.length > 0) {
      const referrer = smartReferrerResult.rows[0];
      console.log('Smart referrer found using last_activity:', referrer.username);

      return res.json({
        success: true,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          referral_code: referrer.referral_code,
          social_capital_score: referrer.social_capital_score,
          referral_count: referrer.referral_count
        },
        message: 'Smart referrer suggestion found',
        isSmartMatch: true
      });
    }

    console.log('No recent active referrer found, trying wider time window...');

    // Fallback: any active user with referral capacity (wider time window)
    const fallbackResult = await db.query(
      `SELECT id, username, referral_code, referral_count
       FROM users 
       WHERE referral_count < 50 
         AND last_activity > NOW() - INTERVAL '30 days'
       ORDER BY RANDOM() 
       LIMIT 1`
    );

    if (fallbackResult.rows.length > 0) {
      const referrer = fallbackResult.rows[0];
      console.log('Fallback referrer found:', referrer.username);

      return res.json({
        success: true,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          referral_code: referrer.referral_code,
          referral_count: referrer.referral_count
        },
        message: 'Fallback referrer suggestion found',
        isSmartMatch: true
      });
    }

    console.log('No active referrers found, trying any user with referral capacity...');

    // Final fallback: any user with referral capacity (no activity requirement)
    const finalFallbackResult = await db.query(
      `SELECT id, username, referral_code, referral_count
       FROM users 
       WHERE referral_count < 50 
       ORDER BY RANDOM() 
       LIMIT 1`
    );

    if (finalFallbackResult.rows.length > 0) {
      const referrer = finalFallbackResult.rows[0];
      console.log('Final fallback referrer found:', referrer.username);

      return res.json({
        success: true,
        referrer: {
          id: referrer.id,
          username: referrer.username,
          referral_code: referrer.referral_code,
          referral_count: referrer.referral_count
        },
        message: 'Basic referrer suggestion found',
        isSmartMatch: true
      });
    }

    console.log('No suitable referrer found at all');

    res.json({
      success: false,
      message: 'No suitable referrer found at this time',
      isSmartMatch: false
    });

  } catch (error) {
    console.error('Error getting smart referrer suggestion:', error);

    // If there's still an error, try the most basic query possible
    try {
      console.log('Trying emergency fallback query...');
      const emergencyResult = await db.query(
        `SELECT id, username, referral_code 
         FROM users 
         WHERE referral_count < 50 
         LIMIT 1`
      );

      if (emergencyResult.rows.length > 0) {
        const referrer = emergencyResult.rows[0];
        console.log('Emergency fallback referrer found:', referrer.username);

        return res.json({
          success: true,
          referrer: {
            id: referrer.id,
            username: referrer.username,
            referral_code: referrer.referral_code,
            referral_count: 0
          },
          message: 'Emergency referrer suggestion found',
          isSmartMatch: true
        });
      }
    } catch (emergencyError) {
      console.error('Even emergency fallback failed:', emergencyError);
    }

    res.status(500).json({
      success: false,
      message: 'Error finding smart referrer suggestion'
    });
  }
});

// @desc    Apply referral to a new user - ENHANCED WITH SEB POINTS AND TRANSACTIONS
// @route   POST /api/referrals/apply
const applyReferral = asyncHandler(async (req, res) => {
  const { referralCode, userId } = req.body;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Find the referrer by their referral code
    const referrerResult = await client.query(
      'SELECT id, username, referral_count FROM users WHERE referral_code = $1', 
      [referralCode]
    );

    if (referrerResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        success: false,
        message: 'Invalid referral code' 
      });
    }

    const referrer = referrerResult.rows[0];

    // Check max referrals
    if (referrer.referral_count >= 50) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This referrer has reached the maximum number of referrals (50)'
      });
    }

    // Generate SEB points reward (5-10 points)
    const sebPointsReward = Math.floor(Math.random() * 6) + 5;

    // Update the referred user's record and add bonus (100 ZP)
    await client.query(
      'UPDATE users SET referred_by = $1, zp_balance = zp_balance + 100 WHERE id = $2',
      [referrer.id, userId]
    );

    // Award bonus to the referrer (150 ZP + SEB points) and increment count
    await client.query(
      `UPDATE users 
       SET zp_balance = zp_balance + 150, 
           referral_count = referral_count + 1,
           social_capital_score = social_capital_score + $1
       WHERE id = $2`,
      [sebPointsReward, referrer.id]
    );

    // ✅ NEW: Create transactions for both users
    // Transaction for referred user (100 ZP bonus)
    await Transaction.create({
      userId: userId,
      type: 'referral_bonus',
      amount: 100,
      currency: 'ZP',
      description: `Referral bonus from ${referrer.username}`,
      referenceId: referrer.id,
      referenceType: 'referral',
      metadata: {
        referrerUsername: referrer.username,
        bonusType: 'referred_user'
      }
    });

    // Transaction for referrer (150 ZP + SEB bonus)
    await Transaction.create({
      userId: referrer.id,
      type: 'referral_reward',
      amount: 150,
      currency: 'ZP',
      description: `Referral reward for inviting new user`,
      referenceId: userId,
      referenceType: 'referral',
      metadata: {
        referredUserId: userId,
        sebPoints: sebPointsReward,
        bonusType: 'referrer'
      }
    });

    await client.query('COMMIT');

    res.status(200).json({ 
      success: true,
      message: 'Referral applied successfully',
      bonus: 100,
      referrer: {
        id: referrer.id,
        username: referrer.username
      },
      referrerBonus: {
        zp: 150,
        sebPoints: sebPointsReward
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error applying referral:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error applying referral' 
    });
  } finally {
    client.release();
  }
});

// @desc    Get referral data for the logged-in user - UPDATED WITH STREAK AND MINING DATA
// @route   GET /api/referrals
const getReferralData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get the current user's own referral code and referral count
    const userResult = await db.query(
      'SELECT referral_code, referral_count, zp_balance, social_capital_score FROM users WHERE id = $1', 
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userResult.rows[0];

    // 2. Get the list of users they have referred - UPDATED TO INCLUDE STREAK AND MINING DATA
    const referralsResult = await db.query(
      `SELECT 
        id, 
        username, 
        email, 
        created_at, 
        zp_balance, 
        social_capital_score,
        daily_streak_count,
        last_seen,
        last_activity,
        mining_session_start_time
       FROM users 
       WHERE referred_by = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    const referrals = referralsResult.rows;

    // 3. Calculate total earnings from referrals (150 ZP per referral)
    const totalEarnings = referrals.length * 150;

    // 4. Get pending referrals
    const pendingResult = await db.query(
      `SELECT referral_code, referrer_username, created_at 
       FROM pending_referrals 
       WHERE referrer_id = $1 AND expires_at > NOW() 
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      referralCode: userData.referral_code,
      referralCount: userData.referral_count || 0,
      maxReferrals: 50,
      referralsRemaining: Math.max(0, 50 - (userData.referral_count || 0)),
      totalEarnings: totalEarnings,
      referrals: referrals,
      pendingReferrals: pendingResult.rows,
      currentBalance: userData.zp_balance,
      socialCapitalScore: userData.social_capital_score
    });
  } catch (error) {
    console.error('Error fetching referral data:', error);
    res.status(500).json({ message: 'Error fetching referral data' });
  }
});

// @desc    Remove a referred user - ENHANCED WITH TRANSACTION CLEANUP
// @route   DELETE /api/referrals/:userId
const removeReferral = asyncHandler(async (req, res) => {
  const referrerId = req.user.id;
  const { userId: referredUserId } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify the user was actually referred by the current user
    const referredUser = await client.query(
      'SELECT username, referred_by FROM users WHERE id = $1 AND referred_by = $2', 
      [referredUserId, referrerId]
    );

    if (referredUser.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: 'This user was not referred by you.' 
      });
    }

    const referredUsername = referredUser.rows[0].username;

    // 2. Decrement the referrer's count and remove bonus ZP
    await client.query(
      'UPDATE users SET referral_count = referral_count - 1, zp_balance = GREATEST(0, zp_balance - 150) WHERE id = $1',
      [referrerId]
    );

    // 3. Remove bonus from referred user and set referred_by to null
    await client.query(
      'UPDATE users SET referred_by = NULL, zp_balance = GREATEST(0, zp_balance - 100) WHERE id = $1',
      [referredUserId]
    );

    // 4. Remove related transactions
    await Transaction.removeReferralTransactions(referredUserId, referrerId);

    await client.query('COMMIT');
    
    res.json({ 
      success: true,
      message: `Successfully removed ${referredUsername} from your referrals` 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error removing referral:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to remove referral' 
    });
  } finally {
    client.release();
  }
});

// @desc    Get referral leaderboard with smart ranking
// @route   GET /api/referrals/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  try {
    const leaderboardResult = await db.query(
      `SELECT 
        username, 
        referral_count, 
        zp_balance, 
        social_capital_score, 
        daily_streak_count,
        last_activity
       FROM users 
       WHERE referral_count > 0 
       ORDER BY 
         referral_count DESC, 
         zp_balance DESC, 
         social_capital_score DESC, 
         daily_streak_count DESC
       LIMIT 20`
    );

    res.json({
      success: true,
      leaderboard: leaderboardResult.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching leaderboard' 
    });
  }
});

// @desc    Clear pending referral
// @route   DELETE /api/referrals/pending/:referralCode
const clearPendingReferral = asyncHandler(async (req, res) => {
  const { referralCode } = req.params;

  try {
    await db.query(
      'DELETE FROM pending_referrals WHERE referral_code = $1',
      [referralCode]
    );

    res.json({ 
      success: true,
      message: 'Pending referral cleared'
    });
  } catch (error) {
    console.error('Error clearing pending referral:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error clearing pending referral' 
    });
  }
});

// @desc    Get detailed referral analytics
// @route   GET /api/referrals/analytics
const getReferralAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // Get basic referral stats
    const referralStats = await db.query(
      `SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN last_activity > NOW() - INTERVAL '7 days' THEN 1 END) as active_referrals,
        COUNT(CASE WHEN mining_session_start_time IS NOT NULL THEN 1 END) as currently_mining,
        AVG(daily_streak_count) as avg_streak,
        MAX(daily_streak_count) as max_streak
       FROM users 
       WHERE referred_by = $1`,
      [userId]
    );

    // Get referral earnings over time
    const earningsStats = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as referrals_added,
        COUNT(*) * 150 as daily_earnings
       FROM users 
       WHERE referred_by = $1 
         AND created_at > NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      [userId]
    );

    const stats = referralStats.rows[0] || {
      total_referrals: 0,
      active_referrals: 0,
      currently_mining: 0,
      avg_streak: 0,
      max_streak: 0
    };

    res.json({
      success: true,
      analytics: {
        totalReferrals: parseInt(stats.total_referrals),
        activeReferrals: parseInt(stats.active_referrals),
        currentlyMining: parseInt(stats.currently_mining),
        averageStreak: parseFloat(stats.avg_streak) || 0,
        maxStreak: parseInt(stats.max_streak) || 0,
        inactiveReferrals: parseInt(stats.total_referrals) - parseInt(stats.active_referrals)
      },
      earningsHistory: earningsStats.rows
    });
  } catch (error) {
    console.error('Error fetching referral analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching referral analytics'
    });
  }
});

module.exports = {
  getReferrerInfo,
  getSmartReferrerSuggestion,
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard,
  clearPendingReferral,
  getReferralAnalytics
};