const express = require('express');
const { 
  getSystemStatus, 
  toggleLockdown, 
  updateComponentStatus 
} = require('../controllers/systemStatusController.js');
const { admin } = require('../middleware/adminMiddleware.js');
const db = require('../config/db');

const router = express.Router();

// Existing routes
router.get('/status', getSystemStatus);
router.post('/lockdown/toggle', admin, toggleLockdown);
router.post('/component/status', admin, updateComponentStatus);

// NEW: Health check endpoints
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      database: 'connected',
      services: {
        api: 'operational',
        database: 'operational',
        telegram: process.env.TELEGRAM_BOT_TOKEN ? 'operational' : 'not_configured'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Simple ping endpoint for basic connectivity
router.get('/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;