import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import MiningDisplay from '../components/MiningDisplay'; // <-- IMPORT a new component
import './MiningHub.css';

const MiningHub = () => {
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClaim = async () => {
    setLoading(true);
    setError('');
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const response = await axios.post('https://ziver-api.onrender.com/api/mining/claim', {}, config);
      updateUser(response.data); // Update global user state with the new data
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
        onClaim={handleClaim}
        loading={loading}
        error={error}
      />
    </div>
  );
};

export default MiningHub;