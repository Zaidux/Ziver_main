import React, { useState, useEffect } from 'react';
import './MiningDisplay.css';

const MiningDisplay = ({ user, onClaim, loading, error }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false);

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

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mining-section">
      <h2>Mining Hub</h2>
      <div className="mining-timer">
        {isClaimable ? "Ready to Claim!" : formatTime(timeLeft)}
      </div>
      {error && <p className="error-message">{error}</p>}
      <button
        className="mining-button"
        onClick={onClaim}
        disabled={!isClaimable || loading}
      >
        {/* THE FIX IS HERE: The button text is now generic. */}
        {loading ? 'Claiming...' : 'Claim Reward'}
      </button>
    </div>
  );
};

export default MiningDisplay;