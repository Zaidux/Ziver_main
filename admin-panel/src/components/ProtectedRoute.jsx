import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const user = JSON.parse(localStorage.getItem('admin_user'));
  return user && user.role === 'ADMIN' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;