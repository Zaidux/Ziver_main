import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// You can create a Dashboard.css for styling
// import './Dashboard.css';

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalUsers: 0 });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Get the logged-in admin user from localStorage
  const adminUser = JSON.parse(localStorage.getItem('admin_user'));

  useEffect(() => {
    const fetchSummary = async () => {
      // If no admin is logged in, redirect to login
      if (!adminUser || !adminUser.token) {
        navigate('/login');
        return;
      }
      
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${adminUser.token}`,
          },
        };
        const response = await axios.get('https://ziver-api.onrender.com/api/admin/summary', config);
        setSummary(response.data);
      } catch (err) {
        setError('Failed to fetch dashboard data.');
        if (err.response?.status === 403) {
          setError('Access Denied. You are not an admin.');
        }
      }
    };

    fetchSummary();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container"> {/* Define styles in Dashboard.css */}
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
        {/* We can add more stat cards here later */}
      </div>
      
      {/* We will add components for Task Management and Settings here */}
    </div>
  );
};

export default Dashboard;