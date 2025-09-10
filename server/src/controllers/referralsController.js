const asyncHandler = require('express-async-handler');
const db = require('../config/db');

// @desc    Get referral data for the logged-in user
// @route   GET /api/referrals
const getReferralData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // 1. Get the current user's own referral code
  const userResult = await db.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  const referralCode = userResult.rows[0]?.referral_code;

  // 2. Get the list of users they have referred
  const referralsResult = await db.query(
    'SELECT id, username, last_seen, daily_streak_count FROM users WHERE referred_by = $1',
    [userId]
  );
  const referrals = referralsResult.rows;

  res.json({
    referralCode,
    referrals,
  });
});

// @desc    Remove a referred user
// @route   DELETE /api/referrals/:userId
const removeReferral = asyncHandler(async (req, res) => {
  const referrerId = req.user.id;
  const { userId: referredUserId } = req.params;

  const client = await db.getClient();
  try {
    await client.query('BEGIN'); // Start transaction

    // 1. Verify the user was actually referred by the current user
    const referredUser = await client.query('SELECT * FROM users WHERE id = $1 AND referred_by = $2', [referredUserId, referrerId]);
    if (referredUser.rows.length === 0) {
      throw new Error('This user was not referred by you.');
    }

    // 2. Decrement the referrer's count
    await client.query('UPDATE users SET referral_count = referral_count - 1 WHERE id = $1', [referrerId]);

    // 3. Set the referred user's 'referred_by' to null
    await client.query('UPDATE users SET referred_by = NULL WHERE id = $1', [referredUserId]);

    await client.query('COMMIT'); // Commit transaction
    res.json({ message: 'Referral removed successfully' });
  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on error
    res.status(400);
    throw new Error(error.message);
  } finally {
    client.release();
  }
});

module.exports = {
  getReferralData,
  removeReferral,
};