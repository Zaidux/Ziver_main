const asyncHandler = require('express-async-handler');

const admin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

module.exports = { admin };