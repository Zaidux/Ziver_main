import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/adminService';

const Dashboard = () => {
  // Update state to include onlineUsers
  const [summary, setSummary] = useState({ totalUsers: 0, onlineUsers: 0 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await adminService.getSummary();
        setSummary(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data. You may not have admin privileges.');
      }
    };
    fetchSummary();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

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
        {/* ADDED: New card for online users */}
        <div className="stat-card">
          <h2>Online Now</h2>
          <p>{summary.onlineUsers}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;