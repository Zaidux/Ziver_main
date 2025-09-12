import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout, user } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">
        <span className="brand-icon">⛏️</span>
        Ziver
      </NavLink>
      
      <div className="nav-links">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="nav-icon">🏠</span>
          Mining
        </NavLink>
        
        <NavLink 
          to="/tasks" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="nav-icon">📋</span>
          Tasks
        </NavLink>
        
        <NavLink 
          to="/referrals" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="nav-icon">👥</span>
          Referrals
        </NavLink>
        
        <NavLink 
          to="/upgrade" 
          className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
        >
          <span className="nav-icon">⚡</span>
          Upgrade
        </NavLink>
      </div>
      
      <div className="nav-user">
        <span className="user-welcome">Welcome, {user?.username}</span>
        <span className="user-zp">ZP: {user?.zp_balance || 0}</span>
        <button onClick={logout} className="logout-button">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;