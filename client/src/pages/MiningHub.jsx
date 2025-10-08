import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import miningService from '../services/miningService';
import MiningDisplay from '../components/MiningDisplay';
import './MiningHub.css';

const MiningHub = () => {
  // 1. Removed 'logout' from destructuring
  const { user, appSettings, updateUser } = useAuth(); 
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

      // The cleanup function for the effect/interval should be returned from the function that creates the interval, 
      // but in this setup, it's better to just let the component handle the logic, as the cleanup is internal to the interval logic.
      // We'll remove the unneeded return here, as setInterval is not in a useEffect.
    } catch (err) {
      // Improved error handling
      const errorMessage = err.message || 'Failed to start mining.';
      setError(errorMessage);
      console.error('Start mining error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // A small note on `handleStartMining`: since you're calling `setInterval` inside `handleStartMining`, 
  // you don't need the `return () => clearInterval(pollInterval);` line at the end of the function, 
  // as that's only used inside `useEffect` for cleanup. I've removed it in the code above.

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
          {/* Removed: <button onClick={logout} className="logout-button">Logout</button> */}
        </header>
        
        {/* The missing </div> was here! Your header needs to close, and then the rest of the content begins. */}
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
    </div>
  );
};

export default MiningHub;
