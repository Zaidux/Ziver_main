import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { NOTIFICATION_TYPES } from '../../constants/settings';
import { 
  Bell, 
  Mail,
  Smartphone,
  Megaphone,
  Shield,
  ArrowLeft,
  Check,
  Loader
} from 'lucide-react';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { loading, error, updateSetting, getSetting, clearError } = useSettings();
  
  const [message, setMessage] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    security: true
  });

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    const result = await getSetting('/settings/notifications');
    if (result.success) {
      setNotifications(result.data.settings);
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleNotificationToggle = async (key) => {
    clearError();
    const newNotifications = { ...notifications, [key]: !notifications[key] };
    setNotifications(newNotifications);

    const result = await updateSetting(
      '/settings/notifications',
      newNotifications
    );

    if (result.success) {
      showMessage('Notification preferences updated');
    } else {
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const getNotificationIcon = (key) => {
    switch (key) {
      case 'email': return Mail;
      case 'push': return Smartphone;
      case 'marketing': return Megaphone;
      case 'security': return Shield;
      default: return Bell;
    }
  };

  return (
    <div className="notification-settings">
      {/* Header */}
      <div className="settings-header">
        <button 
          className="back-button"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft size={20} />
          Back to Settings
        </button>
        <div className="header-content">
          <Bell size={32} className="header-icon" />
          <div>
            <h1>Notifications</h1>
            <p>Choose how and when you want to be notified</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="success-message">
          <Check size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="notification-content">
        <div className="notification-section">
          <h2>Notification Preferences</h2>
          <p className="section-description">
            Control what types of notifications you receive and how you receive them.
          </p>

          <div className="notification-list">
            {Object.entries(NOTIFICATION_TYPES).map(([key, config]) => {
              const IconComponent = getNotificationIcon(key);
              return (
                <div key={key} className="notification-item">
                  <div className="notification-icon">
                    <IconComponent size={20} />
                  </div>
                  <div className="notification-info">
                    <h4>{config.label}</h4>
                    <p>{config.description}</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={notifications[key]}
                      onChange={() => handleNotificationToggle(key)}
                      disabled={loading}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="notification-section">
          <h2>Notification Channels</h2>
          <p className="section-description">
            Manage how you receive notifications across different platforms.
          </p>

          <div className="channels-list">
            <div className="channel-item">
              <div className="channel-info">
                <Smartphone size={24} />
                <div>
                  <h4>In-App Notifications</h4>
                  <p>Show notifications within the Ziver application</p>
                  <span className="channel-status active">Always enabled</span>
                </div>
              </div>
            </div>

            <div className="channel-item">
              <div className="channel-info">
                <Mail size={24} />
                <div>
                  <h4>Email Notifications</h4>
                  <p>Send notifications to your registered email address</p>
                  <span className={`channel-status ${notifications.email ? 'active' : 'inactive'}`}>
                    {notifications.email ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="channel-item">
              <div className="channel-info">
                <Bell size={24} />
                <div>
                  <h4>Browser Push</h4>
                  <p>Receive push notifications even when the app is closed</p>
                  <span className={`channel-status ${notifications.push ? 'active' : 'inactive'}`}>
                    {notifications.push ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="notification-section">
          <h2>Quiet Hours</h2>
          <p className="section-description">
            Set times when you don't want to be disturbed by notifications.
          </p>

          <div className="quiet-hours">
            <div className="quiet-hours-info">
              <div className="info-icon">🌙</div>
              <div className="info-content">
                <h4>Quiet Hours Feature</h4>
                <p>Coming soon! Set specific times to pause non-essential notifications.</p>
              </div>
            </div>
            <button className="btn btn-secondary" disabled>
              Configure Quiet Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
