import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const adminUser = JSON.parse(localStorage.getItem('admin_user'));
  const adminToken = localStorage.getItem('admin_token');

  // Check if user is authenticated AND is an admin
  if (!adminUser || !adminToken || adminUser.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;