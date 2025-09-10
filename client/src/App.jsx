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
          <Route element={<Layout />}> {/* <-- All pages inside here will have the Navbar */}
            <Route path="/" element={<MiningHub />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/referrals" element={<div>Referrals Page (Coming Soon)</div>} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;