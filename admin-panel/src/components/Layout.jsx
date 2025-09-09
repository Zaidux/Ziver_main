import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Layout = () => (
  <div style={{ display: 'flex' }}>
    <nav style={{ width: '200px', borderRight: '1px solid #333', padding: '1rem' }}>
      <NavLink to="/">Dashboard</NavLink><br />
      <NavLink to="/tasks">Tasks</NavLink><br />
      <NavLink to="/settings">Settings</NavLink>
    </nav>
    <main style={{ flex: 1, padding: '1rem' }}>
      <Outlet />
    </main>
  </div>
);

export default Layout;
