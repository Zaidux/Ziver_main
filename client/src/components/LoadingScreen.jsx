import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Loading your resources..." }) => {
  return (
    <div className="loading-screen">
      <div className="z-logo-container">
        <div className="z-logo">
          <div className="z-half z-half-1"></div>
          <div className="z-half z-half-2"></div>
          <div className="z-outline"></div>
        </div>
        <div className="loading-text">{message}</div>
      </div>
    </div>
  );
};

export default LoadingScreen;