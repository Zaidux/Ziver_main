import { useEffect } from 'react'; // <-- NEW
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; // <-- NEW
import api from './services/api'; // <-- NEW (Assuming api.js is in services)

import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MiningHub from './pages/MiningHub';

function App() {
  const { user } = useAuth(); // Get the current user from context

  // This useEffect hook handles the heartbeat functionality
  useEffect(() => {
    let intervalId;

    // If a user is logged in, start the heartbeat
    if (user) {
      // Send a heartbeat immediately on login
      api.post('/user/heartbeat'); 
      
      // Then, send a heartbeat every 60 seconds
      intervalId = setInterval(() => {
        api.post('/user/heartbeat');
      }, 60000); // 60000 milliseconds = 1 minute
    }

    // This is a cleanup function. It runs when the user logs out.
    return () => {
      if (intervalId) {
        clearInterval(intervalId); // Stop sending heartbeats
      }
    };
  }, [user]); // This effect re-runs whenever the user logs in or out

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MiningHub />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;