const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Apply referral to a new user
// @route   POST /api/referrals/apply
const applyReferral = asyncHandler(async (req, res) => {
  const { referralCode, userId } = req.body;

  try {
    // Find the referrer by their referral code
    const referrerResult = await db.query(
      'SELECT id FROM users WHERE referral_code = $1', 
      [referralCode]
    );
    
    if (referrerResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invalid referral code' });
    }
    
    const referrerId = referrerResult.rows[0].id;
    
    // Update the referred user's record
    await db.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [referrerId, userId]
    );
    
    // Award bonus to the referred user (100 ZP)
    await db.query(
      'UPDATE users SET zp_balance = zp_balance + 100 WHERE id = $1',
      [userId]
    );
    
    // Award bonus to the referrer (50 ZP) and increment count
    await db.query(
      'UPDATE users SET zp_balance = zp_balance + 50, referral_count = referral_count + 1 WHERE id = $1',
      [referrerId]
    );
    
    res.status(200).json({ 
      message: 'Referral applied successfully',
      bonus: 100
    });
  } catch (error) {
    console.error('Error applying referral:', error);
    res.status(500).json({ message: 'Error applying referral' });
  }
});

// @desc    Get referral data for the logged-in user
// @route   GET /api/referrals
const getReferralData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get the current user's own referral code and referral count
    const userResult = await db.query(
      'SELECT referral_code, referral_count, zp_balance FROM users WHERE id = $1', 
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userData = userResult.rows[0];

    // 2. Get the list of users they have referred
    const referralsResult = await db.query(
      `SELECT id, username, email, created_at, zp_balance 
       FROM users WHERE referred_by = $1 ORDER BY created_at DESC`,
      [userId]
    );
    
    const referrals = referralsResult.rows;

    // 3. Calculate total earnings from referrals (50 ZP per referral)
    const totalEarnings = referrals.length * 50;

    res.json({
      referralCode: userData.referral_code,
      referralCount: userData.referral_count || 0,
      totalEarnings: totalEarnings,
      referrals: referrals,
      currentBalance: userData.zp_balance
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
      'UPDATE users SET referral_count = referral_count - 1, zp_balance = GREATEST(0, zp_balance - 50) WHERE id = $1',
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
    res.status(400);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});

// @desc    Get referral leaderboard
// @route   GET /api/referrals/leaderboard
const getLeaderboard = asyncHandler(async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

module.exports = {
  applyReferral,
  getReferralData,
  removeReferral,
  getLeaderboard
};