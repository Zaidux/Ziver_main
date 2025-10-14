const Transaction = require('../models/Transaction');

const transactionController = {
  // Get user's transaction history
  getUserTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
      
      const filters = {
        type: req.query.type || 'all',
        currency: req.query.currency || 'all',
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await Transaction.findByUserId(userId, page, limit, filters);

      return res.json({
        success: true,
        transactions: result.transactions,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });
    } catch (error) {
      console.error('❌ getUserTransactions error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history'
      });
    }
  },

  // Get transaction by ID
  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findById(id);
      
      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check if user owns this transaction
      if (transaction.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      return res.json({
        success: true,
        transaction
      });
    } catch (error) {
      console.error('❌ getTransactionById error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction details'
      });
    }
  },

  // Get user's balance summary
  getBalanceSummary: async (req, res) => {
    try {
      const userId = req.user.id;
      const summary = await Transaction.getUserBalanceSummary(userId);

      return res.json({
        success: true,
        summary
      });
    } catch (error) {
      console.error('❌ getBalanceSummary error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch balance summary'
      });
    }
  },

  // Get recent transactions for dashboard
  getRecentTransactions: async (req, res) => {
    try {
      const userId = req.user.id;
      const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));
      
      const transactions = await Transaction.getRecentTransactions(userId, limit);

      return res.json({
        success: true,
        transactions
      });
    } catch (error) {
      console.error('❌ getRecentTransactions error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent transactions'
      });
    }
  },

  // Get transaction statistics
  getTransactionStats: async (req, res) => {
    try {
      const userId = req.user.id;
      const period = req.query.period || 'month';
      
      const stats = await Transaction.getStats(userId, period);

      return res.json({
        success: true,
        stats,
        period
      });
    } catch (error) {
      console.error('❌ getTransactionStats error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction statistics'
      });
    }
  },

  // Create a transaction (mainly for internal use)
  createTransaction: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        type,
        amount,
        currency = 'ZP',
        description,
        referenceId = null,
        referenceType = null,
        status = 'completed',
        metadata = {}
      } = req.body;

      // Validate required fields
      if (!type || !amount || !description) {
        return res.status(400).json({
          success: false,
          message: 'Type, amount, and description are required'
        });
      }

      const transaction = await Transaction.create({
        userId,
        type,
        amount,
        currency,
        description,
        referenceId,
        referenceType,
        status,
        metadata
      });

      return res.status(201).json({
        success: true,
        message: 'Transaction recorded successfully',
        transaction
      });
    } catch (error) {
      console.error('❌ createTransaction error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction'
      });
    }
  }
};

module.exports = transactionController;