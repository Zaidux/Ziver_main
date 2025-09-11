import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth(); // Destructure 'loading' from the context

  if (loading) {
    // We are still checking for the session, so show a loading indicator or nothing.
    // This prevents the redirect from happening before the user state is determined.
    return <div>Loading...</div>; 
    // Or you could return null; to render nothing while it loads
  }

  if (!user) {
    // If we're done loading and there's no user, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  // If loading is false and a user exists, show the protected content.
  return <Outlet />;
};

export default ProtectedRoute;
