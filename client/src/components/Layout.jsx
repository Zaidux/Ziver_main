import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleMenuAction = (action) => {
    setShowProfileDropdown(false);
    
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'feedback':
        // Open feedback modal or navigate to feedback page
        console.log('Open feedback');
        break;
      case 'logout':
        logout();
        break;
      default:
        break;
    }
  };

  return (
    <div className="app-container">
      {/* Global Profile Dropdown in Header */}
      <header className="global-header">
        <div className="header-content">
          <div className="header-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ZIVER</span>
          </div>
          
          <div className="header-actions" ref={dropdownRef}>
            {user && (
              <>
                <button 
                  onClick={handleProfileClick}
                  className="profile-dropdown-button global"
                >
                  <span className="profile-avatar">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                  <span className="profile-arrow">▼</span>
                </button>
                
                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="profile-dropdown-menu global">
                    <div className="dropdown-user-info">
                      <div className="user-avatar">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.username}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </div>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item"
                      onClick={() => handleMenuAction('profile')}
                    >
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => handleMenuAction('settings')}
                    >
                      <span className="dropdown-icon">⚙️</span>
                      Settings
                    </button>
                    <button 
                      className="dropdown-item feedback"
                      onClick={() => handleMenuAction('feedback')}
                    >
                      <span className="dropdown-icon">💬</span>
                      Feedback
                    </button>
                    <div className="dropdown-divider"></div>
                    <button 
                      className="dropdown-item logout"
                      onClick={() => handleMenuAction('logout')}
                    >
                      <span className="dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      <div className="main-content">
        <Outlet />
      </div>
      <Navbar />
    </div>
  );
};

export default Layout;