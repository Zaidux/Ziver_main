import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { transactionService } from '../services/transactionService';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  Users,
  Clock,
  Calendar,
  Coins,
  Sparkles
} from 'lucide-react';
import './TransactionHistoryPage.css';

const TransactionHistoryPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balanceSummary, setBalanceSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    currency: 'all',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  const transactionTypes = [
    { value: 'all', label: 'All Types', color: '#6B7280' },
    { value: 'zp_earn', label: 'ZP Earned', color: '#10B981', icon: TrendingUp },
    { value: 'zp_spend', label: 'ZP Spent', color: '#EF4444', icon: TrendingDown },
    { value: 'seb_earn', label: 'SEB Earned', color: '#8B5CF6', icon: Sparkles },
    { value: 'mining', label: 'Mining', color: '#F59E0B', icon: Zap },
    { value: 'task', label: 'Tasks', color: '#3B82F6', icon: Coins },
    { value: 'feedback', label: 'Feedback', color: '#EC4899', icon: Users }
  ];

  const currencyOptions = [
    { value: 'all', label: 'All Currencies' },
    { value: 'ZP', label: 'ZP Points' },
    { value: 'SEB', label: 'SEB Points' }
  ];

  useEffect(() => {
    loadTransactionHistory();
    loadBalanceSummary();
  }, [pagination.currentPage, filters]);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      const result = await transactionService.getTransactionHistory(user.token, {
        ...filters,
        page: pagination.currentPage,
        limit: 20
      });

      setTransactions(result.transactions || []);
      setPagination({
        currentPage: result.pagination?.currentPage || 1,
        totalPages: result.pagination?.totalPages || 1,
        totalCount: result.pagination?.totalCount || 0
      });
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadBalanceSummary = async () => {
    try {
      const result = await transactionService.getBalanceSummary(user.token);
      setBalanceSummary(result.summary || []);
    } catch (error) {
      console.error('Error loading balance summary:', error);
      setBalanceSummary([]);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getTransactionType = (type) => {
    return transactionTypes.find(t => t.value === type) || transactionTypes[0];
  };

  const getCurrencyIcon = (currency) => {
    switch (currency) {
      case 'ZP': return Zap;
      case 'SEB': return Sparkles;
      default: return Coins;
    }
  };

  const formatAmount = (amount, type) => {
    const sign = type.includes('earn') || type.includes('deposit') ? '+' : '-';
    return `${sign}${Math.abs(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBalanceForCurrency = (currency) => {
    const balance = balanceSummary.find(b => b.currency === currency);
    return balance ? balance.current_balance : 0;
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="transaction-history-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading transaction history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-history-page">
      {/* Header */}
      <div className="history-header">
        <div className="header-content">
          <h1>Transaction History</h1>
          <p>Track your ZP and SEB points journey</p>
        </div>
      </div>

      {/* Balance Summary */}
      {balanceSummary.length > 0 && (
        <div className="balance-summary">
          <h2>Current Balances</h2>
          <div className="balance-cards">
            {balanceSummary.map((balance) => {
              const CurrencyIcon = getCurrencyIcon(balance.currency);
              return (
                <div key={balance.currency} className="balance-card">
                  <div className="balance-icon">
                    <CurrencyIcon size={24} />
                  </div>
                  <div className="balance-info">
                    <div className="balance-amount">
                      {balance.current_balance?.toLocaleString() || 0}
                    </div>
                    <div className="balance-currency">{balance.currency} Points</div>
                    <div className="balance-stats">
                      <span className="earned">+{balance.total_earned?.toLocaleString() || 0}</span>
                      <span className="spent">-{balance.total_spent?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select 
            value={filters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            {transactionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={filters.currency} 
            onChange={(e) => handleFilterChange('currency', e.target.value)}
          >
            {currencyOptions.map(currency => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        <div className="date-filters">
          <input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
          />
          <input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
          />
        </div>

        <button onClick={loadTransactionHistory} className="refresh-button">
          Refresh
        </button>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {transactions.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <h3>No transactions found</h3>
            <p>Your transaction history will appear here</p>
          </div>
        ) : (
          transactions.map((transaction) => {
            const typeInfo = getTransactionType(transaction.type);
            const TypeIcon = typeInfo.icon || TrendingUp;
            const CurrencyIcon = getCurrencyIcon(transaction.currency);

            return (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-icon">
                  <TypeIcon size={20} />
                </div>

                <div className="transaction-details">
                  <div className="transaction-main">
                    <h3 className="transaction-description">
                      {transaction.description}
                    </h3>
                    <div className="transaction-meta">
                      <span className="transaction-type" style={{ color: typeInfo.color }}>
                        {typeInfo.label}
                      </span>
                      <span className="transaction-date">
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="transaction-amount">
                    <span 
                      className={`amount ${transaction.type.includes('earn') ? 'positive' : 'negative'}`}
                      style={{ color: typeInfo.color }}
                    >
                      {formatAmount(transaction.amount, transaction.type)}
                    </span>
                    <div className="transaction-currency">
                      <CurrencyIcon size={14} />
                      <span>{transaction.currency}</span>
                    </div>
                  </div>
                </div>

                {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                  <div className="transaction-metadata">
                    {transaction.metadata.taskTitle && (
                      <span className="metadata-item">Task: {transaction.metadata.taskTitle}</span>
                    )}
                    {transaction.metadata.feedbackTitle && (
                      <span className="metadata-item">Feedback: {transaction.metadata.feedbackTitle}</span>
                    )}
                    {transaction.metadata.duration && (
                      <span className="metadata-item">{transaction.metadata.duration} min</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={pagination.currentPage === 1}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            className="pagination-btn"
          >
            Previous
          </button>

          <span className="pagination-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <button
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;