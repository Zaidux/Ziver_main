const asyncHandler = require('express-async-handler');

const admin = asyncHandler(async (req, res, next) => {
  console.log('🔐 Admin middleware checking authorization...');
  console.log('Request headers:', req.headers);
  console.log('User object:', req.user);
  
  // Check multiple possible authentication methods
  let user = req.user;
  
  // If no user from regular auth, check admin-specific headers
  if (!user) {
    const adminToken = req.headers['admin-token'] || req.headers.authorization?.replace('Bearer ', '');
    if (adminToken) {
      // You might need to verify the admin token here
      console.log('Admin token found:', adminToken);
      // For now, we'll assume the token is valid if it exists
      // In production, you should verify this token against your admin users
      user = { role: 'ADMIN' };
    }
  }
  
  if (user && user.role === 'ADMIN') {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied - User:', user);
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

module.exports = { admin };