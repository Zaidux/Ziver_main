const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get referral data for the logged-in user
// @route   GET /api/referrals
const getReferralData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Get the current user's own referral code and referral count
  const userResult = await db.query(
    'SELECT referral_code, referral_count, zp_balance FROM users WHERE id = $1', 
    [userId]
  );
  const userData = userResult.rows[0];
  
  // 2. Get the list of users they have referred with more details
  const referralsResult = await db.query(
    `SELECT id, username, email, last_seen, daily_streak_count, 
            created_at, zp_balance, social_capital_score 
     FROM users WHERE referred_by = $1 ORDER BY created_at DESC`,
    [userId]
  );
  const referrals = referralsResult.rows;

  // 3. Calculate total earnings from referrals
  const totalEarnings = referrals.length * 150;

  res.json({
    referralCode: userData.referral_code,
    referralCount: userData.referral_count || 0,
    totalEarnings: totalEarnings,
    referrals: referrals,
    currentBalance: userData.zp_balance
  });
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

    // 3. Set the referred user's 'referred_by' to null
    await client.query(
      'UPDATE users SET referred_by = NULL WHERE id = $1',
      [referredUserId]
    );

    await client.query('COMMIT');
    res.json({ message: 'Referral removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(400);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboardResult = await db.query(
    `SELECT username, referral_count, zp_balance 
     FROM users 
     WHERE referral_count > 0 
     ORDER BY referral_count DESC, zp_balance DESC 
     LIMIT 10`
  );

  res.json({
    leaderboard: leaderboardResult.rows
  });
});

module.exports = {
  getReferralData,
  removeReferral,
  getLeaderboard
};