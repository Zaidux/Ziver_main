import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar-large">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          <div className="profile-info">
            <h2>{user?.username}</h2>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{user?.zp_balance || 0}</span>
                <span className="stat-label">ZP Balance</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user?.social_capital_score || 0}</span>
                <span className="stat-label">SEB Score</span>
              </div>
              <div className="stat">
                <span className="stat-value">🔥 {user?.daily_streak_count || 0}</span>
                <span className="stat-label">Streak</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary">
              Edit Profile
            </button>
            <button className="action-btn secondary">
              View Statistics
            </button>
            <button className="action-btn secondary">
              Achievement
            </button>
          </div>
        </div>

        <div className="coming-soon-notice">
          <h3>🚧 Profile Features Coming Soon</h3>
          <p>
            We're working on enhanced profile features including detailed statistics, 
            achievement badges, and profile customization. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;