import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { validateForm } from '../../utils/validation';
import { 
  User, 
  Mail, 
  ArrowLeft,
  Check,
  Loader,
  AlertTriangle,
  Calendar,
  KeyRound
} from 'lucide-react';
import './AccountSettings.css';

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { loading, error, updateSetting, clearError } = useSettings();
  
  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    clearError();
    setFormErrors({});

    const validation = validateForm({ email, currentPassword });
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    if (email === user?.email) {
      setFormErrors({ email: 'New email must be different from current email' });
      return;
    }

    const result = await updateSetting(
      '/settings/account/email',
      { newEmail: email, currentPassword }
    );

    if (result.success) {
      updateUser({ ...user, email: result.data.email });
      setEmail('');
      setCurrentPassword('');
      showMessage('Email updated successfully');
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    clearError();
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="account-settings">
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
          <User size={32} className="header-icon" />
          <div>
            <h1>Account</h1>
            <p>Manage your account information and preferences</p>
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
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="account-content">
        {/* Email Change */}
        <div className="account-section">
          <div className="section-header">
            <Mail size={24} />
            <div>
              <h2>Email Address</h2>
              <p>Update your primary email address</p>
            </div>
          </div>

          <form onSubmit={handleUpdateEmail} className="account-form">
            <div className="form-group">
              <label htmlFor="email">New Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleInputChange(setEmail)}
                placeholder="Enter your new email"
                required
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currentPassword">
                <KeyRound size={16} />
                Current Password
              </label>
              <p className="field-description">Required to confirm email change</p>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={currentPassword}
                onChange={handleInputChange(setCurrentPassword)}
                placeholder="Enter current password"
                required
              />
              {formErrors.currentPassword && <span className="field-error">{formErrors.currentPassword}</span>}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !email.trim() || email === user?.email || !currentPassword}
            >
              {loading ? <Loader size={16} className="spinner" /> : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Account Information */}
        <div className="account-section">
          <div className="section-header">
            <User size={24} />
            <div>
              <h2>Account Information</h2>
              <p>Your account details and statistics</p>
            </div>
          </div>

          <div className="account-info-grid">
            <div className="info-item">
              <div className="info-label">
                <User size={16} />
                Username
              </div>
              <div className="info-value">{user?.username}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Mail size={16} />
                Current Email
              </div>
              <div className="info-value">{user?.email}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <Calendar size={16} />
                Account Created
              </div>
              <div className="info-value">{formatDate(user?.created_at)}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Role</div>
              <div className="info-value">
                <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                  {user?.role?.toLowerCase()}
                </span>
              </div>
            </div>

            {user?.telegram_username && (
              <div className="info-item">
                <div className="info-label">Telegram</div>
                <div className="info-value">@{user.telegram_username}</div>
              </div>
            )}
          </div>
        </div>

        {/* Account Actions */}
        <div className="account-section">
          <div className="section-header">
            <AlertTriangle size={24} />
            <div>
              <h2>Account Actions</h2>
              <p>Dangerous actions that affect your account</p>
            </div>
          </div>

          <div className="account-actions">
            <div className="action-item dangerous">
              <div className="action-info">
                <h4>Delete Account</h4>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button className="btn btn-danger" disabled>
                Delete Account
              </button>
            </div>

            <div className="action-item">
              <div className="action-info">
                <h4>Export Data</h4>
                <p>Download a copy of your personal data and account information.</p>
              </div>
              <button className="btn btn-secondary" disabled>
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
