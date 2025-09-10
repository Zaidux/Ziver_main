import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import api from './services/api';

// Layout and Component Imports
import Layout from './components/Layout';
import ProtectedRoute from './components-ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MiningHub from './pages/MiningHub';
import TasksPage from './pages/TasksPage';
import ReferralsPage from './pages/ReferralsPage'; // This import will now work

function App() {
  const { user } = useAuth();

  // Heartbeat effect (no changes here)
  useEffect(() => {
    let intervalId;
    if (user) {
      api.post('/user/heartbeat'); 
      intervalId = setInterval(() => {
        api.post('/user/heartbeat');
      }, 60000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  return (
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
            {/* The single, correct route for referrals */}
            <Route path="/referrals" element={<ReferralsPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;