const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const db = require('../../config/db');
const TwoFactorUtils = require('../../utils/twoFactor');

// Enhanced logging function
const debugLog = (operation, userId, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    userId,
    message,
    data
  };
  console.log(`[2FA DEBUG] ${JSON.stringify(logEntry)}`);
};

const securityController = {
  // Change password with enhanced validation
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    debugLog('changePassword', userId, 'Starting password change', { hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });

    // Input validation
    if (!currentPassword || !newPassword) {
      debugLog('changePassword', userId, 'Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      debugLog('changePassword', userId, 'Password too short');
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Enhanced password strength validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!strongPasswordRegex.test(newPassword)) {
      debugLog('changePassword', userId, 'Password does not meet strength requirements');
      return res.status(400).json({
        success: false,
        message: 'Password must include uppercase, lowercase, number, and special character'
      });
    }

    // Prevent using the same password
    if (currentPassword === newPassword) {
      debugLog('changePassword', userId, 'New password same as current password');
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    const client = await db.getClient();
    
    try {
      // Get user with password hash
      const userQuery = 'SELECT password_hash, email FROM users WHERE id = $1';
      debugLog('changePassword', userId, 'Querying user from database');
      const { rows } = await client.query(userQuery, [userId]);

      if (rows.length === 0) {
        debugLog('changePassword', userId, 'User not found in database');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = rows[0];
      debugLog('changePassword', userId, 'User found', { email: user.email });

      // Verify current password
      debugLog('changePassword', userId, 'Verifying current password');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        debugLog('changePassword', userId, 'Current password incorrect');
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password with stronger salt
      debugLog('changePassword', userId, 'Hashing new password');
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and track change
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, 
            last_password_change = COALESCE(last_password_change, NOW()),
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, email
      `;

      debugLog('changePassword', userId, 'Updating password in database');
      await client.query(updateQuery, [hashedPassword, userId]);

      // Log password change
      debugLog('changePassword', userId, 'Password changed successfully');

      res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      debugLog('changePassword', userId, 'Error during password change', { error: error.message });
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during password change'
      });
    } finally {
      client.release();
    }
  }),

  // Enhanced 2FA with comprehensive error handling and logging
  toggleTwoFactor: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { enable, verificationCode, backupCode } = req.body;

    debugLog('toggleTwoFactor', userId, 'Starting 2FA toggle', { 
      enable, 
      hasVerificationCode: !!verificationCode, 
      hasBackupCode: !!backupCode 
    });

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get user's 2FA data safely
      const userQuery = `
        SELECT 
          id, 
          email,
          COALESCE(two_factor_enabled, false) as two_factor_enabled,
          two_factor_secret,
          two_factor_backup_codes
        FROM users 
        WHERE id = $1
      `;
      
      debugLog('toggleTwoFactor', userId, 'Querying user 2FA data');
      const userResult = await client.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        debugLog('toggleTwoFactor', userId, 'User not found');
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userResult.rows[0];
      debugLog('toggleTwoFactor', userId, 'User data retrieved', { 
        twoFactorEnabled: user.two_factor_enabled,
        hasSecret: !!user.two_factor_secret,
        hasBackupCodes: !!(user.two_factor_backup_codes && user.two_factor_backup_codes.length > 0)
      });

      if (enable) {
        // Enable 2FA
        debugLog('toggleTwoFactor', userId, 'Enabling 2FA flow');
        
        if (!verificationCode) {
          debugLog('toggleTwoFactor', userId, 'No verification code provided for enable');
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Verification code is required to enable 2FA'
          });
        }

        // Validate token format
        if (!/^\d{6}$/.test(verificationCode)) {
          debugLog('toggleTwoFactor', userId, 'Invalid verification code format', { code: verificationCode });
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Invalid verification code format. Must be 6 digits.'
          });
        }

        const secret = user.two_factor_secret;
        debugLog('toggleTwoFactor', userId, 'Checking 2FA secret', { hasSecret: !!secret });

        if (!secret) {
          debugLog('toggleTwoFactor', userId, 'No 2FA secret found for user');
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Two-factor authentication not properly set up. Please generate a new QR code.'
          });
        }

        // Verify the TOTP code
        debugLog('toggleTwoFactor', userId, 'Verifying TOTP token', { token: verificationCode });
        const isValid = TwoFactorUtils.verifyToken(secret, verificationCode);
        debugLog('toggleTwoFactor', userId, 'Token verification result', { isValid });

        if (!isValid) {
          debugLog('toggleTwoFactor', userId, 'Invalid TOTP token');
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Invalid verification code. Please try again.'
          });
        }

        // Enable 2FA and store backup codes
        debugLog('toggleTwoFactor', userId, 'Generating backup codes');
        const backupCodes = TwoFactorUtils.generateBackupCodes();
        const hashedBackupCodes = backupCodes.map(code => TwoFactorUtils.hashBackupCode(code));

        // Update user with 2FA enabled
        const updateQuery = `
          UPDATE users 
          SET two_factor_enabled = true, 
              two_factor_backup_codes = $1,
              updated_at = NOW()
          WHERE id = $2
          RETURNING id, two_factor_enabled
        `;

        debugLog('toggleTwoFactor', userId, 'Updating user with 2FA enabled');
        const updateResult = await client.query(updateQuery, [hashedBackupCodes, userId]);
        
        await client.query('COMMIT');
        debugLog('toggleTwoFactor', userId, '2FA enabled successfully');

        res.json({
          success: true,
          message: 'Two-factor authentication enabled successfully',
          backupCodes: backupCodes,
          warning: 'Save these backup codes in a secure place. They will not be shown again.'
        });

      } else {
        // Disable 2FA
        debugLog('toggleTwoFactor', userId, 'Disabling 2FA flow');
        
        if (!verificationCode && !backupCode) {
          debugLog('toggleTwoFactor', userId, 'No verification method provided for disable');
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Verification code or backup code is required to disable 2FA'
          });
        }

        let isValid = false;
        let verificationMethod = '';

        if (verificationCode) {
          // Verify with TOTP code
          verificationMethod = 'TOTP';
          debugLog('toggleTwoFactor', userId, 'Verifying with TOTP code', { code: verificationCode });
          
          if (user.two_factor_secret) {
            isValid = TwoFactorUtils.verifyToken(user.two_factor_secret, verificationCode);
            debugLog('toggleTwoFactor', userId, 'TOTP verification result', { isValid });
          } else {
            debugLog('toggleTwoFactor', userId, 'No 2FA secret available for TOTP verification');
          }
        } else if (backupCode) {
          // Verify with backup code
          verificationMethod = 'Backup';
          debugLog('toggleTwoFactor', userId, 'Verifying with backup code');
          
          const hashedCodes = user.two_factor_backup_codes || [];
          debugLog('toggleTwoFactor', userId, 'Backup codes available', { count: hashedCodes.length });
          
          isValid = TwoFactorUtils.verifyBackupCode(hashedCodes, backupCode);
          debugLog('toggleTwoFactor', userId, 'Backup code verification result', { isValid });

          if (isValid) {
            // Remove used backup code
            debugLog('toggleTwoFactor', userId, 'Removing used backup code');
            const updatedCodes = hashedCodes.filter(code => 
              code !== TwoFactorUtils.hashBackupCode(backupCode)
            );

            const removeCodeQuery = `
              UPDATE users 
              SET two_factor_backup_codes = $1,
                  updated_at = NOW()
              WHERE id = $2
            `;
            await client.query(removeCodeQuery, [updatedCodes, userId]);
          }
        }

        if (!isValid) {
          debugLog('toggleTwoFactor', userId, 'Verification failed', { method: verificationMethod });
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            message: 'Invalid verification code or backup code'
          });
        }

        // Disable 2FA
        const updateQuery = `
          UPDATE users 
          SET two_factor_enabled = false, 
              two_factor_secret = NULL,
              two_factor_backup_codes = NULL,
              updated_at = NOW()
          WHERE id = $1
          RETURNING id, two_factor_enabled
        `;

        debugLog('toggleTwoFactor', userId, 'Disabling 2FA in database');
        await client.query(updateQuery, [userId]);
        await client.query('COMMIT');
        debugLog('toggleTwoFactor', userId, '2FA disabled successfully');

        res.json({
          success: true,
          message: 'Two-factor authentication disabled successfully'
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      debugLog('toggleTwoFactor', userId, 'Error during 2FA operation', { error: error.message });
      console.error('2FA toggle error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during 2FA operation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      client.release();
    }
  }),

  // Generate 2FA setup with enhanced error handling
  generateTwoFactorSetup: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userEmail = req.user.email;

    debugLog('generateTwoFactorSetup', userId, 'Starting 2FA setup generation', { email: userEmail });

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Generate a real secret
      debugLog('generateTwoFactorSetup', userId, 'Generating 2FA secret');
      const secret = TwoFactorUtils.generateSecret(userEmail);
      debugLog('generateTwoFactorSetup', userId, 'Secret generated', { secretLength: secret.base32.length });

      // Generate backup codes
      debugLog('generateTwoFactorSetup', userId, 'Generating backup codes');
      const backupCodes = TwoFactorUtils.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => TwoFactorUtils.hashBackupCode(code));
      debugLog('generateTwoFactorSetup', userId, 'Backup codes generated', { count: backupCodes.length });

      // Store the secret and backup codes temporarily
      const updateQuery = `
        UPDATE users 
        SET two_factor_secret = $1,
            two_factor_backup_codes = $2,
            updated_at = NOW()
        WHERE id = $3
      `;

      debugLog('generateTwoFactorSetup', userId, 'Storing secret and backup codes in database');
      await client.query(updateQuery, [secret.base32, hashedBackupCodes, userId]);

      // Generate QR code
      debugLog('generateTwoFactorSetup', userId, 'Generating QR code');
      let qrCodeUrl;
      try {
        qrCodeUrl = await TwoFactorUtils.generateQRCode(secret.otpauth_url);
        debugLog('generateTwoFactorSetup', userId, 'QR code generated successfully');
      } catch (error) {
        debugLog('generateTwoFactorSetup', userId, 'QR code generation failed', { error: error.message });
        console.error('QR code generation failed:', error);
        // Create a fallback QR code or error message
        qrCodeUrl = `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f3f4f6"/>
            <text x="100" y="100" font-family="Arial" font-size="12" text-anchor="middle" fill="#374151">
              Manual Entry Required: ${secret.base32}
            </text>
          </svg>
        `).toString('base64')}`;
      }

      await client.query('COMMIT');
      debugLog('generateTwoFactorSetup', userId, '2FA setup completed successfully');

      res.json({
        success: true,
        secret: secret.base32,
        qrCodeUrl: qrCodeUrl,
        manualEntryCode: secret.base32,
        otpauthUrl: secret.otpauth_url,
        backupCodes: backupCodes
      });

    } catch (error) {
      await client.query('ROLLBACK');
      debugLog('generateTwoFactorSetup', userId, 'Error during 2FA setup', { error: error.message });
      console.error('2FA setup generation error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate 2FA setup',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      client.release();
    }
  }),

  // Generate new backup codes
  generateBackupCodes: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    debugLog('generateBackupCodes', userId, 'Generating new backup codes');

    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Verify user has 2FA enabled safely
      const checkQuery = 'SELECT two_factor_enabled FROM users WHERE id = $1';
      debugLog('generateBackupCodes', userId, 'Checking 2FA status');
      const checkResult = await client.query(checkQuery, [userId]);

      if (checkResult.rows.length === 0) {
        debugLog('generateBackupCodes', userId, 'User not found');
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!checkResult.rows[0].two_factor_enabled) {
        debugLog('generateBackupCodes', userId, '2FA not enabled for user');
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication must be enabled to generate backup codes'
        });
      }

      // Generate new backup codes
      debugLog('generateBackupCodes', userId, 'Generating backup codes');
      const backupCodes = TwoFactorUtils.generateBackupCodes();
      const hashedBackupCodes = backupCodes.map(code => TwoFactorUtils.hashBackupCode(code));
      debugLog('generateBackupCodes', userId, 'Backup codes generated', { count: backupCodes.length });

      const updateQuery = `
        UPDATE users 
        SET two_factor_backup_codes = $1,
            updated_at = NOW()
        WHERE id = $2
      `;

      debugLog('generateBackupCodes', userId, 'Storing backup codes in database');
      await client.query(updateQuery, [hashedBackupCodes, userId]);
      await client.query('COMMIT');
      debugLog('generateBackupCodes', userId, 'Backup codes generated successfully');

      res.json({
        success: true,
        message: 'New backup codes generated successfully',
        backupCodes: backupCodes,
        warning: 'Save these new backup codes in a secure place. They will replace your old codes.'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      debugLog('generateBackupCodes', userId, 'Error generating backup codes', { error: error.message });
      console.error('Backup codes generation error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate backup codes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    } finally {
      client.release();
    }
  }),

  // Get security settings with safe column access
  getSecuritySettings: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    debugLog('getSecuritySettings', userId, 'Fetching security settings');

    try {
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
        debugLog('getSecuritySettings', userId, 'User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const settings = rows[0];
      debugLog('getSecuritySettings', userId, 'Security settings retrieved', { 
        twoFactorEnabled: settings.two_factor_enabled,
        emailVerified: settings.email_verified
      });

      // Calculate password age safely
      const passwordAge = settings.last_password_change 
        ? Math.floor((new Date() - new Date(settings.last_password_change)) / (1000 * 60 * 60 * 24))
        : null;

      // Security score calculation
      let securityScore = 0;
      if (settings.email_verified) securityScore += 25;
      if (settings.two_factor_enabled) securityScore += 50;
      if (passwordAge && passwordAge < 90) securityScore += 25;

      debugLog('getSecuritySettings', userId, 'Security score calculated', { score: securityScore });

      res.json({
        success: true,
        settings: {
          ...settings,
          password_age_days: passwordAge,
          security_score: securityScore,
          security_level: securityScore >= 75 ? 'Strong' : securityScore >= 50 ? 'Medium' : 'Weak'
        }
      });

    } catch (error) {
      debugLog('getSecuritySettings', userId, 'Error fetching security settings', { error: error.message });
      console.error('Get security settings error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to fetch security settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }),

  // Verify 2FA token (useful for login)
  verifyTwoFactor: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { token } = req.body;

    debugLog('verifyTwoFactor', userId, 'Verifying 2FA token', { hasToken: !!token });

    if (!token) {
      debugLog('verifyTwoFactor', userId, 'No token provided');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // Validate token format
    if (!/^\d{6}$/.test(token)) {
      debugLog('verifyTwoFactor', userId, 'Invalid token format', { token });
      return res.status(400).json({
        success: false,
        message: 'Invalid token format. Must be 6 digits.'
      });
    }

    try {
      // Get user's 2FA secret safely
      const secretQuery = 'SELECT two_factor_secret, two_factor_enabled FROM users WHERE id = $1';
      debugLog('verifyTwoFactor', userId, 'Querying user 2FA data');
      const secretResult = await db.query(secretQuery, [userId]);

      if (secretResult.rows.length === 0) {
        debugLog('verifyTwoFactor', userId, 'User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = secretResult.rows[0];
      debugLog('verifyTwoFactor', userId, 'User data retrieved', { 
        twoFactorEnabled: user.two_factor_enabled,
        hasSecret: !!user.two_factor_secret
      });

      if (!user.two_factor_enabled) {
        debugLog('verifyTwoFactor', userId, '2FA not enabled for user');
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication is not enabled for this user'
        });
      }

      if (!user.two_factor_secret) {
        debugLog('verifyTwoFactor', userId, 'No 2FA secret found');
        return res.status(400).json({
          success: false,
          message: 'Two-factor authentication not properly configured'
        });
      }

      // Verify the token
      debugLog('verifyTwoFactor', userId, 'Verifying TOTP token', { token });
      const isValid = TwoFactorUtils.verifyToken(user.two_factor_secret, token);
      debugLog('verifyTwoFactor', userId, 'Token verification result', { isValid });

      if (!isValid) {
        debugLog('verifyTwoFactor', userId, 'Invalid TOTP token');
        return res.status(400).json({
          success: false,
          message: 'Invalid verification token'
        });
      }

      debugLog('verifyTwoFactor', userId, 'Token verified successfully');
      res.json({
        success: true,
        message: 'Token verified successfully',
        verified: true
      });

    } catch (error) {
      debugLog('verifyTwoFactor', userId, 'Error during token verification', { error: error.message });
      console.error('2FA verification error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error during token verification',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }),

  // Check 2FA status
  getTwoFactorStatus: asyncHandler(async (req, res) => {
    const userId = req.user.id;

    debugLog('getTwoFactorStatus', userId, 'Checking 2FA status');

    try {
      const query = `
        SELECT 
          COALESCE(two_factor_enabled, false) as two_factor_enabled,
          two_factor_secret IS NOT NULL as has_secret
        FROM users 
        WHERE id = $1
      `;

      const { rows } = await db.query(query, [userId]);

      if (rows.length === 0) {
        debugLog('getTwoFactorStatus', userId, 'User not found');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const status = rows[0];
      debugLog('getTwoFactorStatus', userId, '2FA status retrieved', status);

      res.json({
        success: true,
        twoFactorEnabled: status.two_factor_enabled,
        hasSecret: status.has_secret,
        isConfigured: status.two_factor_enabled && status.has_secret
      });

    } catch (error) {
      debugLog('getTwoFactorStatus', userId, 'Error checking 2FA status', { error: error.message });
      console.error('Get 2FA status error:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to check 2FA status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  })
};

module.exports = securityController;