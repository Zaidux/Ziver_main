import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { usePlatformDetection } from '../../../hooks/usePlatformDetection';
import { 
  User, 
  Award, 
  DollarSign, 
  Star, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Camera,
  Edit3,
  Save,
  X
} from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const { isTelegram, platform } = usePlatformDetection();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    telegram_username: '',
    twitter_username: '',
    linkedin_url: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  // Enhanced useEffect to properly sync form data with user data
  useEffect(() => {
    if (user) {
      setFormData({
        bio: user.bio || '',
        telegram_username: user.telegram_username || '',
        twitter_username: user.twitter_username || '',
        linkedin_url: user.linkedin_url || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user, isEditing]); // Added isEditing to dependency

  // Auto-detect Telegram username when in Telegram
  useEffect(() => {
    if (isTelegram && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
      const telegramUsername = tgUser.username;
      
      if (telegramUsername && !formData.telegram_username) {
        setFormData(prev => ({
          ...prev,
          telegram_username: telegramUsername
        }));
      }
    }
  }, [isTelegram, formData.telegram_username]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (1MB limit)
      if (file.size > 1024 * 1024) {
        setMessage('File size must be less than 1MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select an image file');
        return;
      }
      
      setLoading(true);
      setMessage('');
      try {
        await uploadAvatar(file);
        setMessage('Avatar updated successfully!');
      } catch (error) {
        setMessage('Error uploading avatar: ' + error.message);
      } finally {
        setLoading(false);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await updateProfile(formData);
      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      bio: user.bio || '',
      telegram_username: user.telegram_username || '',
      twitter_username: user.twitter_username || '',
      linkedin_url: user.linkedin_url || '',
      avatar_url: user.avatar_url || ''
    });
    setIsEditing(false);
    setMessage('');
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="spinner-large" />
        </div>
      </div>
    );
  }

  // Updated tier system based on your specifications
  const getTierInfo = (score) => {
    const sebScore = score || 0;
    if (sebScore >= 5800000) return { name: 'SUPREME', color: '#FF6B35' };
    if (sebScore >= 15000) return { name: 'ELITE', color: '#FF0000' };
    if (sebScore >= 1000) return { name: 'ADVANCED', color: '#FFA500' };
    return { name: 'BEGINNER', color: '#808080' };
  };

  const tierInfo = getTierInfo(user.social_capital_score || 0);

  // Platform-specific layout classes
  const layoutClass = platform === 'telegram' ? 'telegram-mini-app' : 
                     platform === 'mobile-web' ? 'mobile-web' : 'web-app';

  return (
    <div className={`page-container ${layoutClass}`}>
      {/* Profile Header */}
      <div
        className="profile-header-card"
        style={{
          background: `linear-gradient(135deg, ${tierInfo.color}10 0%, var(--card-bg) 100%)`,
          border: `1px solid ${tierInfo.color}30`,
        }}
      >
        <div className="profile-header-content">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div
              className="profile-avatar-large"
              style={{
                background: `linear-gradient(135deg, ${tierInfo.color}40, ${tierInfo.color}20)`,
                border: `3px solid ${tierInfo.color}`,
              }}
              onClick={isEditing ? handleAvatarClick : undefined}
            >
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Profile" className="avatar-image" />
              ) : (
                <User size={32} style={{ color: tierInfo.color }} />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {isEditing && (
              <button className="avatar-upload-btn" onClick={handleAvatarClick}>
                <Camera size={16} />
                Change Photo
              </button>
            )}
          </div>

          {/* User Info */}
          <div className="profile-info-main">
            <div className="profile-name-section">
              <h1>{user.username}</h1>
              {user.verified && (
                <CheckCircle size={20} className="verified-badge" title="Verified User" />
              )}
            </div>

            <p className="profile-email">{user.email}</p>

            {/* SCS Badge */}
            <div
              className="scs-badge"
              style={{
                background: `${tierInfo.color}20`,
                border: `2px solid ${tierInfo.color}`,
              }}
            >
              <Award size={18} style={{ color: tierInfo.color }} />
              <span className="scs-score">{user.social_capital_score || 0}</span>
              <span className="scs-tier" style={{ color: tierInfo.color }}>
                {tierInfo.name} TIER
              </span>
            </div>

            {/* Quick Stats */}
            <div className="profile-stats-quick">
              <div className="stat-quick">
                <span className="stat-value-quick">{user.zp_balance || 0}</span>
                <span className="stat-label-quick">ZP Balance</span>
              </div>
              <div className="stat-quick">
                <span className="stat-value-quick">🔥 {user.daily_streak_count || 0}</span>
                <span className="stat-label-quick">Streak</span>
              </div>
            </div>
          </div>

          {/* Edit/Save Controls */}
          <div className="profile-controls">
            {!isEditing ? (
              <button 
                className="btn btn-primary edit-profile-btn"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 size={16} />
                Edit Profile
              </button>
            ) : (
              <div className="edit-controls">
                <button 
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  <X size={16} />
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === "profile" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Details
        </button>
        <button className={`tab ${activeTab === "social" ? "tab-active" : ""}`} onClick={() => setActiveTab("social")}>
          Social Accounts
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && <OverviewTab user={user} tierInfo={tierInfo} />}
        {activeTab === "profile" && (
          <ProfileDetailsTab 
            formData={formData} 
            handleInputChange={handleInputChange} 
            isEditing={isEditing}
            user={user}
          />
        )}
        {activeTab === "social" && (
          <SocialAccountsTab 
            formData={formData} 
            handleInputChange={handleInputChange} 
            isEditing={isEditing}
            user={user}
            isTelegram={isTelegram}
          />
        )}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ user, tierInfo }) => {
  return (
    <div className="overview-content">
      <div className="stats-grid">
        <div className="stat-card stat-card-green">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">ZP Balance</div>
            <div className="stat-value">{user.zp_balance || 0}</div>
          </div>
        </div>

        <div className="stat-card stat-card-blue">
          <div className="stat-icon">
            <TrendingUp size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Social Capital Score</div>
            <div className="stat-value">{user.social_capital_score || 0}</div>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <Star size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Daily Streak</div>
            <div className="stat-value">🔥 {user.daily_streak_count || 0}</div>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon">
            <Clock size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Member Since</div>
            <div className="stat-value">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'Recent'}
            </div>
          </div>
        </div>
      </div>

      {/* Tier Progress */}
      <div className="card">
        <h3>Your Tier Progress</h3>
        <div className="tier-progress">
          <div className="tier-labels">
            <span>BEGINNER</span>
            <span>ADVANCED</span>
            <span>ELITE</span>
            <span>SUPREME</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${Math.min((user.social_capital_score || 0) / 5800000 * 100, 100)}%`,
                backgroundColor: tierInfo.color
              }}
            />
          </div>
          <div className="tier-ranges">
            <span>0-999</span>
            <span>1K-14K</span>
            <span>15K-5.7M</span>
            <span>5.8M+</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Profile Details Tab Component
const ProfileDetailsTab = ({ formData, handleInputChange, isEditing, user }) => {
  return (
    <div className="profile-details-content">
      <div className="card">
        <h3>Personal Information</h3>
        
        <div className="form-group">
          <label className="form-label">Bio</label>
          {isEditing ? (
            <>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="Tell us about yourself..."
                maxLength="500"
              />
              <div className="character-count">
                {formData.bio.length}/500 characters
              </div>
            </>
          ) : (
            <div className="display-field">
              {user.bio || 'No bio provided'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Username</label>
          <div className="display-field">
            {user.username}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <div className="display-field">
            {user.email}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Member Since</label>
          <div className="display-field">
            {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'Recent'}
          </div>
        </div>
      </div>
    </div>
  );
};

// Social Accounts Tab Component
const SocialAccountsTab = ({ formData, handleInputChange, isEditing, user, isTelegram }) => {
  const telegramUser = isTelegram && window.Telegram?.WebApp?.initDataUnsafe?.user;
  const detectedUsername = telegramUser?.username;

  return (
    <div className="social-accounts-content">
      <div className="card">
        <h3>Social Media Accounts</h3>
        <p className="section-description">
          Connect your social accounts to enhance your profile and discoverability.
        </p>

        <div className="form-group">
          <label className="form-label">
            Telegram Username
            {isTelegram && detectedUsername && (
              <span className="auto-detected-badge">Auto-detected from Telegram</span>
            )}
          </label>
          {isEditing ? (
            <div className="input-with-hint">
              <input
                type="text"
                name="telegram_username"
                value={formData.telegram_username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="@username"
              />
              {isTelegram && detectedUsername && !formData.telegram_username && (
                <div className="input-hint">
                  <span>Detected: @{detectedUsername}</span>
                  <button 
                    type="button" 
                    className="hint-btn"
                    onClick={() => setFormData(prev => ({ ...prev, telegram_username: detectedUsername }))}
                  >
                    Use detected
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="display-field">
              {user.telegram_username ? `@${user.telegram_username}` : 'Not connected'}
              {isTelegram && detectedUsername && !user.telegram_username && (
                <span className="detection-note">(Available: @{detectedUsername})</span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Twitter Username</label>
          {isEditing ? (
            <div className="input-with-prefix">
              <span className="input-prefix">@</span>
              <input
                type="text"
                name="twitter_username"
                value={formData.twitter_username}
                onChange={handleInputChange}
                className="form-input with-prefix"
                placeholder="username"
              />
            </div>
          ) : (
            <div className="display-field">
              {user.twitter_username ? `@${user.twitter_username}` : 'Not connected'}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">LinkedIn Profile</label>
          {isEditing ? (
            <input
              type="url"
              name="linkedin_url"
              value={formData.linkedin_url}
              onChange={handleInputChange}
              className="form-input"
              placeholder="https://linkedin.com/in/username"
            />
          ) : (
            <div className="display-field">
              {user.linkedin_url ? (
                <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="profile-link">
                  View LinkedIn Profile
                </a>
              ) : (
                'Not connected'
              )}
            </div>
          )}
        </div>

        {!isEditing && (
          <div className="edit-prompt">
            <p>Click "Edit Profile" to update your social accounts</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;