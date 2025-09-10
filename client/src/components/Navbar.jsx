import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout } = useAuth();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-brand">Ziver</NavLink>
      <div className="nav-links">
        <NavLink to="/">Mining Hub</NavLink>
        <NavLink to="/tasks">Tasks</NavLink>
        <NavLink to="/referrals">Referrals</NavLink> {/* Placeholder */}
      </div>
      <button onClick={logout} className="logout-button">Logout</button>
    </nav>
  );
};

export default Navbar;