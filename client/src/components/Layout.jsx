import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import './Layout.css'; // We'll create this CSS file

const Layout = () => {
  const { user, systemStatus } = useAuth();
  const isLockdown = systemStatus?.lockdownMode;
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="app-container">
      {/* Admin Lockdown Banner */}
      {isLockdown && isAdmin && (
        <div className="admin-lockdown-banner">
          <div className="lockdown-indicator">
            <span className="lockdown-icon">🔒</span>
            <span className="lockdown-text">
              SYSTEM LOCKDOWN ACTIVE - You have admin access
            </span>
            <span className="lockdown-message">
              Regular users cannot access the system
            </span>
          </div>
        </div>
      )}
      
      <div className="main-content">
        <Outlet />
      </div>
      <Navbar />
    </div>
  );
};

export default Layout;