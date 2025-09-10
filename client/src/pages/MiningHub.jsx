import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import miningService from '../services/miningService';
import MiningDisplay from '../components/MiningDisplay';
import './MiningHub.css';

const MiningHub = () => {
  const { user, appSettings, logout, updateUser } = useAuth(); // <-- Get appSettings from context
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setLoading(true);
    setError('');
    try {
      const updatedUserData = await miningService.claimReward();
      updateUser(updatedUserData);
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
        appSettings={appSettings} // <-- Pass appSettings down as a prop
        onClaim={handleClaim}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default MiningHub;