import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div>
      <Navbar />
      <main>
        {/* The Outlet component renders the specific page (e.g., MiningHub or TasksPage) */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;