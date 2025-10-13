const asyncHandler = require('express-async-handler');

const admin = asyncHandler(async (req, res, next) => {
  console.log('🔐 Admin middleware checking authorization...');

  if (!req.user) {
    console.log('❌ No user object in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role === 'ADMIN' || req.user.role === 'admin') {
    console.log('✅ Admin access granted for user:', req.user.id);
    next();
  } else {
    console.log('❌ Admin access denied for user:', req.user.id, 'role:', req.user.role);
    return res.status(403).json({
      success: false,
      message: 'Not authorized as an admin'
    });
  }
});

module.exports = { admin };