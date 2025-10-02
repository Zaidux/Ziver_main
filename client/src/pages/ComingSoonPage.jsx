import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ComingSoonPage.css';

const ComingSoonPage = ({ featureName = "this feature" }) => {
  const { user } = useAuth();
  const isAdminOrTester = user?.role === 'ADMIN' || user?.role === 'TESTER';

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
              <p>Launching in: <span className="countdown-timer">Q1 2024</span></p>
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