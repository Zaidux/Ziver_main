import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// You can create an AdminLoginPage.css and copy styles from the main app's LoginPage.css
// import './AdminLoginPage.css'; 

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

      const user = response.data;

      // CRUCIAL: Check if the user has the ADMIN role
      if (user && user.role === 'ADMIN') {
        localStorage.setItem('admin_user', JSON.stringify(user));
        navigate('/'); // Redirect to the admin dashboard
      } else {
        setError('Access Denied: Not an admin account.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container"> {/* You can reuse styles from the main app */}
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
