import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { usePlatformDetection } from './hooks/usePlatformDetection';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
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
import ProfilePage from './pages/profile/pages/ProfilePage';
import FeedbackPage from './pages/profile/pages/FeedbackPage';

// Settings Pages
import SettingsPage from './pages/profile/pages/settings/SettingsPage';
import AppearanceSettingsPage from './pages/profile/pages/settings/AppearanceSettingsPage';
import SecuritySettingsPage from './pages/profile/pages/settings/SecuritySettingsPage';
import NotificationSettingsPage from './pages/profile/pages/settings/NotificationSettingsPage';
import AccountSettingsPage from './pages/profile/pages/settings/AccountSettingsPage';

// Component to handle platform-based routing
const PlatformRouter = () => {
  const { user, logout, systemStatus, loading: authLoading } = useAuth();
  const { platform, isWeb, isTelegram, isLoading: platformLoading } = usePlatformDetection();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLockdown, setIsLockdown] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const isLoading = authLoading || platformLoading || isInitializing;

  // Initialize app and check system status
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const response = await api.get('/system/status');
        const systemData = response.data;
        setIsLockdown(systemData.lockdownMode);

        if (systemData.lockdownMode && user && user.role !== 'ADMIN' && location.pathname !== '/lockdown') {
          navigate('/lockdown', { replace: true });
        }

        if (!systemData.lockdownMode && location.pathname === '/lockdown') {
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setTimeout(() => setIsInitializing(false), 1000);
      }
    };

    initializeApp();
  }, [user, navigate, location]);

  // Show loading screen during initial app loading
  if (isLoading) {
    const loadingMessage = authLoading 
      ? "Verifying your session..." 
      : platformLoading 
      ? "Detecting your platform..." 
      : "Initializing Ziver...";

    return <LoadingScreen message={loadingMessage} />;
  }

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

  // For authenticated users or specific auth routes
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/lockdown" element={<LockdownPage />} />

      {/* Show landing page at root for non-authenticated web users */}
      {!user && (
        <Route path="/" element={<LandingPage />} />
      )}

      {/* Protected Routes with Layout */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <LayoutWrapper isLockdown={isLockdown} user={user} />
          </ProtectedRoute>
        } 
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
};

// Layout wrapper component
const LayoutWrapper = ({ isLockdown, user }) => {
  return (
    <Layout>
      <Routes>
        {/* Only show these routes if not in lockdown OR user is admin */}
        {(!isLockdown || user?.role === 'ADMIN') ? (
          <>
            <Route path="/" element={<MiningHub />} />
            <Route path="/mining" element={<MiningHub />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/settings/account" element={<AccountSettingsPage />} />
            <Route path="/history" element={<TransactionHistoryPage />} />
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
          // If in lockdown and not admin, show lockdown page
          <Route path="*" element={<LockdownPage />} />
        )}
      </Routes>
    </Layout>
  );
};

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