import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import miningService from '../services/miningService';
import MiningDisplay from '../components/MiningDisplay';
import './MiningHub.css';

const MiningHub = () => {
  const { user, appSettings, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [miningStatus, setMiningStatus] = useState(null);
  const [currentState, setCurrentState] = useState(1); // 1-4 for different states

  // Load mining status on component mount and user change
  useEffect(() => {
    const loadMiningStatus = async () => {
      if (user) {
        try {
          const status = await miningService.getMiningStatus();
          setMiningStatus(status);
          updateUser(status.userData);
          
          // Determine current state based on mining status
          if (status.canClaim) {
            setCurrentState(status.progress >= 0.8 ? 3 : 4); // Ad state or completed
          } else if (status.progress > 0) {
            setCurrentState(2); // Mining in progress
          } else {
            setCurrentState(1); // Idle
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
      const updatedUserData = await miningService.claimReward();
      updateUser(updatedUserData);
      
      // Refresh mining status after claim
      const status = await miningService.getMiningStatus();
      setMiningStatus(status);
      
      // Move to next state after successful claim
      setCurrentState(4); // Post-break state
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during claim.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartMining = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate starting mining - you'll need to implement this endpoint
      // const result = await miningService.startMining();
      // updateUser(result.userData);
      
      // For now, just transition to mining state
      setCurrentState(2); // Mining in progress
      
      // Set a timer to simulate mining progress
      const timer = setInterval(() => {
        setCurrentState(prev => {
          if (prev === 2) return 3; // Move to ad state after some time
          return prev;
        });
      }, 5000); // 5 seconds for demo

      return () => clearInterval(timer);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start mining.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = () => {
    if (currentState === 1 || currentState === 4) {
      handleStartMining();
    } else {
      handleClaim();
    }
  };

  return (
    <div className="mining-hub-container">
      {/* Status Bar (Simulated) */}
      <div className="status-bar">
        <div className="status-time">9:41</div>
        <div className="status-icons">
          <span className="status-icon">📶</span>
          <span className="status-icon">🔋</span>
        </div>
      </div>

      <div className="mining-content">
        <header className="mining-hub-header">
          <h1 className="hub-title">Mining Hub</h1>
          <button onClick={logout} className="logout-button">Logout</button>
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

        {/* Debug Controls (Remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="debug-controls">
            <h3>Debug State Controls:</h3>
            <div className="state-buttons">
              {[1, 2, 3, 4].map(state => (
                <button
                  key={state}
                  onClick={() => setCurrentState(state)}
                  className={`state-button ${currentState === state ? 'active' : ''}`}
                >
                  State {state}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-navigation">
        {[
          { icon: '🏠', label: 'Home' },
          { icon: '📋', label: 'Tasks' },
          { icon: '⚡', label: 'Upgrade' },
          { icon: '💳', label: 'Wallet' }
        ].map((item, index) => (
          <div key={index} className="nav-item">
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default MiningHub;