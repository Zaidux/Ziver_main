import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from './Navbar';
import { 
  User, 
  Settings, 
  MessageCircle, 
  LogOut,
  ChevronUp,
  ChevronDown,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [navbarCollapsed, setNavbarCollapsed] = useState(false);
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

  const handleThemeToggle = () => {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    toggleTheme(nextTheme);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return Sun;
      case 'dark': return Moon;
      case 'auto': return Monitor;
      default: return Moon;
    }
  };

  const ThemeIcon = getThemeIcon();

  // Get user avatar or fallback to initial
  const getUserAvatar = () => {
    if (user?.avatar_url) {
      return (
        <img 
          src={user.avatar_url} 
          alt="Profile" 
          className="avatar-image"
        />
      );
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className={`app-container ${navbarCollapsed ? 'navbar-collapsed' : ''}`}>
      {/* Global Profile Dropdown in Header */}
      <header className="global-header">
        <div className="header-content">
          <div className="header-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ZIVER</span>
          </div>

          <div className="header-actions" ref={dropdownRef}>
            {user && (
              <div className="actions-container">
                {/* Theme Toggle Button */}
                <button 
                  onClick={handleThemeToggle}
                  className="theme-toggle-button"
                  title={`Current theme: ${theme}`}
                >
                  <ThemeIcon size={20} />
                </button>

                {/* Profile Dropdown */}
                <button 
                  onClick={handleProfileClick}
                  className="profile-dropdown-button global"
                >
                  <span className="profile-avatar">
                    {getUserAvatar()}
                  </span>
                  <span className="profile-arrow">▼</span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="profile-dropdown-menu global">
                    <div className="dropdown-user-info">
                      <div className="user-avatar">
                        {getUserAvatar()}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.username}</div>
                        <div className="user-email">{user.email}</div>
                        <div className="user-theme">
                          <ThemeIcon size={14} />
                          <span>Theme: {theme}</span>
                        </div>
                      </div>
                    </div>

                    <div className="dropdown-divider"></div>

                    <button 
                      className="dropdown-item"
                      onClick={() => handleMenuAction('profile')}
                    >
                      <User size={18} />
                      <span>Profile</span>
                    </button>
                    <button 
                      className="dropdown-item"
                      onClick={() => handleMenuAction('settings')}
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </button>
                    <button 
                      className="dropdown-item feedback"
                      onClick={() => handleMenuAction('feedback')}
                    >
                      <MessageCircle size={18} />
                      <span>Feedback</span>
                    </button>
                    
                    <div className="dropdown-divider"></div>
                    
                    <button 
                      className="dropdown-item logout"
                      onClick={() => handleMenuAction('logout')}
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="main-content">
        <Outlet />
      </div>

      {/* Navbar with collapse toggle */}
      <div className={`navbar-container ${navbarCollapsed ? 'collapsed' : ''}`}>
        <Navbar />
        <button 
          className="navbar-toggle"
          onClick={() => setNavbarCollapsed(!navbarCollapsed)}
          title={navbarCollapsed ? 'Show navigation' : 'Hide navigation'}
        >
          {navbarCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Layout;