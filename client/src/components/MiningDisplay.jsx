import React, { useState, useEffect } from 'react';
import './MiningDisplay.css';

const MiningDisplay = ({ user, appSettings, miningStatus, onClaim, loading, error, currentState = 1 }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentZP, setCurrentZP] = useState(user?.zp_balance || 0);

  const miningCycleHours = parseFloat(appSettings?.MINING_CYCLE_HOURS || '4');
  const MINING_CYCLE_MS = miningCycleHours * 60 * 60 * 1000;
  const miningReward = parseInt(appSettings?.MINING_REWARD || '50', 10);

  // Get state data based on currentState prop (1-3)
  const getStateData = () => {
    switch (currentState) {
      case 1: // Idle - Ready to start
        return {
          title: "Ready to Mine",
          zpValue: user?.zp_balance || 0,
          isMining: false,
          progress: 0,
          buttonText: 'Start Mining',
          buttonEnabled: true
        };
      case 2: // Mining in progress
        return {
          title: "Mining...",
          zpValue: currentZP,
          isMining: true,
          progress: progress,
          buttonText: formatTime(timeLeft),
          buttonEnabled: false
        };
      case 3: // Ready to claim
        return {
          title: "Reward Ready!",
          zpValue: (user?.zp_balance || 0) + miningReward,
          isMining: false,
          progress: 1,
          buttonText: 'Claim Reward',
          buttonEnabled: true
        };
      default:
        return getStateData(1);
    }
  };

  const stateData = getStateData();

  useEffect(() => {
    // Update current ZP when user balance changes
    setCurrentZP(user?.zp_balance || 0);
  }, [user?.zp_balance]);

  useEffect(() => {
    // Use server-side mining status if available
    if (miningStatus) {
      setIsClaimable(miningStatus.canClaim);
      setTimeLeft(miningStatus.timeRemaining);
      setProgress(miningStatus.progress || 0);
      
      // Calculate current ZP during mining
      if (miningStatus.progress > 0 && miningStatus.progress < 1) {
        const earnedZP = Math.floor(miningReward * miningStatus.progress);
        setCurrentZP((user?.zp_balance || 0) + earnedZP);
      }
      return;
    }

    // Fallback to client-side calculation
    if (!user?.mining_session_start_time) {
      setIsClaimable(true);
      setTimeLeft(0);
      setProgress(0);
      setCurrentZP(user?.zp_balance || 0);
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(user.mining_session_start_time).getTime();
      const now = new Date().getTime();
      const timePassed = now - startTime;
      const remaining = MINING_CYCLE_MS - timePassed;
      const currentProgress = timePassed / MINING_CYCLE_MS;

      // Calculate real-time ZP earnings
      const earnedZP = Math.floor(miningReward * currentProgress);
      setCurrentZP((user?.zp_balance || 0) + earnedZP);

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsClaimable(true);
        setProgress(1);
        setCurrentZP((user?.zp_balance || 0) + miningReward);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        setIsClaimable(false);
        setProgress(currentProgress);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, MINING_CYCLE_MS, miningStatus, miningReward]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const calculateCircleProgress = () => {
    return progress * 283; // 2πr where r=45 (283 is circumference)
  };

  return (
    <div className="mining-display">
      {/* Header */}
      <div className="mining-header">
        <div className="header-title">{stateData.title}</div>
        <div className="header-subtitle">Active Miner</div>
      </div>

      {/* Central Circle with Progress */}
      <div className="mining-circle-container">
        <div className="mining-circle">
          <svg className="progress-ring" width="120" height="120">
            <circle
              className="progress-ring-circle"
              stroke="#00FF80"
              strokeWidth="3"
              fill="transparent"
              r="45"
              cx="60"
              cy="60"
              strokeDasharray="283"
              strokeDashoffset={283 - calculateCircleProgress()}
            />
          </svg>
          <div className="circle-content">
            <div className="zp-text">ZP</div>
            <div className="zp-value">{stateData.zpValue}</div>
            {stateData.isMining && (
              <div className="mining-progress">+{Math.floor(miningReward * progress)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        className={`mining-action-button ${!stateData.buttonEnabled ? 'disabled' : ''}`}
        onClick={onClaim}
        disabled={!stateData.buttonEnabled || loading}
      >
        {loading ? 'Processing...' : stateData.buttonText}
      </button>

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default MiningDisplay;