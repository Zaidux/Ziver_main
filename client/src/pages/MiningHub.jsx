import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; // We will use axios directly here for simplicity
import './MiningHub.css';

const MiningHub = () => {
  const { user, logout, updateUser } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const MINING_CYCLE_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

  useEffect(() => {
    if (!user?.mining_session_start_time) {
      setIsClaimable(true);
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(user.mining_session_start_time).getTime();
      const now = new Date().getTime();
      const timePassed = now - startTime;
      const remaining = MINING_CYCLE_MS - timePassed;

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsClaimable(true);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        setIsClaimable(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

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
      updateUser(response.data); // Update global user state
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

      <div className="mining-section">
        <h2>Mining Hub</h2>
        <div className="mining-timer">{isClaimable ? "Ready to Claim!" : formatTime(timeLeft)}</div>
        {error && <p className="error-message">{error}</p>}
        <button
          className="mining-button"
          onClick={handleClaim}
          disabled={!isClaimable || loading}
        >
          {loading ? 'Claiming...' : 'Claim 50 ZP'}
        </button>
      </div>
    </div>
  );
};

export default MiningHub;
