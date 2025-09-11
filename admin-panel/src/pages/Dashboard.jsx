import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalUsers: 0, onlineUsers: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await adminService.getSummary();
        setSummary(response.data);
      } catch (err) {
        console.error('Dashboard error:', err);
        if (err.response?.status === 403) {
          setError('Access denied. Administrator privileges required.');
        } else if (err.response?.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to fetch dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      {loading && <p>Loading dashboard data...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <div className="stats-grid">
          <div className="stat-card">
            <h2>Total Users</h2>
            <p className="stat-number">{summary.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h2>Online Now</h2>
            <p className="stat-number">{summary.onlineUsers}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;