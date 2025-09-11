const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const db = require('../config/db'); // Use database directly since you're not using Mongoose

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token and decode it (includes role now)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database including their role
      const userResult = await db.query(
        'SELECT id, username, email, role FROM users WHERE id = $1',
        [decoded.id]
      );
      
      if (userResult.rows.length === 0) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      // Attach user data to request (including role)
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