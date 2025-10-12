import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';
import { useTheme } from '../../context/ThemeContext';
import { SUPPORTED_LANGUAGES, THEME_OPTIONS } from '../../constants/settings';
import { 
  Sun, 
  Moon, 
  Globe,
  ArrowLeft,
  Check,
  Monitor,
  Smartphone
} from 'lucide-react';
import './AppearanceSettings.css';

const AppearanceSettings = () => {
  const navigate = useNavigate();
  const { loading, error, updateSetting, getSetting, clearError } = useSettings();
  const { theme: currentTheme, toggleTheme } = useTheme();
  
  const [theme, setTheme] = useState(currentTheme);
  const [language, setLanguage] = useState('en');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    loadAppearanceSettings();
  }, []);

  const loadAppearanceSettings = async () => {
    const result = await getSetting('/settings/appearance');
    if (result.success) {
      setTheme(result.data.settings.theme?.value || currentTheme);
      setLanguage(result.data.settings.language?.value || 'en');
    }
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleThemeChange = async (newTheme) => {
    clearError();
    setTheme(newTheme);
    
    // Update local state immediately for better UX
    toggleTheme(newTheme);

    // Save to server
    const result = await updateSetting('/settings/appearance/theme', { theme: newTheme });
    if (result.success) {
      showMessage('Theme updated successfully');
    } else {
      // Revert if server save failed
      toggleTheme(currentTheme);
      setTheme(currentTheme);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    clearError();
    setLanguage(newLanguage);

    const result = await updateSetting('/settings/appearance/language', { language: newLanguage });
    if (result.success) {
      const languageName = SUPPORTED_LANGUAGES.find(lang => lang.code === newLanguage)?.name;
      showMessage(`Language changed to ${languageName}`);
    } else {
      // Revert if server save failed
      setLanguage(language);
    }
  };

  const getThemeIcon = (themeValue) => {
    switch (themeValue) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'auto': return Monitor;
      case 'system': return Smartphone;
      default: return Globe;
    }
  };

  const getThemePreviewStyles = (themeValue) => {
    const isLight = themeValue === 'light';
    return {
      previewHeader: {
        background: isLight ? '#F1F5F9' : '#3A3A3A',
        borderBottom: `1px solid ${isLight ? '#E2E8F0' : '#404040'}`
      },
      previewSidebar: {
        background: isLight ? '#F8FAFC' : '#2A2A2A'
      },
      previewMain: {
        background: isLight ? '#FFFFFF' : '#1A1A1A'
      },
      previewLine: {
        background: isLight ? '#F1F5F9' : '#3A3A3A'
      },
      windowDots: {
        background: isLight ? '#CBD5E1' : '#666666'
      }
    };
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
              const previewStyles = getThemePreviewStyles(option.value);
              
              return (
                <div
                  key={option.value}
                  className={`theme-card ${theme === option.value ? 'active' : ''}`}
                  onClick={() => handleThemeChange(option.value)}
                >
                  <div className="theme-preview">
                    <div 
                      className="preview-header"
                      style={previewStyles.previewHeader}
                    >
                      <div className="window-dots">
                        <span style={{ background: previewStyles.windowDots.background }}></span>
                        <span style={{ background: previewStyles.windowDots.background }}></span>
                        <span style={{ background: previewStyles.windowDots.background }}></span>
                      </div>
                    </div>
                    <div className="preview-content">
                      <div 
                        className="preview-sidebar"
                        style={previewStyles.previewSidebar}
                      ></div>
                      <div 
                        className="preview-main"
                        style={previewStyles.previewMain}
                      >
                        <div 
                          className="preview-line short"
                          style={previewStyles.previewLine}
                        ></div>
                        <div 
                          className="preview-line medium"
                          style={previewStyles.previewLine}
                        ></div>
                        <div 
                          className="preview-line long"
                          style={previewStyles.previewLine}
                        ></div>
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

        {/* Current Theme Info */}
        <div className="current-theme-info">
          <div className="theme-badge">
            <span className="theme-label">Current Theme:</span>
            <span className="theme-value">{theme}</span>
          </div>
          {theme === 'auto' && (
            <div className="system-theme-info">
              <Monitor size={14} />
              <span>Following system preference</span>
            </div>
          )}
        </div>

        {/* Rest of your component remains the same */}
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