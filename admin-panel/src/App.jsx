import { Routes, Route } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import Dashboard from './pages/Dashboard';
import TaskManagement from './pages/TaskManagement';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    // REMOVED BrowserRouter wrapper since it's already in main.jsx
    <Routes>
      <Route path="/login" element={<AdminLoginPage />} />

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<UserManagement />} />
        </Route>
      </Route>

      {/* Fallback route for admin panel */}
      <Route path="*" element={<AdminLoginPage />} />
    </Routes>
  );
}

export default App;