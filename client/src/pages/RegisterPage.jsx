import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';
import './RegisterPage.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  // State to hold the referral code from the URL
  const [referralCode, setReferralCode] = useState(null);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // This effect runs once when the page loads to check for a referral code
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode);
      console.log(`Referral code found: ${refCode}`);
    }
  }, [searchParams]);

  const { username, email, password } = formData;

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Pass the referral code (if it exists) to the register function
      await authService.register(username, email, password, referralCode);
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Create Your Account</h2>
        {error && <p className="error-message">{error}</p>}
        {referralCode && <p style={{ color: '#00e676', textAlign: 'center' }}>Referred by code: {referralCode}</p>}
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text" id="username" name="username"
            value={username} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email" id="email" name="email"
            value={email} onChange={handleChange} required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password" id="password" name="password"
            value={password} onChange={handleChange} required
          />
        </div>
        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;