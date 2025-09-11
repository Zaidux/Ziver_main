import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  const { user, logout } = useAuth();

  // Heartbeat effect with error handling
  useEffect(() => {
    let intervalId;
    if (user) {
      const doHeartbeat = async () => {
        try {
          await api.post('/user/heartbeat');
        } catch (error) {
          if (error.response?.status === 401) {
            logout(); // Token is invalid, force logout
          }
        }
      };

      // Immediate heartbeat check
      doHeartbeat();
      // Set up interval for subsequent heartbeats
      intervalId = setInterval(doHeartbeat, 60000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, logout]);

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<MiningHub />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/referrals" element={<ReferralsPage />} />
            </Route>
          </Route>

          {/* Fallback route for 404 errors */}
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;