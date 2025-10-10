import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  Shield, 
  Lock, 
  Bell, 
  Globe,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import './SettingsPage.css';
import api from '../../../services/api';

const SettingsPage = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 2FA states
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [qrCodeData, setQrCodeData] = useState(null);

  // Notification states
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    security: true
  });

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load security settings
      const securityResponse = await api.get('/settings/security');
      if (securityResponse.data.success) {
        setTwoFactorEnabled(securityResponse.data.settings.two_factor_enabled || false);
      }

      // Load notification settings
      const notificationsResponse = await api.get('/settings/notifications');
      if (notificationsResponse.data.success) {
        setNotifications(notificationsResponse.data.settings);
      }

      // Load appearance settings
      const appearanceResponse = await api.get('/settings/appearance');
      if (appearanceResponse.data.success && appearanceResponse.data.settings.theme) {
        // Update theme context if different from current
        if (appearanceResponse.data.settings.theme !== theme) {
          toggleTheme(appearanceResponse.data.settings.theme);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  // Real API call for updating email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (email === user?.email) {
      setError('New email must be different from current email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.put('/settings/account/email', {
        newEmail: email,
        currentPassword: currentPassword // Require password for email change
      });

      if (response.data.success) {
        // Update user context
        updateUser({ ...user, email });
        setMessage(response.data.message);
        setEmail('');
        setCurrentPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real API call for changing password
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Basic password strength check
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!strongPassword.test(newPassword)) {
      setError('Password must include uppercase, lowercase, number, and special character');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.put('/settings/security/password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        setMessage(response.data.message);
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real API call for 2FA setup
  const handleGenerate2FASetup = async () => {
    try {
      const response = await api.get('/settings/security/two-factor/setup');
      if (response.data.success) {
        setQrCodeData(response.data);
        setShow2FASetup(true);
      }
    } catch (err) {
      setError('Failed to generate 2FA setup. Please try again.');
    }
  };

  // Real API call for toggling 2FA
  const handleToggle2FA = async () => {
    if (!twoFactorEnabled) {
      await handleGenerate2FASetup();
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/settings/security/two-factor', {
        enable: false
      });

      if (response.data.success) {
        setTwoFactorEnabled(false);
        setMessage(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Real API call for enabling 2FA with verification
  const handleSetup2FA = async (e) => {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/settings/security/two-factor', {
        enable: true,
        verificationCode: twoFactorCode
      });

      if (response.data.success) {
        setTwoFactorEnabled(true);
        setShow2FASetup(false);
        setTwoFactorCode('');
        setMessage(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Real API call for updating notifications
  const handleNotificationToggle = async (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    
    setNotifications(newNotifications);

    try {
      await api.put('/settings/notifications', newNotifications);
      // No message needed for instant toggle feedback
    } catch (err) {
      // Revert on error
      setNotifications(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
      console.error('Failed to update notification settings');
    }
  };

  // Real API call for updating theme
  const handleThemeChange = async (newTheme) => {
    toggleTheme(newTheme);
    
    try {
      await api.put('/settings/appearance/theme', { theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme preference');
    }
  };

  // Real API call for updating language
  const handleLanguageChange = async (language) => {
    try {
      const response = await api.put('/settings/appearance/language', { language });
      if (response.data.success) {
        setMessage(`Language changed to ${language}`);
      }
    } catch (err) {
      setError('Failed to update language preference');
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      {message && (
        <div className="success-message">
          <CheckCircle size={16} />
          {message}
        </div>
      )}

      {error && (
        <div className="error-message">
          <XCircle size={16} />
          {error}
        </div>
      )}

      <div className="settings-sections">
        {/* Appearance Settings */}
        <div className="settings-section">
          <h2>
            <Sun size={20} />
            Appearance
          </h2>
          <p className="section-description">
            Customize how Ziver looks on your device.
          </p>

          <div className="theme-toggle">
            <span className="theme-label">Theme</span>
            <div className="theme-options">
              <button
                className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                <Sun size={18} />
                Light
              </button>
              <button
                className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                <Moon size={18} />
                Dark
              </button>
              <button
                className={`theme-option ${theme === 'auto' ? 'active' : ''}`}
                onClick={() => handleThemeChange('auto')}
              >
                <Globe size={18} />
                Auto
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="language-selector">
            <span className="language-label">Language</span>
            <select 
              className="language-dropdown"
              onChange={(e) => handleLanguageChange(e.target.value)}
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
            </select>
          </div>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <h2>
            <Shield size={20} />
            Security
          </h2>
          <p className="section-description">
            Enhance your account security with these features.
          </p>

          {/* Two-Factor Authentication */}
          <div className="security-item">
            <div className="security-info">
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
              <span className={`security-status ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button
              className={`btn ${twoFactorEnabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggle2FA}
              disabled={loading}
            >
              {loading ? <Loader size={16} className="spinner" /> : twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </button>
          </div>

          {/* 2FA Setup Modal */}
          {show2FASetup && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Setup Two-Factor Authentication</h3>
                  <button 
                    className="close-button"
                    onClick={() => setShow2FASetup(false)}
                    disabled={loading}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p>Scan this QR code with your authenticator app:</p>
                  <div className="qr-placeholder">
                    {qrCodeData ? (
                      <img 
                        src={qrCodeData.qrCodeUrl} 
                        alt="QR Code for 2FA" 
                        className="qr-code"
                      />
                    ) : (
                      <div className="qr-simulation">
                        <Loader size={24} className="spinner" />
                        Generating QR Code...
                      </div>
                    )}
                  </div>
                  <p>Or enter this code manually: <strong>{qrCodeData?.manualEntryCode}</strong></p>
                  <p>Then enter the 6-digit code from your app:</p>
                  <form onSubmit={handleSetup2FA}>
                    <input
                      type="text"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="code-input"
                    />
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShow2FASetup(false)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || twoFactorCode.length !== 6}
                      >
                        {loading ? <Loader size={16} className="spinner" /> : 'Verify & Enable'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Password Change */}
          <div className="security-item">
            <div className="security-info">
              <h4>Change Password</h4>
              <p>Update your password regularly for better security</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-group password-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group password-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group password-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? <Loader size={16} className="spinner" /> : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Notifications Settings */}
        <div className="settings-section">
          <h2>
            <Bell size={20} />
            Notifications
          </h2>
          <p className="section-description">
            Choose what notifications you want to receive.
          </p>

          <div className="notification-settings">
            {Object.entries(notifications).map(([key, value]) => (
              <div key={key} className="notification-item">
                <div className="notification-info">
                  <h4>{key.charAt(0).toUpperCase() + key.slice(1)} Notifications</h4>
                  <p>Receive {key} notifications</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => handleNotificationToggle(key)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Account Settings */}
        <div className="settings-section">
          <h2>
            <Lock size={20} />
            Account
          </h2>

          {/* Email Change */}
          <form onSubmit={handleUpdateEmail} className="settings-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your new email"
                required
              />
            </div>

            <div className="form-group password-group">
              <label htmlFor="emailCurrentPassword">Current Password (required for email change)</label>
              <div className="password-input-wrapper">
                <input
                  type="password"
                  id="emailCurrentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password to confirm email change"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !email.trim() || email === user?.email || !currentPassword}
            >
              {loading ? <Loader size={16} className="spinner" /> : 'Update Email'}
            </button>
          </form>

          {/* Account Info */}
          <div className="account-info">
            <h4>Account Information</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Username:</span>
                <span className="info-value">{user?.username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Current Email:</span>
                <span className="info-value">{user?.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Account Created:</span>
                <span className="info-value">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Role:</span>
                <span className="info-value capitalize">{user?.role?.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;