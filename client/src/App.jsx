import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { usePlatformDetection } from './hooks/usePlatformDetection';
import api from './services/api';

// Layout and Component Imports
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MiningHub from './pages/MiningHub';
import TasksPage from './pages/TasksPage';
import ReferralsPage from './pages/ReferralsPage';
import LockdownPage from './pages/LockdownPage';
import ComingSoonPage from './pages/ComingSoonPage';
import LoadingScreen from './components/LoadingScreen';

// Component to handle platform-based routing
const PlatformRouter = () => {
  const { user, logout, systemStatus } = useAuth();
  const { platform, isWeb, isTelegram, isLoading } = usePlatformDetection();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLockdown, setIsLockdown] = useState(false);

  // Check lockdown status and heartbeat
  useEffect(() => {
    let intervalId;

    const checkLockdown = async () => {
      try {
        const response = await api.get('/system/status');
        const systemData = response.data;
        setIsLockdown(systemData.lockdownMode);

        // Redirect to lockdown page if system is locked down and user is not admin
        if (systemData.lockdownMode && user && user.role !== 'ADMIN' && location.pathname !== '/lockdown') {
          console.log('🔒 Redirecting to lockdown page');
          navigate('/lockdown', { replace: true });
        }

        // Redirect back to app if lockdown is lifted and user is on lockdown page
        if (!systemData.lockdownMode && location.pathname === '/lockdown') {
          console.log('🔓 Lockdown lifted, redirecting to app');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error checking system status:', error);
      }
    };

    const doHeartbeat = async () => {
      try {
        await api.post('/user/heartbeat');
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
        }
      }
    };

    if (user) {
      // Check lockdown status immediately
      checkLockdown();
      // Set up interval for subsequent checks
      const lockdownInterval = setInterval(checkLockdown, 10000); // Check every 10 seconds

      // Immediate heartbeat check
      doHeartbeat();
      // Set up interval for subsequent heartbeats
      intervalId = setInterval(doHeartbeat, 60000);

      return () => {
        clearInterval(lockdownInterval);
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, [user, logout, navigate, location]);

  // Show loading screen while detecting platform
  if (isLoading) {
    return <LoadingScreen message="I recognize you! Logging you in..." />;
  }

  console.log('Platform detection:', { platform, isWeb, isTelegram, user: !!user, path: location.pathname });

  // Show landing page only for web users who are NOT logged in AND NOT coming from Telegram
  // Also exclude specific auth routes
  const isAuthRoute = ['/login', '/register', '/lockdown'].includes(location.pathname);
  
  if (isWeb && !user && !isTelegram && !isAuthRoute) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/lockdown" element={<LockdownPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // For Telegram, mobile app, authenticated users, or specific auth routes, show the app
  return <AppRoutes user={user} isLockdown={isLockdown} />;
};

// Regular app routes
const AppRoutes = ({ user, isLockdown }) => (
  <Routes>
    {/* Public Routes */}
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/lockdown" element={<LockdownPage />} />

    {/* Show landing page at root for non-authenticated web users */}
    {!user && (
      <Route path="/" element={<LandingPage />} />
    )}

    {/* Protected Routes - Show Layout for all authenticated users */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        {/* Only show these routes if not in lockdown OR user is admin */}
        {(!isLockdown || user?.role === 'ADMIN') ? (
          <>
            <Route path="/" element={<MiningHub />} />
            <Route path="/mining" element={<MiningHub />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />

            {/* Updated Coming Soon routes with admin bypass */}
            <Route path="/job-marketplace" element={
              <ComingSoonPage featureName="Job Marketplace">
                <div>Real Job Marketplace Content Here</div>
              </ComingSoonPage>
            } />
            <Route path="/wallet" element={
              <ComingSoonPage featureName="Wallet">
                <div>Real Wallet Content Here</div>
              </ComingSoonPage>
            } />
            <Route path="/profile" element={
              <ComingSoonPage featureName="Profile">
                <div>Real Profile Content Here</div>
              </ComingSoonPage>
            } />
          </>
        ) : (
          // If in lockdown and not admin, show lockdown page within layout
          <Route path="*" element={<LockdownPage />} />
        )}
      </Route>
    </Route>

    {/* Fallback route for 404 errors */}
    <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
  </Routes>
);

function App() {
  return (
    <div className="app-container">
      <PlatformRouter />
    </div>
  );
}

export default App;