const asyncHandler = require('express-async-handler');

const admin = asyncHandler(async (req, res, next) => {
  // We assume the 'protect' middleware has already run and attached the user to the request.
  if (req.user && req.user.role === 'ADMIN') {
    // If the user exists and their role is 'ADMIN', proceed to the next function (the controller).
    next();
  } else {
    // If not, send a '403 Forbidden' error.
    // 403 is more appropriate than 401 here because the user is authenticated,
    // but they lack the necessary permissions for this resource.
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
});

module.exports = { admin };