const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const User = require('../../models/User');

const securityController = {
  // Change password
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long');
    }

    // Get user with password hash
    const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
    const { rows } = await db.query(userQuery, [userId]);
    
    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateQuery = 'UPDATE users SET password_hash = $1, last_password_change = NOW() WHERE id = $2';
    await db.query(updateQuery, [hashedPassword, userId]);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  }),

  // Enable/disable 2FA
  toggleTwoFactor: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { enable, verificationCode } = req.body;

    if (enable) {
      // Enable 2FA
      if (!verificationCode) {
        res.status(400);
        throw new Error('Verification code is required to enable 2FA');
      }

      // In a real implementation, you would verify the TOTP code here
      // For now, we'll accept any 6-digit code for testing
      if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
        res.status(400);
        throw new Error('Please enter a valid 6-digit verification code');
      }

      // Generate a simulated secret (in production, use speakeasy.generateSecret())
      const simulatedSecret = 'JBSWY3DPEHPK3PXP' + userId; // Make it unique per user

      const updateQuery = 'UPDATE users SET two_factor_enabled = true, two_factor_secret = $1 WHERE id = $2';
      await db.query(updateQuery, [simulatedSecret, userId]);

      res.json({
        success: true,
        message: 'Two-factor authentication enabled successfully'
      });
    } else {
      // Disable 2FA
      const updateQuery = 'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1';
      await db.query(updateQuery, [userId]);

      res.json({
        success: true,
        message: 'Two-factor authentication disabled'
      });
    }
  }),

  // Generate 2FA setup (QR code, secret)
  generateTwoFactorSetup: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email;
    
    // Generate a unique secret for this user
    const secret = 'JBSWY3DPEHPK3PXP' + userId; // Simulated secret
    
    // Create OTPAuth URL for QR code
    const otpauthUrl = `otpauth://totp/Ziver:${userEmail}?secret=${secret}&issuer=Ziver&algorithm=SHA1&digits=6&period=30`;
    
    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;

    res.json({
      success: true,
      secret: secret,
      qrCodeUrl: qrCodeUrl,
      manualEntryCode: secret
    });
  }),

  // Get security settings
  getSecuritySettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        two_factor_enabled,
        last_password_change,
        login_attempts,
        last_login
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
  })
};

module.exports = securityController;