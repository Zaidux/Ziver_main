const asyncHandler = require('express-async-handler');
const db = require('../config/db');
const TwoFactorUtils = require('../utils/twoFactor');

const twoFactorMiddleware = {
  // Middleware to check if 2FA is required for the route
  require2FA: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    // Check if user has 2FA enabled
    const query = 'SELECT two_factor_enabled FROM users WHERE id = $1';
    const { rows } = await db.query(query, [userId]);

    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }

    const user = rows[0];

    if (user.two_factor_enabled) {
      // Check if 2FA token is provided in header
      const twoFactorToken = req.headers['x-2fa-token'];
      
      if (!twoFactorToken) {
        res.status(401);
        throw new Error('Two-factor authentication token required');
      }

      // Get user's 2FA secret
      const secretQuery = 'SELECT two_factor_secret FROM users WHERE id = $1';
      const secretResult = await db.query(secretQuery, [userId]);
      
      if (secretResult.rows.length === 0 || !secretResult.rows[0].two_factor_secret) {
        res.status(400);
        throw new Error('Two-factor authentication not properly configured');
      }

      const secret = secretResult.rows[0].two_factor_secret;

      // Verify the token
      const isValid = TwoFactorUtils.verifyToken(secret, twoFactorToken);
      
      if (!isValid) {
        res.status(401);
        throw new Error('Invalid two-factor authentication token');
      }
    }

    next();
  }),

  // Middleware to check 2FA status (doesn't block, just adds to request)
  check2FAStatus: asyncHandler(async (req, res, next) => {
    const userId = req.user.id;

    const query = `
      SELECT two_factor_enabled, two_factor_secret 
      FROM users WHERE id = $1
    `;
    const { rows } = await db.query(query, [userId]);

    if (rows.length > 0) {
      req.user.twoFactorEnabled = rows[0].two_factor_enabled;
      req.user.twoFactorSecret = rows[0].two_factor_secret;
    }

    next();
  })
};

module.exports = twoFactorMiddleware;