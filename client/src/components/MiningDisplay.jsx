import React, { useState, useEffect } from 'react';
import './MiningDisplay.css';

const MiningDisplay = ({ user, appSettings, miningStatus, onClaim, loading, error, currentState = 1 }) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isClaimable, setIsClaimable] = useState(false);
  const [progress, setProgress] = useState(0);

  const miningCycleHours = parseFloat(appSettings?.MINING_CYCLE_HOURS || '4');
  const MINING_CYCLE_MS = miningCycleHours * 60 * 60 * 1000;

  // Get state data based on currentState prop (1-4)
  const getStateData = () => {
    switch (currentState) {
      case 1: // Idle/Break Start
        return {
          breakNum: 5,
          zpValue: user?.zp_balance || 5000,
          miningTime: '00:00',
          isMining: false,
          progress: 0,
          buttonText: 'Start mining',
          buttonEnabled: true,
          hasAd: false
        };
      case 2: // Mining In Progress
        return {
          breakNum: 5,
          zpValue: user?.zp_balance || 5000,
          miningTime: '03:40',
          isMining: true,
          progress: 0.6,
          buttonText: 'Claim',
          buttonEnabled: false,
          hasAd: false
        };
      case 3: // Mining with Ad Incentive
        return {
          breakNum: 5,
          zpValue: user?.zp_balance || 5000,
          miningTime: '04:00',
          isMining: true,
          progress: 0.8,
          buttonText: null,
          buttonEnabled: true,
          hasAd: true
        };
      case 4: // Post-Break/Next Cycle
        return {
          breakNum: 6,
          zpValue: (user?.zp_balance || 5000) + 100,
          miningTime: '03:30',
          isMining: false,
          progress: 0,
          buttonText: 'Start mining',
          buttonEnabled: true,
          hasAd: false
        };
      default:
        return getStateData(1);
    }
  };

  const stateData = getStateData();
  const miningColor = stateData.isMining ? '#00FF80' : '#FFFFFF';

  useEffect(() => {
    // Use server-side mining status if available
    if (miningStatus) {
      setIsClaimable(miningStatus.canClaim);
      setTimeLeft(miningStatus.timeRemaining);
      setProgress(miningStatus.progress || 0);
      return;
    }

    // Fallback to client-side calculation
    if (!user?.mining_session_start_time) {
      setIsClaimable(true);
      setTimeLeft(0);
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      const startTime = new Date(user.mining_session_start_time).getTime();
      const now = new Date().getTime();
      const timePassed = now - startTime;
      const remaining = MINING_CYCLE_MS - timePassed;
      const currentProgress = timePassed / MINING_CYCLE_MS;

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsClaimable(true);
        setProgress(1);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
        setIsClaimable(false);
        setProgress(currentProgress);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user, MINING_CYCLE_MS, miningStatus]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderProgressBar = (progressValue) => {
    if (!stateData.isMining || progressValue === 0) return null;
    
    return (
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressValue * 100}%` }}
          />
        </div>
      </div>
    );
  };

  const renderAd = () => (
    <div className="ad-container">
      <div className="ad-image-placeholder">
        {/* Replace with actual image: <img src="/ad-woman.jpg" alt="Earn more" /> */}
        <div className="ad-image-content">
          <span className="ad-image-text">Ad Image: Woman in park</span>
        </div>
      </div>
      <div className="ad-text-container">
        <div className="ad-title">Earn 20% more</div>
        <div className="ad-subtitle">by watching ads</div>
        <div className="ad-logo">Faithpay</div>
      </div>
      <button className="ad-claim-button">
        Claim
      </button>
    </div>
  );

  return (
    <div className="mining-display">
      {/* Header */}
      <div className="mining-header">
        <div className="header-title">Break {stateData.breakNum}</div>
        <div className="header-subtitle">Dedicated miner</div>
      </div>

      {/* Central Circle */}
      <div className="mining-circle-container">
        <div className="mining-circle">
          <div className="zp-text">ZP</div>
          <div className="zp-value">#{stateData.zpValue}</div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mining-stats">
        <div className="stat-row">
          <div className="stat-label">Mining speed</div>
          <div className="stat-value" style={{ color: miningColor }}>
            {stateData.isMining ? stateData.miningTime : formatTime(timeLeft)}
          </div>
          {renderProgressBar(stateData.progress)}
        </div>

        <div className="stat-row">
          <div className="stat-label">Hashrate</div>
          <div className="stat-value">2023 CH/s</div>
        </div>

        <div className="stat-row">
          <div className="stat-label">Reward staked</div>
          <div className="stat-value">2023</div>
        </div>
      </div>

      {/* Ad Overlay (State 3) */}
      {stateData.hasAd && renderAd()}

      {/* Action Button */}
      {stateData.buttonText && (
        <button
          className={`mining-action-button ${!stateData.buttonEnabled ? 'disabled' : ''}`}
          onClick={onClaim}
          disabled={!stateData.buttonEnabled || loading}
        >
          {loading ? 'Processing...' : stateData.buttonText}
        </button>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default MiningDisplay;