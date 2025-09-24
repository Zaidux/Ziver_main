import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import referralService from '../services/referralService';
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
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [checkingReferral, setCheckingReferral] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const { username, email, password, confirmPassword } = formData;

  // Check for URL referral parameter and validate referral code
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ref = searchParams.get('ref');
    
    if (ref) {
      setUrlReferralCode(ref);
      sessionStorage.setItem('referralCode', ref);
      validateReferralCode(ref);
    } else if (referralCode) {
      validateReferralCode(referralCode);
    }
  }, [location, referralCode]);

  // Validate referral code and get referrer info
  const validateReferralCode = async (code) => {
    if (!code) return;
    
    setCheckingReferral(true);
    try {
      const response = await referralService.getReferrerInfo(code);
      if (response.success && response.referrer) {
        setReferrerInfo(response.referrer);
        console.log('Referrer found:', response.referrer.username);
      } else {
        setReferrerInfo(null);
        console.log('Invalid referral code');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferrerInfo(null);
    } finally {
      setCheckingReferral(false);
    }
  };

  // Use either Telegram referral or URL referral
  const effectiveReferralCode = referralCode || urlReferralCode;

  const handleChange = (e) => {
    // Prevent changing username if it's a referral and we're showing referrer info
    if (e.target.name === 'username' && referrerInfo && effectiveReferralCode) {
      return; // Don't allow changing the username when referred
    }
    
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
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

      let successMessage = 'Account created successfully!';
      if (response.referralApplied) {
        successMessage += ` You received 100 ZP bonus for being referred by ${response.referrer?.username || 'a friend'}!`;
      }

      // If auto-login is enabled after registration, log the user in
      if (response.token) {
        login(response.token, response.user);
        navigate('/mining', { 
          state: { message: successMessage }
        });
      } else {
        navigate('/login', { 
          state: { message: successMessage }
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

  // Auto-fill username with referrer's suggestion when referral is detected
  useEffect(() => {
    if (referrerInfo && effectiveReferralCode && !username) {
      // Suggest a username based on referrer (user can change this if they want)
      const suggestedUsername = `friend_of_${referrerInfo.username}`.toLowerCase().substring(0, 20);
      setFormData(prev => ({ ...prev, username: suggestedUsername }));
    }
  }, [referrerInfo, effectiveReferralCode, username]);

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <div className="logo">⛏️ ZIVER</div>
          <h1>Join the Mining Revolution</h1>
          <p>Start earning ZP tokens today</p>
        </div>

        {effectiveReferralCode && (
          <div className={`referral-banner ${referrerInfo ? 'valid' : 'invalid'}`}>
            <span className="referral-icon">🎁</span>
            {checkingReferral ? (
              <span>Checking referral code...</span>
            ) : referrerInfo ? (
              <>
                <span>Referred by: <strong>{referrerInfo.username}</strong></span>
                <span className="bonus-badge">+100 ZP Bonus</span>
              </>
            ) : (
              <>
                <span>Invalid referral code: {effectiveReferralCode}</span>
                <span className="bonus-badge invalid">No Bonus</span>
              </>
            )}
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
              placeholder={referrerInfo ? `Friend of ${referrerInfo.username}` : "Choose a username"}
              required
              minLength="3"
              maxLength="20"
              className={`modern-input ${referrerInfo && effectiveReferralCode ? 'referral-username' : ''}`}
              readOnly={!!(referrerInfo && effectiveReferralCode)} // Make read-only when referred
              title={referrerInfo && effectiveReferralCode ? "Username suggested based on your referrer" : ""}
            />
            {referrerInfo && effectiveReferralCode && (
              <div className="referral-note">
                🔒 Username suggested based on your referrer
              </div>
            )}
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
                tabIndex="-1"
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
            disabled={loading || checkingReferral}
          >
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Creating Account...
              </div>
            ) : checkingReferral ? (
              'Checking Referral...'
            ) : (
              `Create Account ${effectiveReferralCode && referrerInfo ? '+ Get 100 ZP' : ''}`
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