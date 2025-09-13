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
          last_activity
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
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };