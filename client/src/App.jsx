import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom'; // No BrowserRouter here
import { useAuth } from './context/AuthContext';
import api from './services/api';

import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MiningHub from './pages/MiningHub';

function App() {
  const { user } = useAuth();

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
    // The BrowserRouter wrapper has been removed from this file
    <div className="app-container">
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MiningHub />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
