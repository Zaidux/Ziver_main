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

  // Load mining status on component mount and user change
  useEffect(() => {
    const loadMiningStatus = async () => {
      if (user) {
        try {
          const status = await miningService.getMiningStatus();
          setMiningStatus(status);
          // Update user data with latest from server
          updateUser(status.userData);
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
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during claim.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hub-container">
      <header className="hub-header">
        <h1>Welcome, {user?.username}</h1>
        <button onClick={logout} className="logout-button">Logout</button>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>ZP Balance</h2>
          <p>{user?.zp_balance || 0}</p>
        </div>
        <div className="stat-card">
          <h2>SEB Score</h2>
          <p>{user?.social_capital_score || 0}</p>
        </div>
        <div className="stat-card">
          <h2>Daily Streak</h2>
          <p>🔥 {user?.daily_streak_count || 0} Days</p>
        </div>
      </div>

      <MiningDisplay
        user={user}
        appSettings={appSettings}
        miningStatus={miningStatus} // Pass mining status
        onClaim={handleClaim}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default MiningHub;