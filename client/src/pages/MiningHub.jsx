import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import miningService from '../services/miningService';
import MiningDisplay from '../components/MiningDisplay';
import './MiningHub.css';

const MiningHub = () => {
  const { user, appSettings, logout, updateUser, systemStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [miningStatus, setMiningStatus] = useState(null);
  const [currentState, setCurrentState] = useState(1);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const isLockdown = systemStatus?.lockdownMode;
  const isAdmin = user?.role === 'ADMIN';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load mining status on component mount and user change
  useEffect(() => {
    const loadMiningStatus = async () => {
      if (user) {
        try {
          const status = await miningService.getMiningStatus();
          setMiningStatus(status);
          updateUser(status.userData);

          // Determine current state based on mining status (now only 3 states)
          if (status.canClaim) {
            setCurrentState(3); // Ready to claim
          } else if (status.progress > 0) {
            setCurrentState(2); // Mining in progress
          } else {
            setCurrentState(1); // Ready to start
          }
        } catch (err) {
          console.error('Failed to load mining status:', err);
        }
      }
    };

    loadMiningStatus();
  }, [user, updateUser]);

  const handleClaim = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await miningService.claimReward();
      updateUser(result.userData);

      const status = await miningService.getMiningStatus();
      setMiningStatus(status);
      setCurrentState(1); // Return to ready state after claim
    } catch (err) {
      setError(err.message || 'An error occurred during claim.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMining = async () => {
    setLoading(true);
    setError('');
    try {
      // Call the start mining endpoint
      const result = await miningService.startMining();

      // Update user with the returned userData
      if (result.userData) {
        updateUser(result.userData);
      } else {
        // Fallback: if userData is not in response, refresh user data
        const status = await miningService.getMiningStatus();
        updateUser(status.userData);
      }

      // Transition to mining state
      setCurrentState(2);

      // Start polling for mining progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await miningService.getMiningStatus();
          setMiningStatus(status);

          if (status.canClaim) {
            clearInterval(pollInterval);
            setCurrentState(3); // Ready to claim
          }
        } catch (error) {
          console.error('Polling error:', error);
          clearInterval(pollInterval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
    } catch (err) {
      // Improved error handling
      const errorMessage = err.message || 'Failed to start mining.';
      setError(errorMessage);
      console.error('Start mining error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (currentState === 1) {
      handleStartMining();
    } else if (currentState === 3) {
      handleClaim();
    }
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleMenuAction = (action) => {
    setShowProfileDropdown(false);
    
    switch (action) {
      case 'profile':
        // Navigate to profile page (when implemented)
        console.log('Navigate to profile');
        break;
      case 'settings':
        // Navigate to settings page
        console.log('Navigate to settings');
        break;
      case 'feedback':
        // Open feedback modal
        console.log('Open feedback');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  return (
    <div className="mining-hub-container">
      <div className="mining-content">
        {/* Admin Lockdown Indicator */}
        {isLockdown && isAdmin && (
          <div className="mining-lockdown-indicator">
            <div className="lockdown-alert">
              <span className="lockdown-icon">🔒</span>
              <div className="lockdown-info">
                <strong>System Lockdown Active</strong>
                <span>Regular users cannot access the app</span>
              </div>
            </div>
          </div>
        )}

        <header className="mining-hub-header">
          <h1 className="hub-title">Mining Hub</h1>
          <div className="header-actions" ref={dropdownRef}>
            <button 
              onClick={handleProfileClick}
              className="profile-dropdown-button"
            >
              👤
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileDropdown && (
              <div className="profile-dropdown-menu">
                <button 
                  className="dropdown-item"
                  onClick={() => handleMenuAction('profile')}
                >
                  <span className="dropdown-icon">👤</span>
                  Profile
                </button>
                <button 
                  className="dropdown-item"
                  onClick={() => handleMenuAction('settings')}
                >
                  <span className="dropdown-icon">⚙️</span>
                  Settings
                </button>
                <button 
                  className="dropdown-item feedback"
                  onClick={() => handleMenuAction('feedback')}
                >
                  <span className="dropdown-icon">💬</span>
                  Feedback
                </button>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item logout"
                  onClick={() => handleMenuAction('logout')}
                >
                  <span className="dropdown-icon">🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="user-stats-grid">
          <div className="user-stat-card">
            <h2>ZP Balance</h2>
            <p className="stat-value">{user?.zp_balance || 0}</p>
          </div>
          <div className="user-stat-card">
            <h2>SEB Score</h2>
            <p className="stat-value">{user?.social_capital_score || 0}</p>
          </div>
          <div className="user-stat-card">
            <h2>Daily Streak</h2>
            <p className="stat-value">🔥 {user?.daily_streak_count || 0}</p>
          </div>
        </div>

        <MiningDisplay
          user={user}
          appSettings={appSettings}
          miningStatus={miningStatus}
          onClaim={handleAction}
          loading={loading}
          error={error}
          currentState={currentState}
        />
      </div>
    </div>
  );
};

export default MiningHub;