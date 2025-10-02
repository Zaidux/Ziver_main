import React from 'react';
import './LockdownPage.css';

const LockdownPage = () => {
  const handleContactSupport = () => {
  // Create a proper mailto link that works on all devices
  const email = 'ziverofficial567@gmail.com';
  const subject = 'System Lockdown Support Request - Ziver App';
  const body = 'Hello Ziver Support Team,\n\nI am contacting you regarding the system lockdown. Please assist me with the following:\n\n[Please describe your issue here]\n\nThank you.\n\nBest regards,\nZiver User';

  // Create a temporary link element to trigger the email client
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Try to open the email client
  const emailWindow = window.open(mailtoLink, '_blank');
  
  // Fallback: If popup is blocked, show instructions
  if (!emailWindow || emailWindow.closed || typeof emailWindow.closed === 'undefined') {
    alert(`Please email us at: ${email}\n\nWe'll get back to you as soon as possible!`);
  }
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
  Email: <span className="email-address" onClick={() => navigator.clipboard.writeText('ziverofficial567@gmail.com')}>
    ziverofficial567@gmail.com
  </span>
  <span className="copy-hint">(Tap to copy)</span>
</div>
      </div>
    </div>
  );
};

export default LockdownPage;