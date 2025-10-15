const asyncHandler = require('express-async-handler');
const db = require('../config/db');

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
    // Smart referral algorithm:
    // 1. Find active users with less than max referrals
    // 2. Prioritize by: social capital score, recent activity, referral success rate
    // 3. Return a suitable referrer
    
    const smartReferrerResult = await db.query(
      `SELECT id, username, referral_code, referral_count, social_capital_score,
              daily_streak_count, last_active_at
       FROM users 
       WHERE referral_count < 50 
         AND social_capital_score > 0
         AND last_active_at > NOW() - INTERVAL '7 days'
       ORDER BY 
         social_capital_score DESC,
         daily_streak_count DESC,
         referral_count ASC, -- Prefer users with fewer referrals to distribute opportunities
         RANDOM() -- Add some randomness
       LIMIT 1`
    );

    if (smartReferrerResult.rows.length > 0) {
      const referrer = smartReferrerResult.rows[0];
      
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

    // Fallback: any active user with referral capacity
    const fallbackResult = await db.query(
      `SELECT id, username, referral_code, referral_count
       FROM users 
       WHERE referral_count < 50 
         AND last_active_at > NOW() - INTERVAL '30 days'
       ORDER BY RANDOM() 
       LIMIT 1`
    );

    if (fallbackResult.rows.length > 0) {
      const referrer = fallbackResult.rows[0];
      
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

    res.json({
      success: false,
      message: 'No suitable referrer found at this time',
      isSmartMatch: false
    });

  } catch (error) {
    console.error('Error getting smart referrer suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding smart referrer suggestion'
    });
  }
});

// @desc    Apply referral to a new user - ENHANCED WITH SEB POINTS
// @route   POST /api/referrals/apply
const applyReferral = asyncHandler(async (req, res) => {
  const { referralCode, userId } = req.body;

  try {
    // Find the referrer by their referral code
    const referrerResult = await db.query(
      'SELECT id, username, referral_count FROM users WHERE referral_code = $1', 
      [referralCode]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid referral code' 
      });
    }

    const referrer = referrerResult.rows[0];

    // Check max referrals
    if (referrer.referral_count >= 50) {
      return res.status(400).json({
        success: false,
        message: 'This referrer has reached the maximum number of referrals (50)'
      });
    }

    // Generate SEB points reward (5-10 points)
    const sebPointsReward = Math.floor(Math.random() * 6) + 5;

    // Update the referred user's record and add bonus (100 ZP)
    await db.query(
      'UPDATE users SET referred_by = $1, zp_balance = zp_balance + 100 WHERE id = $2',
      [referrer.id, userId]
    );

    // Award bonus to the referrer (150 ZP + SEB points) and increment count
    await db.query(
      `UPDATE users 
       SET zp_balance = zp_balance + 150, 
           referral_count = referral_count + 1,
           social_capital_score = social_capital_score + $1
       WHERE id = $2`,
      [sebPointsReward, referrer.id]
    );

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
    console.error('Error applying referral:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error applying referral' 
    });
  }
});

// @desc    Get referral data for the logged-in user
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

    // 2. Get the list of users they have referred
    const referralsResult = await db.query(
      `SELECT id, username, email, created_at, zp_balance, social_capital_score 
       FROM users WHERE referred_by = $1 ORDER BY created_at DESC`,
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

// @desc    Remove a referred user
// @route   DELETE /api/referrals/:userId
const removeReferral = asyncHandler(async (req, res) => {
  const referrerId = req.user.id;
  const { userId: referredUserId } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Verify the user was actually referred by the current user
    const referredUser = await client.query(
      'SELECT * FROM users WHERE id = $1 AND referred_by = $2', 
      [referredUserId, referrerId]
    );

    if (referredUser.rows.length === 0) {
      throw new Error('This user was not referred by you.');
    }

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

    await client.query('COMMIT');
    res.json({ message: 'Referral removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
});

// @desc    Get referral leaderboard with smart ranking
// @route   GET /api/referrals/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  try {
    const leaderboardResult = await db.query(
      `SELECT username, referral_count, zp_balance, social_capital_score, daily_streak_count
       FROM users 
       WHERE referral_count > 0 
       ORDER BY referral_count DESC, zp_balance DESC, social_capital_score DESC, daily_streak_count DESC
       LIMIT 20`
    );

    res.json({
      leaderboard: leaderboardResult.rows
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
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

module.exports = {
  getReferrerInfo,
  getSmartReferrerSuggestion, // NEW: Added smart referral function
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard,
  clearPendingReferral
};