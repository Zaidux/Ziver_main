const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token and decode it
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if this is a temporary 2FA token
      if (decoded.twoFactorPending) {
        res.status(401);
        throw new Error('Two-factor authentication required. Please complete 2FA verification.');
      }

      // Get ALL user fields that might be needed by other controllers
      const userResult = await db.query(
        `SELECT 
          id, 
          username, 
          email, 
          role, 
          zp_balance, 
          social_capital_score, 
          daily_streak_count, 
          mining_session_start_time, 
          last_claim_time, 
          last_activity,
          two_factor_enabled
         FROM users WHERE id = $1`,
        [decoded.id]
      );

      if (userResult.rows.length === 0) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Attach complete user data to request
      req.user = userResult.rows[0];
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Token expired. Please login again.');
      }
      
      if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Invalid token.');
      }
      
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// NEW: Middleware to check if user has completed 2FA
const require2FAVerification = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if this is a temporary 2FA token
      if (decoded.twoFactorPending) {
        return res.status(401).json({
          success: false,
          message: 'Two-factor authentication required',
          twoFactorRequired: true
        });
      }

      next();
    } catch (error) {
      console.error('2FA verification middleware error:', error);
      res.status(401);
      throw new Error('Two-factor authentication verification failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect, require2FAVerification };