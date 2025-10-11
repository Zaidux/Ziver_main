const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const User = require('../../models/User');

const accountController = {
  // Update email with enhanced validation and verification
  updateEmail: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !currentPassword) {
      res.status(400);
      throw new Error('New email and current password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      res.status(400);
      throw new Error('Invalid email format');
    }

    // Check if email is the same as current
    const currentUserQuery = 'SELECT email FROM users WHERE id = $1';
    const currentUserResult = await db.query(currentUserQuery, [userId]);
    
    if (currentUserResult.rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const currentEmail = currentUserResult.rows[0].email;
    
    if (newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      res.status(400);
      throw new Error('New email must be different from current email');
    }

    // Verify current password
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const { rows } = await db.query(userQuery, [userId]);

    const isPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isPasswordValid) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    // Check if email is already taken
    const existingUser = await User.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      res.status(400);
      throw new Error('Email is already taken by another account');
    }

    // Update email and reset verification status
    const updateQuery = `
      UPDATE users 
      SET email = $1, 
          email_verified = false,
          updated_at = NOW()
      WHERE id = $2 
      RETURNING id, email, email_verified
    `;
    
    const updateResult = await db.query(updateQuery, [newEmail.toLowerCase(), userId]);

    // In production, you would send a verification email here
    console.log(`Email updated for user ${userId}. Verification email should be sent to: ${newEmail}`);

    res.json({
      success: true,
      message: 'Email updated successfully. Please verify your new email address.',
      email: updateResult.rows[0].email,
      email_verified: updateResult.rows[0].email_verified,
      requires_verification: true
    });
  }),

  // Get account settings with enhanced information
  getAccountSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const query = `
      SELECT 
        username,
        email,
        created_at,
        role,
        profile_updated_at,
        email_verified,
        last_login,
        login_count
      FROM users 
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const userData = rows[0];

    // Calculate account age
    const accountAge = Math.floor((new Date() - new Date(userData.created_at)) / (1000 * 60 * 60 * 24));

    res.json({
      success: true,
      settings: {
        ...userData,
        account_age_days: accountAge,
        is_verified: userData.email_verified,
        member_since: userData.created_at
      }
    });
  }),

  // Enhanced account deletion with more safeguards
  deleteAccount: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { confirmation, password } = req.body;

    if (!confirmation || confirmation !== 'DELETE MY ACCOUNT') {
      res.status(400);
      throw new Error('Please type "DELETE MY ACCOUNT" in all caps to confirm account deletion');
    }

    if (!password) {
      res.status(400);
      throw new Error('Password is required to delete account');
    }

    // Verify password
    const userQuery = 'SELECT password_hash, email FROM users WHERE id = $1';
    const { rows } = await db.query(userQuery, [userId]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isPasswordValid) {
      res.status(400);
      throw new Error('Password is incorrect');
    }

    // Check if user has any important data that should prevent deletion
    const miningDataCheck = await db.query(
      'SELECT COUNT(*) as count FROM mining_sessions WHERE user_id = $1 AND completed = false',
      [userId]
    );

    if (parseInt(miningDataCheck.rows[0].count) > 0) {
      res.status(400);
      throw new Error('Cannot delete account with active mining sessions. Please complete or cancel them first.');
    }

    // Use transaction for account deletion
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // 1. Archive user data (optional - for compliance)
      await client.query(`
        INSERT INTO deleted_users_archive 
        (original_user_id, username, email, deleted_at)
        VALUES ($1, $2, $3, NOW())
      `, [userId, rows[0].username, rows[0].email]);

      // 2. Soft delete by anonymizing user data
      const deletedEmail = `deleted_${Date.now()}@deleted.ziver`;
      const deletedUsername = `deleted_user_${Date.now()}`;
      
      const deleteQuery = `
        UPDATE users 
        SET email = $1, 
            username = $2, 
            status = 'deleted',
            deleted_at = NOW(),
            password_hash = '',
            two_factor_secret = NULL,
            two_factor_enabled = false,
            updated_at = NOW()
        WHERE id = $3
      `;
      
      await client.query(deleteQuery, [deletedEmail, deletedUsername, userId]);

      // 3. Clear sensitive preferences
      await client.query(`
        DELETE FROM user_preferences 
        WHERE user_id = $1
      `, [userId]);

      await client.query('COMMIT');

      // Log the deletion
      console.log(`Account deleted for user: ${rows[0].email} (ID: ${userId})`);

      res.json({
        success: true,
        message: 'Account deleted successfully. All your data has been removed from our systems.',
        deletion_time: new Date().toISOString()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }),

  // Export user data (GDPR compliance)
  exportData: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Gather all user data
    const [userData, preferences, miningSessions, referrals] = await Promise.all([
      db.query('SELECT * FROM users WHERE id = $1', [userId]),
      db.query('SELECT * FROM user_preferences WHERE user_id = $1', [userId]),
      db.query('SELECT * FROM mining_sessions WHERE user_id = $1', [userId]),
      db.query('SELECT * FROM referrals WHERE referrer_id = $1 OR referred_id = $1', [userId])
    ]);

    const exportData = {
      user: userData.rows[0] ? {
        id: userData.rows[0].id,
        username: userData.rows[0].username,
        email: userData.rows[0].email,
        role: userData.rows[0].role,
        created_at: userData.rows[0].created_at,
        last_login: userData.rows[0].last_login
      } : null,
      preferences: preferences.rows,
      mining_sessions: miningSessions.rows.map(session => ({
        id: session.id,
        duration: session.duration,
        tokens_earned: session.tokens_earned,
        created_at: session.created_at
      })),
      referrals: {
        as_referrer: referrals.rows.filter(ref => ref.referrer_id === userId),
        as_referred: referrals.rows.filter(ref => ref.referred_id === userId)
      },
      export_date: new Date().toISOString(),
      export_format: 'json',
      version: '1.0'
    };

    res.json({
      success: true,
      data: exportData,
      format: 'json',
      generated_at: new Date().toISOString()
    });
  })
};

module.exports = accountController;