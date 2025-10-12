import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { validateForm, passwordStrength } from '../../utils/validation';
import { 
  Shield, 
  Lock, 
  Key,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader,
  AlertTriangle,
  Copy
} from 'lucide-react';
import './SecuritySettings.css';

// Frontend debug logging
const frontendDebugLog = (operation, message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    message,
    data
  };
  console.log(`[2FA FRONTEND DEBUG] ${JSON.stringify(logEntry)}`);
};

const SecuritySettings = () => {
  const navigate = useNavigate();
  const { loading, error, updateSetting, getSetting, clearError } = useSettings();

  const [message, setMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrengthInfo, setPasswordStrengthInfo] = useState({ strength: 0, label: '', class: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    frontendDebugLog('SecuritySettings', 'Component mounted');
    loadSecuritySettings();
  }, []);

  useEffect(() => {
    setPasswordStrengthInfo(passwordStrength(newPassword));
  }, [newPassword]);

  const loadSecuritySettings = async () => {
    frontendDebugLog('loadSecuritySettings', 'Loading security settings');
    try {
      const result = await getSetting('/settings/security');
      frontendDebugLog('loadSecuritySettings', 'Security settings loaded', { success: result.success });
      
      if (result.success) {
        setTwoFactorEnabled(result.data.settings.two_factor_enabled || false);
        frontendDebugLog('loadSecuritySettings', '2FA status set', { enabled: result.data.settings.two_factor_enabled });
      } else {
        frontendDebugLog('loadSecuritySettings', 'Failed to load security settings', { error: result.message });
      }
    } catch (error) {
      frontendDebugLog('loadSecuritySettings', 'Error loading security settings', { error: error.message });
    }
  };

  const showMessage = (msg) => {
    frontendDebugLog('showMessage', 'Displaying message', { message: msg });
    setMessage(msg);
    setTimeout(() => setMessage(''), 5000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    frontendDebugLog('handleChangePassword', 'Starting password change');
    clearError();
    setFormErrors({});

    const validation = validateForm({ newPassword, confirmPassword });
    if (!validation.isValid) {
      frontendDebugLog('handleChangePassword', 'Form validation failed', { errors: validation.errors });
      setFormErrors(validation.errors);
      return;
    }

    if (newPassword !== confirmPassword) {
      frontendDebugLog('handleChangePassword', 'Passwords do not match');
      setFormErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    frontendDebugLog('handleChangePassword', 'Calling updateSetting for password change');
    const result = await updateSetting(
      '/settings/security/password',
      { currentPassword, newPassword }
    );

    frontendDebugLog('handleChangePassword', 'Password change result', { success: result.success, error: result.error });

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrengthInfo({ strength: 0, label: '', class: '' });
      showMessage('Password changed successfully');
    }
  };

  const handleGenerate2FASetup = async () => {
    frontendDebugLog('handleGenerate2FASetup', 'Generating 2FA setup');
    clearError();
    const result = await getSetting('/settings/security/two-factor/setup');

    frontendDebugLog('handleGenerate2FASetup', '2FA setup result', { 
      success: result.success, 
      hasQrCode: !!result.data?.qrCodeUrl,
      hasBackupCodes: !!(result.data?.backupCodes && result.data.backupCodes.length > 0)
    });

    if (result.success) {
      setQrCodeData(result.data);
      setShow2FASetup(true);
      setBackupCodes(result.data.backupCodes || []);
      frontendDebugLog('handleGenerate2FASetup', '2FA setup modal opened');
    } else {
      frontendDebugLog('handleGenerate2FASetup', 'Failed to generate 2FA setup', { error: result.error });
    }
  };

  const handleToggle2FA = async () => {
    frontendDebugLog('handleToggle2FA', 'Toggling 2FA', { currentState: twoFactorEnabled });
    clearError();

    if (!twoFactorEnabled) {
      frontendDebugLog('handleToggle2FA', 'Enabling 2FA - generating setup');
      await handleGenerate2FASetup();
      return;
    }

    frontendDebugLog('handleToggle2FA', 'Disabling 2FA');
    const result = await updateSetting(
      '/settings/security/two-factor',
      { enable: false }
    );

    frontendDebugLog('handleToggle2FA', '2FA disable result', { success: result.success, error: result.error });

    if (result.success) {
      setTwoFactorEnabled(false);
      showMessage('Two-factor authentication disabled');
    }
  };

  const handleSetup2FA = async (e) => {
    e.preventDefault();
    frontendDebugLog('handleSetup2FA', 'Setting up 2FA with code', { codeLength: twoFactorCode.length });
    clearError();
    setFormErrors({});

    if (!twoFactorCode || twoFactorCode.length !== 6) {
      frontendDebugLog('handleSetup2FA', 'Invalid verification code', { code: twoFactorCode });
      setFormErrors({ twoFactorCode: 'Please enter a valid 6-digit code' });
      return;
    }

    frontendDebugLog('handleSetup2FA', 'Calling updateSetting to enable 2FA');
    const result = await updateSetting(
      '/settings/security/two-factor',
      { enable: true, verificationCode: twoFactorCode }
    );

    frontendDebugLog('handleSetup2FA', '2FA enable result', { 
      success: result.success, 
      error: result.error,
      hasBackupCodes: !!(result.data?.backupCodes && result.data.backupCodes.length > 0)
    });

    if (result.success) {
      setTwoFactorEnabled(true);
      setShow2FASetup(false);
      setTwoFactorCode('');
      if (result.data.backupCodes) {
        setBackupCodes(result.data.backupCodes);
      }
      showMessage('Two-factor authentication enabled successfully');
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    clearError();
    setFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const renderPasswordStrength = () => {
    if (!newPassword) return null;

    return (
      <div className="password-strength-indicator">
        <div className="strength-label">
          Password Strength: <span className={passwordStrengthInfo.class}>{passwordStrengthInfo.label}</span>
        </div>
        <div className="strength-bars">
          {[1, 2, 3, 4, 5].map(i => (
            <div 
              key={i} 
              className={`strength-bar ${i <= passwordStrengthInfo.strength ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const copyToClipboard = (text) => {
    frontendDebugLog('copyToClipboard', 'Copying to clipboard', { textLength: text.length });
    navigator.clipboard.writeText(text);
    showMessage('Copied to clipboard!');
  };

  return (
    <div className="security-settings">
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
          <Shield size={32} className="header-icon" />
          <div>
            <h1>Security</h1>
            <p>Manage your account security and authentication</p>
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

      <div className="security-content">
        {/* Two-Factor Authentication */}
        <div className="security-section">
          <div className="section-header">
            <Key size={24} />
            <div>
              <h2>Two-Factor Authentication</h2>
              <p>Add an extra layer of security to your account</p>
            </div>
          </div>

          <div className="security-status">
            <div className="status-info">
              <span className={`status-badge ${twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <p>
                {twoFactorEnabled 
                  ? 'Your account is protected with two-factor authentication' 
                  : 'Enable two-factor authentication for enhanced security'
                }
              </p>
            </div>
            <button
              className={`btn ${twoFactorEnabled ? 'btn-secondary' : 'btn-primary'}`}
              onClick={handleToggle2FA}
              disabled={loading}
            >
              {loading ? <Loader size={16} className="spinner" /> : twoFactorEnabled ? 'Disable' : 'Enable'} 2FA
            </button>
          </div>
        </div>

        {/* Password Change */}
        <div className="security-section">
          <div className="section-header">
            <Lock size={24} />
            <div>
              <h2>Change Password</h2>
              <p>Update your password for better security</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="security-form">
            <div className="form-group password-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={currentPassword}
                  onChange={handleInputChange(setCurrentPassword)}
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
              {formErrors.currentPassword && <span className="field-error">{formErrors.currentPassword}</span>}
            </div>

            <div className="form-group password-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={newPassword}
                  onChange={handleInputChange(setNewPassword)}
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
              {renderPasswordStrength()}
              {formErrors.newPassword && <span className="field-error">{formErrors.newPassword}</span>}
            </div>

            <div className="form-group password-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleInputChange(setConfirmPassword)}
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
              {formErrors.confirmPassword && <span className="field-error">{formErrors.confupCodes.length > 0 && (
                        <div className="backup-codes">
                          <h5>🔐 Backup Codes</h5>
                          <p className="backup-warning">
                            <AlertTriangle size={14} />
                            Save these codes in a secure place. Each can be used once if you lose access to your authenticator app.
                          </p>
                          <div className="codes-grid">
                            {backupCodes.map((code, index) => (
                              <div key={index} className="backup-code-item">
                                <code>{code}</code>
                                <button 
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => copyToClipboard(code)}
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettings;