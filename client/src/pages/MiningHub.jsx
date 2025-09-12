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
          
          // Determine current state based on mining status
          if (status.canClaim) {
            setCurrentState(status.progress >= 0.8 ? 3 : 4);
          } else if (status.progress > 0) {
            setCurrentState(2);
          } else {
            setCurrentState(1);
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
      
      const status = await miningService.getMiningStatus();
      setMiningStatus(status);
      setCurrentState(4);
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
      // Call the start mining endpoint
      const result = await miningService.startMining();
      updateUser(result.userData);
      
      // Transition to mining state
      setCurrentState(2);
      
      // Start polling for mining progress
      const pollInterval = setInterval(async () => {
        try {
          const status = await miningService.getMiningStatus();
          setMiningStatus(status);
          
          if (status.canClaim) {
            clearInterval(pollInterval);
            setCurrentState(status.progress >= 0.8 ? 3 : 4);
          } else if (status.progress > 0.7) {
            setCurrentState(3); // Show ad state
          }
        } catch (error) {
          console.error('Polling error:', error);
          clearInterval(pollInterval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(pollInterval);
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
      {/* Status Bar */}
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
      </div>

export default MiningHub;