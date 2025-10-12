const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const TwoFactorUtils = require('../../utils/twoFactor');

const securityController = {
  // Change password with enhanced validation
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword) {
      res.status(400);
      throw new Error('Current password and new password are required');
    }

    if (newPassword.length < 8) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long');
    }

    // Enhanced password strength validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!strongPasswordRegex.test(newPassword)) {
      res.status(400);
      throw new Error('Password must include uppercase, lowercase, number, and special character');
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      res.status(400);
      throw new Error('New password must be different from current password');
    }

    // Get user with password hash
    const userQuery = 'SELECT password_hash, email FROM users WHERE id = $1';
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

    // Hash new password with stronger salt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and track change - SAFE UPDATE
    const updateQuery = `
      UPDATE users 
      SET password_hash = $1, 
          last_password_change = COALESCE(last_password_change, NOW()),
          updated_at = NOW()
      WHERE id = $2
      RETURNING id, email
    `;

    await db.query(updateQuery, [hashedPassword, userId]);

    // Log password change
    console.log(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
      timestamp: new Date().toISOString()
    });
  }),

  // Enhanced 2FA with safe column access
  toggleTwoFactor: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { enable, verificationCode, backupCode } = req.body;

    if (enable) {
      // Enable 2FA
      if (!verificationCode) {
        res.status(400);
        throw new Error('Verification code is required to enable 2FA');
      }

      // Get user's 2FA secret safely
      const secretQuery = 'SELECT two_factor_secret FROM users WHERE id = $1';
      const secretResult = await db.query(secretQuery, [userId]);
      
      // Check if secret exists and is properly set
      if (secretResult.rows.length === 0) {
        res.status(404);
        throw new Error('User not found');
      }

      const secret = secretResult.rows[0].two_factor_secret;
      
      if (!secret) {
        res.status(400);
        throw new Error('Two-factor authentication not properly set up. Please generate a new QR code.');
      }

      // Verify the TOTP code
      const isValid = TwoFactorUtils.verifyToken(secret, verificationCode);
      
      if (!isValid) {
        res.status(400);
        throw new Error('Invalid verification code. Please try again.');
      }

      // Enable 2FA and store backup codes
      const backupCodes = TwoFactorUtils.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => TwoFactorUtils.hashBackupCode(code));

      // Safe update query that handles missing columns
      const updateQuery = `
        UPDATE users 
        SET two_factor_enabled = true, 
            two_factor_backup_codes = $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, two_factor_enabled
      `;
      
      const updateResult = await db.query(updateQuery, [hashedBackupCodes, userId]);

      res.json({
        success: true,
        message: 'Two-factor authentication enabled successfully',
        backupCodes: backupCodes, // Only returned once - user must save these
        warning: 'Save these backup codes in a secure place. They will not be shown again.'
      });

    } else {
      // Disable 2FA - require either verification code or backup code
      if (!verificationCode && !backupCode) {
        res.status(400);
        throw new Error('Verification code or backup code is required to disable 2FA');
      }

      let isValid = false;

      if (verificationCode) {
        // Verify with TOTP code
        const secretQuery = 'SELECT two_factor_secret FROM users WHERE id = $1';
        const secretResult = await db.query(secretQuery, [userId]);
        
        if (secretResult.rows.length > 0 && secretResult.rows[0].two_factor_secret) {
          const secret = secretResult.rows[0].two_factor_secret;
          isValid = TwoFactorUtils.verifyToken(secret, verificationCode);
        }
      } else if (backupCode) {
        // Verify with backup code - safely handle missing column
        const backupQuery = 'SELECT two_factor_backup_codes FROM users WHERE id = $1';
        const backupResult = await db.query(backupQuery, [userId]);
        
        if (backupResult.rows.length > 0) {
          const hashedCodes = backupResult.rows[0].two_factor_backup_codes || [];
          isValid = TwoFactorUtils.verifyBackupCode(hashedCodes, backupCode);
          
          if (isValid) {
            // Remove used backup code
            const updatedCodes = hashedCodes.filter(code => 
              code !== TwoFactorUtils.hashBackupCode(backupCode)
            );
            
            const removeCodeQuery = `
              UPDATE users 
              SET two_factor_backup_codes = $1,
                  updated_at = NOW()
              WHERE id = $2
            `;
            await db.query(removeCodeQuery, [updatedCodes, userId]);
          }
        }
      }

      if (!isValid) {
        res.status(400);
        throw new Error('Invalid verification code or backup code');
      }

      // Disable 2FA safely
      const updateQuery = `
        UPDATE users 
        SET two_factor_enabled = false, 
            two_factor_secret = NULL,
            two_factor_backup_codes = NULL,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, two_factor_enabled
      `;
      
      await db.query(updateQuery, [userId]);

      res.json({
        success: true,
        message: 'Two-factor authentication disabled successfully'
      });
    }
  }),

  // Generate 2FA setup with real QR code
  generateTwoFactorSetup: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Generate a real secret
    const secret = TwoFactorUtils.generateSecret(userEmail);

    // Store the secret temporarily (user hasn't verified yet)
    const updateQuery = `
      UPDATE users 
      SET two_factor_secret = $1,
          updated_at = NOW()
      WHERE id = $2
    `;

    await db.query(updateQuery, [secret.base32, userId]);

    // Generate QR code
    try {
      const qrCodeUrl = await TwoFactorUtils.generateQRCode(secret.otpauth_url);

      res.json({
        success: true,
        secret: secret.base32,
        qrCodeUrl: qrCodeUrl,
        manualEntryCode: secret.base32,
        otpauthUrl: secret.otpauth_url
      });
    } catch (error) {
      console.error('QR code generation failed:', error);
      res.status(500);
      throw new Error('Failed to generate QR code. Please try again.');
    }
  }),

  // Generate new backup codes
  generateBackupCodes: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Verify user has 2FA enabled safely
    const checkQuery = 'SELECT two_factor_enabled FROM users WHERE id = $1';
    const checkResult = await db.query(checkQuery, [userId]);

    if (checkResult.rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    if (!checkResult.rows[0].two_factor_enabled) {
      res.status(400);
      throw new Error('Two-factor authentication must be enabled to generate backup codes');
    }

    // Generate new backup codes
    const backupCodes = TwoFactorUtils.generateBackupCodes();
    const hashedBackupCodes = backupCodes.map(code => TwoFactorUtils.hashBackupCode(code));

    const updateQuery = `
      UPDATE users 
      SET two_factor_backup_codes = $1,
          updated_at = NOW()
      WHERE id = $2
    `;

    await db.query(updateQuery, [hashedBackupCodes, userId]);

    res.json({
      success: true,
      message: 'New backup codes generated successfully',
      backupCodes: backupCodes,
      warning: 'Save these new backup codes in a secure place. They will replace your old codes.'
    });
  }),

  // Get security settings with safe column access
  getSecuritySettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Safe query that only accesses columns that exist or provides defaults
    const query = `
      SELECT 
        id,
        email,
        COALESCE(two_factor_enabled, false) as two_factor_enabled,
        COALESCE(last_password_change, created_at) as last_password_change,
        COALESCE(login_attempts, 0) as login_attempts,
        COALESCE(last_login, created_at) as last_login,
        created_at,
        COALESCE(email_verified, false) as email_verified
      FROM users 
      WHERE id = $1
    `;

    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const settings = rows[0];

    // Calculate password age safely
    const passwordAge = settings.last_password_change 
      ? Math.floor((new Date() - new Date(settings.last_password_change)) / (1000 * 60 * 60 * 24))
      : null;

    // Security score calculation
    let securityScore = 0;
    if (settings.email_verified) securityScore += 25;
    if (settings.two_factor_enabled) securityScore += 50;
    if (passwordAge && passwordAge < 90) securityScore += 25;

    res.json({
      success: true,
      settings: {
        ...settings,
        password_age_days: passwordAge,
        security_score: securityScore,
        security_level: securityScore >= 75 ? 'Strong' : securityScore >= 50 ? 'Medium' : 'Weak'
      }
    });
  }),

  // Verify 2FA token (useful for login)
  verifyTwoFactor: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      res.status(400);
      throw new Error('Verification token is required');
    }

    // Get user's 2FA secret safely
    const secretQuery = 'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1';
    const secretResult = await db.query(secretQuery, [userId]);
    
    if (secretResult.rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = secretResult.rows[0];

    if (!user.two_factor_enabled) {
      res.status(400);
      throw new Error('Two-factor authentication is not enabled for this user');
    }

    if (!user.two_factor_secret) {
      res.status(400);
      throw new Error('Two-factor authentication not properly configured');
    }

    // Verify the token
    const isValid = TwoFactorUtils.verifyToken(user.two_factor_secret, token);

    if (!isValid) {
      res.status(400);
      throw new Error('Invalid verification token');
    }

    res.json({
      success: true,
      message: 'Token verified successfully',
      verified: true
    });
  }),

  // Check 2FA status
  getTwoFactorStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const query = `
      SELECT 
        COALESCE(two_factor_enabled, false) as two_factor_enabled,
        two_factor_secret IS NOT NULL as has_secret
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
      twoFactorEnabled: rows[0].two_factor_enabled,
      hasSecret: rows[0].has_secret,
      isConfigured: rows[0].two_factor_enabled && rows[0].has_secret
    });
  })
};

module.exports = securityController;