import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import miningService from '../services/miningService'; // <-- 1. IMPORT THE NEW SERVICE
import MiningDisplay from '../components/MiningDisplay';
import './MiningHub.css';

const MiningHub = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setLoading(true);
    setError('');
    try {
      // 2. The API call is now much simpler!
      const updatedUserData = await miningService.claimReward();
      updateUser(updatedUserData); // Update global user state with the new data
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during claim.');
    } finally {
      setLoading(false);
    }
  };

  // The rest of your JSX remains exactly the same
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
        onClaim={handleClaim}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default MiningHub;