import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { SUPPORTED_LANGUAGES, THEME_OPTIONS } from '../../constants/settings';
import { 
  Sun, 
  Moon, 
  Globe,
  ArrowLeft,
  Check,
  Monitor
} from 'lucide-react';
import './AppearanceSettings.css';

const AppearanceSettings = () => {
  const navigate = useNavigate();
  const { loading, error, updateSetting, getSetting, clearError } = useSettings();
  
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAppearanceSettings();
  }, []);

  const loadAppearanceSettings = async () => {
    const result = await getSetting('/settings/appearance');
    if (result.success) {
      setTheme(result.data.settings.theme || 'dark');
      setLanguage(result.data.settings.language || 'en');
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleThemeChange = async (newTheme) => {
    clearError();
    setTheme(newTheme);
    
    const result = await updateSetting('/settings/appearance/theme', { theme: newTheme });
    if (result.success) {
      showMessage('Theme updated successfully');
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    clearError();
    setLanguage(newLanguage);
    
    const result = await updateSetting('/settings/appearance/language', { language: newLanguage });
    if (result.success) {
      const languageName = SUPPORTED_LANGUAGES.find(lang => lang.code === newLanguage)?.name;
      showMessage(`Language changed to ${languageName}`);
    }
  };

  const getThemeIcon = (themeValue) => {
    switch (themeValue) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'auto': return Monitor;
      default: return Globe;
    }
  };

  return (
    <div className="appearance-settings">
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
          <Sun size={32} className="header-icon" />
          <div>
            <h1>Appearance</h1>
            <p>Customize how Ziver looks and feels</p>
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

      <div className="settings-content">
        {/* Theme Section */}
        <div className="settings-section">
          <h2>Theme Preferences</h2>
          <p className="section-description">
            Choose how Ziver looks. Auto mode follows your system preferences.
          </p>

          <div className="theme-grid">
            {THEME_OPTIONS.map(option => {
              const IconComponent = getThemeIcon(option.value);
              return (
                <div
                  key={option.value}
                  className={`theme-card ${theme === option.value ? 'active' : ''}`}
                  onClick={() => handleThemeChange(option.value)}
                >
                  <div className="theme-preview">
                    <div className="preview-header">
                      <div className="window-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                    <div className="preview-content">
                      <div className="preview-sidebar"></div>
                      <div className="preview-main">
                        <div className="preview-line short"></div>
                        <div className="preview-line medium"></div>
                        <div className="preview-line long"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="theme-info">
                    <IconComponent size={18} />
                    <span>{option.label}</span>
                    {theme === option.value && <Check size={16} className="check-icon" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Language Section */}
        <div className="settings-section">
          <h2>Language & Region</h2>
          <p className="section-description">
            Choose your preferred language for the interface.
          </p>

          <div className="language-section">
            <label htmlFor="language-select" className="language-label">
              Interface Language
            </label>
            <select 
              id="language-select"
              className="language-select"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={loading}
            >
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
            <p className="language-note">
              More languages will be added in future updates.
            </p>
          </div>
        </div>

        {/* Additional Appearance Options */}
        <div className="settings-section">
          <h2>Display Options</h2>
          <p className="section-description">
            Fine-tune your display preferences.
          </p>

          <div className="display-options">
            <div className="option-item">
              <div className="option-info">
                <h4>Reduced Motion</h4>
                <p>Minimize animations and transitions</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <h4>High Contrast</h4>
                <p>Increase color contrast for better visibility</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="option-item">
              <div className="option-info">
                <h4>Large Text</h4>
                <p>Increase interface text size</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;