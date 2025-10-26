import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Award, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  MessageCircle,
  Zap,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import './FeedbackManagement.css';

const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: ''
  });
  const [rewardData, setRewardData] = useState({
    zpReward: 0,
    sebReward: 0,
    adminNotes: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  const statusOptions = [
    { value: 'all', label: 'All Status', color: '#6B7280' },
    { value: 'pending', label: 'Pending', color: '#F59E0B' },
    { value: 'reviewed', label: 'Reviewed', color: '#3B82F6' },
    { value: 'in_progress', label: 'In Progress', color: '#8B5CF6' },
    { value: 'resolved', label: 'Resolved', color: '#10B981' },
    { value: 'rewarded', label: 'Rewarded', color: '#8B5CF6' },
    { value: 'closed', label: 'Closed', color: '#6B7280' }
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'suggestion', label: 'Suggestion', emoji: '💡' },
    { value: 'bug', label: 'Bug Report', emoji: '🐛' },
    { value: 'complaint', label: 'Complaint', emoji: '😠' },
    { value: 'feature', label: 'Feature Request', emoji: '🚀' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'low', label: 'Low', color: '#10B981' },
    { value: 'medium', label: 'Medium', color: '#F59E0B' },
    { value: 'high', label: 'High', color: '#EF4444' }
  ];

  useEffect(() => {
    loadFeedback();
    loadStats();
  }, [pagination.currentPage]);

  useEffect(() => {
    filterFeedback();
  }, [filters, feedback]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.priority !== 'all' && { priority: filters.priority })
      });

      console.log("📊 Loading feedback...");
      const response = await api.get(`/feedback/admin/all?${params}`);
      console.log("✅ Feedback response:", response);

      // Use response directly, not response.data
      setFeedback(response.feedback || []);
      setPagination({
        currentPage: response.pagination?.currentPage || 1,
        totalPages: response.pagination?.totalPages || 1,
        totalCount: response.pagination?.totalCount || 0
      });
    } catch (error) {
      console.error('❌ Error loading feedback:', error);
      setFeedback([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log("📈 Loading feedback stats...");
      const response = await api.get('/feedback/admin/stats');
      console.log("✅ Stats response:", response);
      // Use response directly, not response.data
      setStats(response.stats || {
        byStatus: { pending: 0, reviewed: 0, in_progress: 0, resolved: 0, rewarded: 0, closed: 0 },
        byType: { suggestion: 0, bug: 0, complaint: 0, feature: 0 },
        byPriority: { low: 0, medium: 0, high: 0 }
      });
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      // Set default stats if API fails
      setStats({
        byStatus: { pending: 0, reviewed: 0, in_progress: 0, resolved: 0, rewarded: 0, closed: 0 },
        byType: { suggestion: 0, bug: 0, complaint: 0, feature: 0 },
        byPriority: { low: 0, medium: 0, high: 0 }
      });
    }
  };

  const filterFeedback = () => {
    let filtered = [...feedback];

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchTerm) ||
        item.message?.toLowerCase().includes(searchTerm) ||
        item.username?.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredFeedback(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusUpdate = async (feedbackId, newStatus) => {
    try {
      console.log("🔄 Updating status...");
      await api.put(`/feedback/admin/${feedbackId}/status`, { status: newStatus });
      await loadFeedback();
      await loadStats();
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  const handleRewardSubmit = async () => {
    try {
      console.log("💰 Submitting reward...");
      await api.post(`/feedback/admin/${selectedFeedback.id}/reward`, rewardData);
      setShowRewardModal(false);
      setRewardData({ zpReward: 0, sebReward: 0, adminNotes: '' });
      await loadFeedback();
      await loadStats();
    } catch (error) {
      console.error('❌ Error rewarding user:', error);
    }
  };

  const openDetailModal = (item) => {
    setSelectedFeedback(item);
    setShowDetailModal(true);
  };

  const openRewardModal = (item) => {
    setSelectedFeedback(item);
    setShowRewardModal(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'reviewed': return <Eye size={16} />;
      case 'in_progress': return <TrendingUp size={16} />;
      case 'resolved': return <CheckCircle size={16} />;
      case 'rewarded': return <Award size={16} />;
      case 'closed': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getPriorityColor = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option?.color || '#6B7280';
  };

  const getFileIcon = (mimetype) => {
    if (mimetype?.startsWith('image/')) return '🖼️';
    if (mimetype?.includes('pdf')) return '📕';
    if (mimetype?.includes('word') || mimetype?.includes('document')) return '📄';
    if (mimetype?.includes('spreadsheet') || mimetype?.includes('excel')) return '📊';
    return '📎';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && feedback.length === 0) {
    return (
      <div className="feedback-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-management">
      {/* Header */}
      <div className="feedback-header">
        <h1>Feedback Management</h1>
        <p>Review user feedback and reward helpful contributions</p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <MessageCircle size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{pagination.totalCount || 0}</div>
              <div className="stat-label">Total Feedback</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.pending || 0}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rewarded">
              <Award size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.byStatus?.rewarded || 0}</div>
              <div className="stat-label">Rewarded</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon high-priority">
              <AlertTriangle size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.byPriority?.high || 0}</div>
              <div className="stat-label">High Priority</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search feedback..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={filters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.emoji} {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={filters.priority} 
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={loadFeedback} className="refresh-button">
          Refresh
        </button>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        {filteredFeedback.length === 0 ? (
          <div className="empty-state">
            <MessageCircle size={48} />
            <h3>No feedback found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          filteredFeedback.map(item => (
            <div key={item.id} className="feedback-item">
              <div className="feedback-main">
                <div className="feedback-header-info">
                  <h3 className="feedback-title">{item.title || 'No Title'}</h3>
                  <div className="feedback-meta">
                    <span className={`status-badge status-${item.status}`}>
                      {getStatusIcon(item.status)}
                      {statusOptions.find(s => s.value === item.status)?.label}
                    </span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(item.priority) }}
                    >
                      {item.priority}
                    </span>
                    <span className="type-badge">
                      {typeOptions.find(t => t.value === item.type)?.emoji}
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="feedback-preview">
                  {item.message && item.message.length > 150 
                    ? `${item.message.substring(0, 150)}...` 
                    : item.message || 'No message provided'
                  }
                </div>

                <div className="feedback-footer">
                  <div className="user-info">
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.username} className="user-avatar" />
                    ) : (
                      <div className="user-avatar-fallback">
                        {item.username?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="user-details">
                      <span className="username">{item.username || 'Unknown User'}</span>
                      <span className="email">{item.email || 'No email'}</span>
                    </div>
                  </div>

                  <div className="feedback-date">
                    {formatDate(item.created_at)}
                  </div>
                </div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className="attachments-preview">
                    <span className="attachments-count">
                      📎 {item.attachments.length} attachment(s)
                    </span>
                  </div>
                )}

                {item.zp_reward > 0 && (
                  <div className="reward-info">
                    <Zap size={14} />
                    <span>Rewarded: {item.zp_reward} ZP + {item.seb_reward || 0} SEB</span>
                  </div>
                )}
              </div>

              <div className="feedback-actions">
                <button 
                  onClick={() => openDetailModal(item)}
                  className="btn btn-secondary"
                >
                  <Eye size={16} />
                  View
                </button>

                {item.status !== 'rewarded' && item.status !== 'closed' && (
                  <button 
                    onClick={() => openRewardModal(item)}
                    className="btn btn-primary"
                  >
                    <Award size={16} />
                    Reward
                  </button>
                )}

                <div className="status-actions">
                  {statusOptions
                    .filter(opt => opt.value !== item.status && opt.value !== 'all')
                    .map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusUpdate(item.id, option.value)}
                        className="status-action-btn"
                        style={{ color: option.color }}
                      >
                        Mark as {option.label}
                      </button>
                    ))
                  }
                </div>
              </div>
            </div>
          ))
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

      {/* Detail Modal */}
      {showDetailModal && selectedFeedback && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>{selectedFeedback.title}</h2>
              <button 
                className="close-button"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Type:</strong>
                    <span className="type-badge">
                      {typeOptions.find(t => t.value === selectedFeedback.type)?.emoji}
                      {selectedFeedback.type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Priority:</strong>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(selectedFeedback.priority) }}
                    >
                      {selectedFeedback.priority}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span className={`status-badge status-${selectedFeedback.status}`}>
                      {getStatusIcon(selectedFeedback.status)}
                      {statusOptions.find(s => s.value === selectedFeedback.status)?.label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Submitted:</strong>
                    <span>{formatDate(selectedFeedback.created_at)}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Message</h3>
                <div className="message-content">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Attachments Section */}
              {selectedFeedback.attachments && selectedFeedback.attachments.length > 0 && (
                <div className="detail-section">
                  <h3>Attachments ({selectedFeedback.attachments.length})</h3>
                  <div className="attachments-grid">
                    {selectedFeedback.attachments.map((attachment, index) => (
                      <div key={index} className="attachment-item">
                        <a 
                          href={attachment.url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="attachment-link"
                        >
                          {attachment.mimetype?.startsWith('image/') ? (
                            <img 
                              src={attachment.url}
                              alt={attachment.filename}
                              className="attachment-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : (
                            <div className="file-placeholder">
                              <div className="file-icon">
                                {getFileIcon(attachment.mimetype)}
                              </div>
                              <span className="file-name">{attachment.filename}</span>
                            </div>
                          )}
                          <div className="file-placeholder" style={{display: 'none'}}>
                            <div className="file-icon">📄</div>
                            <span className="file-name">{attachment.filename}</span>
                          </div>
                        </a>
                        <div className="attachment-info">
                          <span className="attachment-name">{attachment.filename}</span>
                          <span className="attachment-size">
                            {(attachment.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <a 
                            href={attachment.url}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="download-link"
                            download={attachment.filename}
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeedback.admin_notes && (
                <div className="detail-section">
                  <h3>Admin Notes</h3>
                  <div className="admin-notes">
                    {selectedFeedback.admin_notes}
                  </div>
                </div>
              )}

              {selectedFeedback.zp_reward > 0 && (
                <div className="detail-section">
                  <h3>Reward Information</h3>
                  <div className="reward-details">
                    <div className="reward-amount">
                      <Zap size={20} />
                      <span>{selectedFeedback.zp_reward} ZP + {selectedFeedback.seb_reward || 0} SEB</span>
                    </div>
                    <div className="reward-date">
                      Rewarded on: {formatDate(selectedFeedback.rewarded_at)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {showRewardModal && selectedFeedback && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Reward User</h2>
              <button 
                className="close-button"
                onClick={() => setShowRewardModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="reward-info">
                <p>Rewarding <strong>{selectedFeedback.username}</strong> for their feedback:</p>
                <p className="feedback-preview">"{selectedFeedback.title}"</p>
              </div>

              <div className="form-group">
                <label>ZP Reward</label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={rewardData.zpReward}
                  onChange={(e) => setRewardData(prev => ({ 
                    ...prev, 
                    zpReward: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="Enter ZP amount"
                />
              </div>

              <div className="form-group">
                <label>SEB Points Reward</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={rewardData.sebReward}
                  onChange={(e) => setRewardData(prev => ({ 
                    ...prev, 
                    sebReward: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="Enter SEB points amount"
                />
              </div>

              <div className="form-group">
                <label>Admin Notes (Optional)</label>
                <textarea
                  value={rewardData.adminNotes}
                  onChange={(e) => setRewardData(prev => ({ 
                    ...prev, 
                    adminNotes: e.target.value 
                  }))}
                  placeholder="Add notes about why this feedback was rewarded..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRewardSubmit}
                  disabled={rewardData.zpReward === 0 && rewardData.sebReward === 0}
                  className="btn btn-primary"
                >
                  <Award size={16} />
                  Reward User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;