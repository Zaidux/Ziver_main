import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import api from './services/api';

// Layout and Component Imports
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MiningHub from './pages/MiningHub';
import TasksPage from './pages/TasksPage';
import ReferralsPage from './pages/ReferralsPage';
import LockdownPage from './pages/LockdownPage';
import ComingSoonPage from './pages/ComingSoonPage';

function App() {
  const { user, logout } = useAuth();

  // Check lockdown status and heartbeat
  useEffect(() => {
    let intervalId;
    
    const checkLockdown = async () => {
      try {
        const response = await api.get('/system/status');
        const systemStatus = response.data;
        
        // Redirect to lockdown page if system is locked down and user is not admin
        if (systemStatus.lockdownMode && user && user.role !== 'ADMIN') {
          window.location.href = '/lockdown';
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
      const lockdownInterval = setInterval(checkLockdown, 30000); // Check every 30 seconds
      
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
  }, [user, logout]);

  return (
    <div className="app-container">
      <Routes>
        {/* Public Routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lockdown" element={<LockdownPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<MiningHub />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            
            {/* Coming Soon Pages */}
            <Route path="/job-marketplace" element={<ComingSoonPage featureName="Job Marketplace" />} />
            <Route path="/wallet" element={<ComingSoonPage featureName="Wallet" />} />
            <Route path="/profile" element={<ComingSoonPage featureName="Profile" />} />
          </Route>
        </Route>

        {/* Fallback route for 404 errors */}
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </div>
  );
}

export default App;