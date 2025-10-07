import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ 
  message = "Loading your resources...", 
  type = "fullscreen", 
  overlay = false 
}) => {
  const getContainerClass = () => {
    if (type === "inline") {
      return overlay ? "loading-inline-overlay" : "loading-inline";
    }
    return "loading-fullscreen";
  };

  return (
    <div className={getContainerClass()}>
      <div className="z-logo-container">
        <div className="z-logo">
          <div className="z-half z-half-1"></div>
          <div className="z-half z-half-2"></div>
          <div className="z-outline"></div>
          <div className="z-pulse"></div>
        </div>
        {message && <div className="loading-text">{message}</div>}
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;