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
  const [currentState, setCurrentState] = useState(1);

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

  return (
    <div className="mining-hub-container">
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
            <h2>SCS Score</h2>
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