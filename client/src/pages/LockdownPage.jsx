import React from 'react';
import './LockdownPage.css';

const LockdownPage = () => {
  return (
    <div className="lockdown-container">
      <div className="lockdown-content">
        <div className="lockdown-icon">🚧</div>
        <h1 className="lockdown-title">System Under Maintenance</h1>
        <p className="lockdown-message">
          We're currently performing essential maintenance to improve your experience. 
          Please check back shortly.
        </p>
        <div className="lockdown-details">
          <p>🕒 Estimated completion: 30-60 minutes</p>
          <p>📞 Contact support if this persists</p>
        </div>
        <button 
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Check Status
        </button>
      </div>
    </div>
  );
};

export default LockdownPage;