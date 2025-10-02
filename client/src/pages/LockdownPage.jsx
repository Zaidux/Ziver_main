import React from 'react';
import './LockdownPage.css';

const LockdownPage = () => {
  const handleContactSupport = () => {
    // Open email client with support email
    const email = 'ziverofficial567@gmail.com';
    const subject = 'System Lockdown Support Request';
    const body = 'Hello Ziver Support,\n\nI am experiencing issues with the system lockdown. Please assist me.\n\nThank you.';
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
          className="support-button"
          onClick={handleContactSupport}
        >
          Contact Support
        </button>
        <div className="support-email">
          Email: <a href="mailto:ziverofficial567@gmail.com">ziverofficial567@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

export default LockdownPage;