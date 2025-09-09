import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import MiningHub from './pages/MiningHub';

function App() {
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