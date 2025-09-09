import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService'; // Make sure this service exists

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalUsers: 0 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // We removed the manual redirect. The ProtectedRoute now handles all security.
        // We now use the clean adminService to make the API call.
        const response = await adminService.getSummary();
        setSummary(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data. You may not have admin privileges.');
      }
    };

    fetchSummary();
  }, []); // The dependency array is now empty

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  // The JSX part remains the same
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>
      
      {error && <p className="error-message">{error}</p>}

      <div className="stats-grid">
        <div className="stat-card">
          <h2>Total Users</h2>
          <p>{summary.totalUsers}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;