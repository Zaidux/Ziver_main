import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './ComingSoonPage.css';

const ComingSoonPage = ({ featureName = "this feature", children }) => {
  const { user } = useAuth();
  const isAdminOrTester = user?.role === 'ADMIN' || user?.role === 'TESTER';
  const [showRealContent, setShowRealContent] = useState(false);

  // Check if admin previously enabled bypass for this feature
  useEffect(() => {
    if (isAdminOrTester) {
      const savedState = localStorage.getItem(`admin-bypass-${featureName}`);
      if (savedState === 'true') {
        setShowRealContent(true);
      }
    }
  }, [isAdminOrTester, featureName]);

  const toggleBypass = () => {
    const newState = !showRealContent;
    setShowRealContent(newState);
    localStorage.setItem(`admin-bypass-${featureName}`, newState.toString());
  };

  // If admin has enabled bypass AND there's children content, show the real page
  if (showRealContent && children) {
    return (
      <div className="admin-bypass-mode">
        <div className="admin-bypass-header">
          <div className="bypass-indicator">
            🔓 ADMIN MODE: Viewing {featureName}
          </div>
          <button 
            className="bypass-toggle-btn"
            onClick={toggleBypass}
          >
            Hide Real Content
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={`coming-soon-container ${isAdminOrTester ? 'admin-view' : ''}`}>
      <div className="coming-soon-content">
        <div className="coming-soon-icon">🚀</div>
        <h1 className="coming-soon-title">Coming Soon</h1>
        <p className="coming-soon-message">
          {featureName} is under development and will be available shortly!
        </p>

        {isAdminOrTester ? (
          <div className="admin-notice">
            <p className="admin-message">
              👋 Hello {user.role}! You can see this page because you have special access.
            </p>
            
            {/* Admin Bypass Button */}
            <div className="admin-bypass-controls">
              <button 
                className="bypass-toggle-btn"
                onClick={toggleBypass}
              >
                {showRealContent ? 'Hide Real Content' : 'Show Real Content'}
              </button>
              {children && (
                <p className="bypass-hint">
                  {showRealContent 
                    ? 'You are viewing the actual page content.' 
                    : 'Click above to view the actual page content.'
                  }
                </p>
              )}
            </div>

            <div className="feature-preview">
              <h3>Feature Preview:</h3>
              <p>This will be the {featureName.toLowerCase()} section with advanced functionality.</p>
              <ul>
                <li>✅ Advanced user dashboard</li>
                <li>✅ Real-time analytics</li>
                <li>✅ Management tools</li>
                <li>✅ Integration features</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="user-notice">
            <p className="user-message">
              We're working hard to bring you an amazing experience. Stay tuned!
            </p>
            <div className="countdown">
              <p>Launching in: <span className="countdown-timer">Q4 2025</span></p>
            </div>
          </div>
        )}

        <button 
          className="back-button"
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;