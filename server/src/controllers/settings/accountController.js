const asyncHandler = require('express-async-handler');
const db = require('../../config/db');
const User = require('../../models/User');

const accountController = {
  // Update email
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

    // Verify current password
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const { rows } = await db.query(userQuery, [userId]);
    
    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isPasswordValid) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    // Check if email is already taken
    const existingUser = await User.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      res.status(400);
      throw new Error('Email is already taken');
    }

    // Update email (in production, you might want to send verification first)
    const updateQuery = 'UPDATE users SET email = $1 WHERE id = $2 RETURNING email';
    const updateResult = await db.query(updateQuery, [newEmail, userId]);

    res.json({
      success: true,
      message: 'Email updated successfully. Please verify your new email address.',
      email: updateResult.rows[0].email
    });
  }),

  // Get account settings
  getAccountSettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        username,
        email,
        created_at,
        role,
        profile_updated_at
      FROM users 
      WHERE id = $1
    `;
    
    const { rows } = await db.query(query, [userId]);
    
    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    res.json({
      success: true,
      settings: rows[0]
    });
  }),

  // Delete account
  deleteAccount: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { confirmation, password } = req.body;

    if (!confirmation || confirmation !== 'DELETE MY ACCOUNT') {
      res.status(400);
      throw new Error('Please type "DELETE MY ACCOUNT" to confirm');
    }

    if (!password) {
      res.status(400);
      throw new Error('Password is required to delete account');
    }

    // Verify password
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const { rows } = await db.query(userQuery, [userId]);
    
    const isPasswordValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isPasswordValid) {
      res.status(400);
      throw new Error('Password is incorrect');
    }

    // In production, you might want to soft delete or schedule deletion
    const deleteQuery = 'DELETE FROM users WHERE id = $1';
    await db.query(deleteQuery, [userId]);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  })
};

module.exports = accountController;