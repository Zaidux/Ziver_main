import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="app-container">
      <div className="main-content">
        <Outlet />
      </div>
      <Navbar />
    </div>
  );
};

export default Layout;