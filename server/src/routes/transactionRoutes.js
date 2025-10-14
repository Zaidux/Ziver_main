const express = require('express');
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get user's transaction history
router.get('/', transactionController.getUserTransactions);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

// Get user's balance summary
router.get('/summary/balance', transactionController.getBalanceSummary);

// Get recent transactions for dashboard
router.get('/recent/list', transactionController.getRecentTransactions);

// Get transaction statistics
router.get('/stats/overview', transactionController.getTransactionStats);

// Create a new transaction (for internal use)
router.post('/', transactionController.createTransaction);

module.exports = router;