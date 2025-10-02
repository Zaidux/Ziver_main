const express = require('express');
const { 
  getSystemStatus, 
  toggleLockdown, 
  updateComponentStatus 
} = require('../controllers/systemStatusController.js');
const { admin } = require('../middleware/adminMiddleware.js');

const router = express.Router();

router.get('/status', getSystemStatus);
router.post('/lockdown/toggle', admin, toggleLockdown);
router.post('/component/status', admin, updateComponentStatus);

module.exports = router;