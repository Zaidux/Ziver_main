import React, { useState, useEffect } from 'react';
import { Send, Users, Bell, MessageCircle, History, Megaphone } from 'lucide-react';
import adminService from '../services/adminService';
import './TelegramAnnouncement.css';

const TelegramAnnouncements = () => {
  const [tabValue, setTabValue] = useState(0);
  const [announcementData, setAnnouncementData] = useState({
    message: '',
    announcementType: 'general',
    targetUsers: 'all'
  });
  const [userMessageData, setUserMessageData] = useState({
    telegramId: '',
    message: ''
  });
  const [stats, setStats] = useState(null);
  const [announcementHistory, setAnnouncementHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  useEffect(() => {
    loadStats();
    loadAnnouncementHistory();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminService.getTelegramStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAnnouncementHistory = async () => {
    try {
      const response = await adminService.getAnnouncementHistory();
      setAnnouncementHistory(response.announcements);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementData.message.trim()) {
      setAlert({ type: 'error', message: 'Please enter a message' });
      return;
    }

    setLoading(true);
    try {
      const response = await adminService.sendAnnouncement(announcementData);
      setAlert({ type: 'success', message: response.message });
      setAnnouncementData({ ...announcementData, message: '' });
      loadStats();
      loadAnnouncementHistory();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to send announcement' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendUserMessage = async () => {
    if (!userMessageData.telegramId || !userMessageData.message.trim()) {
      setAlert({ type: 'error', message: 'Please enter Telegram ID and message' });
      return;
    }

    setLoading(true);
    try {
      const response = await adminService.sendUserMessage(userMessageData);
      setAlert({ type: 'success', message: response.message });
      setUserMessageData({ telegramId: '', message: '' });
      loadAnnouncementHistory();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const announcementTypes = [
    { value: 'general', label: 'General', badge: 'badge-primary' },
    { value: 'security', label: 'Security', badge: 'badge-error' },
    { value: 'update', label: 'Update', badge: 'badge-info' },
    { value: 'promotion', label: 'Promotion', badge: 'badge-success' },
    { value: 'maintenance', label: 'Maintenance', badge: 'badge-warning' }
  ];

  const targetOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'active', label: 'Active Users (Last 7 days)' },
    { value: 'mining_enabled', label: 'Users with Mining Alerts' }
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="telegram-announcements-container">
      <div className="page-header">
        <h1 className="page-title">
          <Megaphone size={32} />
          Telegram Announcements
        </h1>
        <p className="page-subtitle">
          Send announcements and messages to your Telegram users
        </p>
      </div>

      {alert.message && (
        <div className={`alert alert-${alert.type}`}>
          {alert.message}
          <button 
            className="alert-close"
            onClick={() => setAlert({ type: '', message: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card stat-card-telegram">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Total Telegram Users</div>
              <div className="stat-value">{stats.total_users}</div>
            </div>
          </div>

          <div className="stat-card stat-card-success">
            <div className="stat-icon">
              <Bell size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">System Updates Enabled</div>
              <div className="stat-value">{stats.system_updates_enabled}</div>
            </div>
          </div>

          <div className="stat-card stat-card-warning">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Active Users (7 days)</div>
              <div className="stat-value">{stats.active_users}</div>
            </div>
          </div>

          <div className="stat-card stat-card-info">
            <div className="stat-icon">
              <History size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-label">Recent Announcements</div>
              <div className="stat-value">{stats.recent_announcements}</div>
            </div>
          </div>
        </div>
      )}

      <div className="announcement-card">
        <div className="announcement-tabs">
          <button
            className={`announcement-tab ${tabValue === 0 ? 'announcement-tab-active' : ''}`}
            onClick={() => handleTabChange(0)}
          >
            <Megaphone size={20} />
            Send Announcement
          </button>
          <button
            className={`announcement-tab ${tabValue === 1 ? 'announcement-tab-active' : ''}`}
            onClick={() => handleTabChange(1)}
          >
            <MessageCircle size={20} />
            Send to User
          </button>
          <button
            className={`announcement-tab ${tabValue === 2 ? 'announcement-tab-active' : ''}`}
            onClick={() => handleTabChange(2)}
          >
            <History size={20} />
            History
          </button>
        </div>

        <div className="tab-content">
          {/* Send Announcement Tab */}
          {tabValue === 0 && (
            <div>
              <div className="form-group">
                <label>Announcement Type</label>
                <select
                  className="form-control select"
                  value={announcementData.announcementType}
                  onChange={(e) => setAnnouncementData({
                    ...announcementData,
                    announcementType: e.target.value
                  })}
                >
                  {announcementTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Target Users</label>
                <select
                  className="form-control select"
                  value={announcementData.targetUsers}
                  onChange={(e) => setAnnouncementData({
                    ...announcementData,
                    targetUsers: e.target.value
                  })}
                >
                  {targetOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Announcement Message</label>
                <textarea
                  className="form-control textarea"
                  value={announcementData.message}
                  onChange={(e) => setAnnouncementData({
                    ...announcementData,
                    message: e.target.value
                  })}
                  placeholder="Enter your announcement message here..."
                  rows="6"
                />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Markdown formatting is supported
                </div>
              </div>

              <button
                className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
                onClick={handleSendAnnouncement}
                disabled={loading || !announcementData.message.trim()}
              >
                <Send size={20} />
                {loading ? <span className="loading-text">Sending</span> : 'Send Announcement'}
              </button>
            </div>
          )}

          {/* Send to User Tab */}
          {tabValue === 1 && (
            <div>
              <div className="form-group">
                <label>Telegram User ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={userMessageData.telegramId}
                  onChange={(e) => setUserMessageData({
                    ...userMessageData,
                    telegramId: e.target.value
                  })}
                  placeholder="Enter Telegram ID"
                />
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Find Telegram ID in user management
                </div>
              </div>

              <div className="form-group">
                <label>Message</label>
                <textarea
                  className="form-control textarea"
                  value={userMessageData.message}
                  onChange={(e) => setUserMessageData({
                    ...userMessageData,
                    message: e.target.value
                  })}
                  placeholder="Enter your message here..."
                  rows="6"
                />
              </div>

              <button
                className={`btn btn-primary btn-lg ${loading ? 'loading' : ''}`}
                onClick={handleSendUserMessage}
                disabled={loading || !userMessageData.telegramId || !userMessageData.message.trim()}
              >
                <MessageCircle size={20} />
                {loading ? <span className="loading-text">Sending</span> : 'Send Message'}
              </button>
            </div>
          )}

          {/* History Tab */}
          {tabValue === 2 && (
            <div>
              {announcementHistory.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Target</th>
                        <th>Sent</th>
                        <th>Failed</th>
                        <th>Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {announcementHistory.map((announcement) => {
                        const typeConfig = announcementTypes.find(t => t.value === announcement.announcement_type);
                        return (
                          <tr key={announcement.id}>
                            <td>{formatDate(announcement.created_at)}</td>
                            <td>
                              <span className={`badge ${typeConfig?.badge || 'badge-primary'}`}>
                                {announcement.announcement_type}
                              </span>
                            </td>
                            <td>{announcement.target_users}</td>
                            <td>{announcement.sent_count}</td>
                            <td>
                              {announcement.failed_count > 0 ? (
                                <span className="badge badge-error">
                                  {announcement.failed_count}
                                </span>
                              ) : (
                                announcement.failed_count
                              )}
                            </td>
                            <td>{announcement.admin_username}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <History size={48} className="empty-state-icon" />
                  <h3>No Announcements Yet</h3>
                  <p>Send your first announcement to see history here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramAnnouncements;