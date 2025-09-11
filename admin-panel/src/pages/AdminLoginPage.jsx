import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'https://ziver-api.onrender.com/api/auth/login',
        {
          email: formData.email,
          password: formData.password,
        }
      );

      const { user, token, appSettings } = response.data;

      // CRUCIAL: Check if the user has the ADMIN role
      if (user && user.role === 'ADMIN') {
        // Store admin session data
        localStorage.setItem('admin_user', JSON.stringify(user));
        localStorage.setItem('admin_token', token);
        localStorage.setItem('admin_settings', JSON.stringify(appSettings));
        
        // Set default auth header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        navigate('/'); // Redirect to admin dashboard
      } else {
        setError('Access Denied: Administrator privileges required.');
        // Clear any existing admin data
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Admin Panel Login</h2>
        {error && <p className="error-message">{error}</p>}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email" id="email" name="email"
            value={formData.email} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password" id="password" name="password"
            value={formData.password} onChange={handleChange} required
          />
        </div>
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Logging In...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage;