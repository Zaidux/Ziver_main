const securityController = require('./securityController');
const appearanceController = require('./appearanceController');
const notificationController = require('./notificationController');
const accountController = require('./accountController');

module.exports = {
  security: securityController,
  appearance: appearanceController,
  notifications: notificationController,
  account: accountController
};
