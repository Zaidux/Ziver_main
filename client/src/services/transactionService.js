import { api } from './api';

class TransactionService {
  /**
   * Get user's transaction history
   */
  async getTransactionHistory(token, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.type && filters.type !== 'all') params.append('type', filters.type);
      if (filters.currency && filters.currency !== 'all') params.append('currency', filters.currency);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'}/api/transactions?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction history: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Get user's balance summary
   */
  async getBalanceSummary(token) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'}/api/transactions/summary/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch balance summary: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching balance summary:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions for dashboard
   */
  async getRecentTransactions(token, limit = 10) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'}/api/transactions/recent/list?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recent transactions: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(token, period = 'month') {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'}/api/transactions/stats/overview?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction stats: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching transaction stats:', error);
      throw error;
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(token, transactionId) {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ziver-api.onrender.com'}/api/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error fetching transaction:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const transactionService = new TransactionService();
export default TransactionService;