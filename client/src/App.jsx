import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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

// Profile-related imports
import SettingsPage from './pages/profile/pages/SettingsPage';
import ProfilePage from './pages/profile/pages/ProfilePage';

// Component to handle platform-based routing
const PlatformRouter = () => {
  const { user, logout, systemStatus, loading: authLoading } = useAuth();
  const { platform, isWeb, isTelegram, isLoading: platformLoading } = usePlatformDetection();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLockdown, setIsLockdown] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Combined loading state
  const isLoading = authLoading || platformLoading || isInitializing;

  // Initialize app and check system status
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check lockdown status
        const response = await api.get('/system/status');
        const systemData = response.data;
        setIsLockdown(systemData.lockdownMode);

        // Handle lockdown redirects
        if (systemData.lockdownMode && user && user.role !== 'ADMIN' && location.pathname !== '/lockdown') {
          console.log('🔒 Redirecting to lockdown page');
          navigate('/lockdown', { replace: true });
        }

        if (!systemData.lockdownMode && location.pathname === '/lockdown') {
          console.log('🔓 Lockdown lifted, redirecting to app');
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        // Small delay for better UX
        setTimeout(() => setIsInitializing(false), 1000);
      }
    };

    initializeApp();
  }, [user, navigate, location]);

  // Heartbeat and lockdown monitoring for authenticated users
  useEffect(() => {
    let intervalId;
    let lockdownInterval;

    const doHeartbeat = async () => {
      try {
        await api.post('/user/heartbeat');
      } catch (error) {
        if (error.response?.status === 401) {
          logout();
        }
      }
    };

    const monitorLockdown = async () => {
      try {
        const response = await api.get('/system/status');
        const systemData = response.data;
        setIsLockdown(systemData.lockdownMode);
      } catch (error) {
        console.error('Error monitoring lockdown:', error);
      }
    };

    if (user) {
      // Start heartbeat (every minute)
      intervalId = setInterval(doHeartbeat, 60000);

      // Monitor lockdown status (every 30 seconds)
      lockdownInterval = setInterval(monitorLockdown, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (lockdownInterval) clearInterval(lockdownInterval);
    };
  }, [user, logout]);

  // Show loading screen during initial app loading
  if (isLoading) {
    const loadingMessage = authLoading 
      ? "Verifying your session..." 
      : platformLoading 
      ? "Detecting your platform..." 
      : "Initializing Ziver...";

    return <LoadingScreen message={loadingMessage} />;
  }

  console.log('Platform detection:', { platform, isWeb, isTelegram, user: !!user, path: location.pathname });

  // Show landing page only for web users who are NOT logged in AND NOT coming from Telegram
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

            {/* REAL Profile and Settings Pages */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Updated Coming Soon routes with admin bypass */}
            <Route path="/job-marketplace" element={
              <ComingSoonPage featureName="Marketplace">
                <div>Real Marketplace Content Here</div>
              </ComingSoonPage>
            } />
            <Route path="/wallet" element={
              <ComingSoonPage featureName="Wallet">
                <div>Real Wallet Content Here</div>
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
    <ThemeProvider>
      <div className="app-container">
        <PlatformRouter />
      </div>
    </ThemeProvider>
  );
}

export default App;