import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout, user } = useAuth();

  return (
    <nav className="bottom-navbar">
      <NavLink 
        to="/" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">⛏️</span>
        <span className="nav-label">Mining</span>
      </NavLink>

      <NavLink 
        to="/tasks" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">📋</span>
        <span className="nav-label">Tasks</span>
      </NavLink>

      <NavLink 
        to="/referrals" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">👥</span>
        <span className="nav-label">Referrals</span>
      </NavLink>

      <NavLink 
        to="/upgrade" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">⚡</span>
        <span className="nav-label">Upgrade</span>
      </NavLink>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </NavLink>
    </nav>
  );
};

export default Navbar;