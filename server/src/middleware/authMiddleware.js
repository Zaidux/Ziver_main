const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const db = require('../config/db');

const protect = asyncHandler(async (req, res, next) => {
  let token;
// In authMiddleware.js - add this debug log
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔐 Token verification started');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add this debug log:
      console.log('👤 Decoded user ID (should be UUID):', decoded.id);
      console.log('👤 Decoded user ID type:', typeof decoded.id);

      // ... rest of your auth code
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔐 Token verification started');

      // Verify token and decode it
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if this is a temporary 2FA token
      if (decoded.twoFactorPending) {
        console.log('❌ 2FA required');
        return res.status(401).json({
          success: false,
          message: 'Two-factor authentication required. Please complete 2FA verification.'
        });
      }

      // Get user from database
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
        console.log('❌ User not found in database');
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found'
        });
      }

      // Attach complete user data to request
      req.user = userResult.rows[0];
      console.log('✅ Authentication successful for user:', req.user.id);
      next();
    } catch (error) {
      console.error('❌ Token verification error:', error.message);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
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
      return res.status(401).json({
        success: false,
        message: 'Two-factor authentication verification failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
});

module.exports = { protect, require2FAVerification };