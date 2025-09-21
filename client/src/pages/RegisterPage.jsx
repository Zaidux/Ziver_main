import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { useTelegramReferral } from '../hooks/useTelegramReferral';
import { useAuth } from '../context/AuthContext';
import './RegisterPage.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const { referralCode, isTelegram } = useTelegramReferral();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [urlReferralCode, setUrlReferralCode] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { username, email, password, confirmPassword } = formData;

  // Check for URL referral parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    if (ref) {
      setUrlReferralCode(ref);
      // Store in session storage for persistence
      sessionStorage.setItem('referralCode', ref);
    }
  }, [location]);

  // Use either Telegram referral or URL referral
  const effectiveReferralCode = referralCode || urlReferralCode;

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Register the user with the referral code
      const response = await authService.register(
        username, 
        email, 
        password, 
        effectiveReferralCode
      );
      
      // Clear any stored referral code after successful registration
      sessionStorage.removeItem('referralCode');
      
      // If auto-login is enabled after registration, log the user in
      if (response.token) {
        login(response.token, response.user);
        navigate('/mining', { 
          state: { 
            message: 'Account created successfully!' + 
                    (effectiveReferralCode ? ' You received a 100 ZP referral bonus!' : '')
          } 
        });
      } else {
        navigate('/login', { 
          state: { 
            message: 'Account created successfully! Please login.' + 
                    (effectiveReferralCode ? ' You received a 100 ZP referral bonus!' : '')
          } 
        });
      }
    } catch (err) {
      console.error('Registration error:', err);
      const message = err.response?.data?.message || 
                     err.response?.data?.error || 
                     'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo">⛏️ ZIVER</div>
          <h1>Join the Mining Revolution</h1>
          <p>Start earning ZP tokens today</p>
        </div>

        {effectiveReferralCode && (
          <div className="referral-banner">
            <span className="referral-icon">🎁</span>
            <span>Referred by: {effectiveReferralCode}</span>
            <span className="bonus-badge">+100 ZP Bonus</span>
          </div>
        )}

        {isTelegram && (
          <div className="telegram-badge">
            <span className="tg-icon">📱</span>
            Joining via Telegram
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
              minLength="3"
              maxLength="20"
              className="modern-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="modern-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                minLength="6"
                className="modern-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1" // Prevent tab focus on this button
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength="6"
                className="modern-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="register-button"
            disabled={loading}
          >
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="register-footer">
          <p>Already have an account? <Link to="/login" className="login-link">Sign In</Link></p>

          <div className="security-note">
            <span className="shield-icon">🛡️</span>
            Your data is securely encrypted
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;