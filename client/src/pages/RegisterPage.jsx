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

  // Get referral data from the hook
  const { referralCode, isTelegram, telegramUser } = useTelegramReferral();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [urlReferralCode, setUrlReferralCode] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState(null);
  const [checkingReferral, setCheckingReferral] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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
      sessionStorage.setItem('referralCode', ref);
      validateReferralCode(ref);
    }
  }, [location]);

  // Check for Telegram referral code
  useEffect(() => {
    if (referralCode && !urlReferralCode) {
      validateReferralCode(referralCode);
    }
  }, [referralCode, urlReferralCode]);

  // Validate referral code and get referrer info
  const validateReferralCode = async (code) => {
    if (!code) return;

    console.log('Validating referral code:', code);
    setCheckingReferral(true);

    try {
      const response = await referralService.getReferrerInfo(code);
      console.log('Referrer info response:', response);

      if (response.success && response.referrer) {
        setReferrerInfo(response.referrer);
        console.log('Referrer found:', response.referrer.username);
        
        // Auto-suggest username based on referrer
        if (!username) {
          const suggestedUsername = `friend_of_${response.referrer.username}`
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .substring(0, 15);
          
          setFormData(prev => ({ ...prev, username: suggestedUsername }));
        }
      } else {
        setReferrerInfo(null);
        console.log('Invalid referral code or no referrer found');
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
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRegistrationSuccess(false);

    // Validation
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

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      console.log('Starting registration with:', {
        username,
        email,
        hasReferral: !!effectiveReferralCode,
        referralCode: effectiveReferralCode,
        isTelegram,
        telegramUser: telegramUser?.id
      });

      const response = await authService.register(
        username, 
        email, 
        password, 
        effectiveReferralCode
      );

      console.log('Registration successful:', response);

      // Clear referral storage
      sessionStorage.removeItem('referralCode');
      localStorage.removeItem('ziver_referral_code');

      // Clear pending referral if exists
      if (effectiveReferralCode) {
        try {
          await referralService.clearPendingReferral(effectiveReferralCode);
        } catch (clearError) {
          console.log('Note: Could not clear pending referral:', clearError);
        }
      }

      setRegistrationSuccess(true);

      // Prepare success message
      let successMessage = 'Account created successfully!';
      if (response.referralApplied && response.referrer) {
        successMessage += ` You received 100 ZP bonus from ${response.referrer.username}!`;
        
        if (response.referrerBonus) {
          successMessage += ` They earned ${response.referrerBonus.zp} ZP and ${response.referrerBonus.sebPoints} SEB points.`;
        }
      } else if (!effectiveReferralCode) {
        successMessage += ' A smart referrer was assigned to help you get started!';
      }

      // Login user and redirect
      if (response.token && response.user) {
        login(response.token, response.user);
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/mining', { 
            state: { 
              message: successMessage,
              showWelcome: true 
            }
          });
        }, 1000);
      } else {
        navigate('/login', { 
          state: { message: successMessage }
        });
      }

    } catch (err) {
      console.error('Registration error details:', err);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Handle specific error cases
      if (errorMessage.includes('already exists')) {
        if (errorMessage.includes('email')) {
          errorMessage = 'An account with this email already exists.';
        } else if (errorMessage.includes('username')) {
          errorMessage = 'This username is already taken. Please choose another.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill username when referral is detected
  useEffect(() => {
    if (referrerInfo && effectiveReferralCode && !username) {
      const suggestedUsername = `friend_of_${referrerInfo.username}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .substring(0, 15);
      
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

        {/* Referral Banner */}
        {effectiveReferralCode && (
          <div className={`referral-banner ${referrerInfo ? 'valid' : checkingReferral ? 'checking' : 'invalid'}`}>
            <span className="referral-icon">🎁</span>
            {checkingReferral ? (
              <span>Checking referral code: {effectiveReferralCode}</span>
            ) : referrerInfo ? (
              <>
                <span>Referred by: <strong>{referrerInfo.username}</strong></span>
                <span className="bonus-badge">+100 ZP Bonus</span>
              </>
            ) : (
              <>
                <span>Referral code: {effectiveReferralCode}</span>
                <span className="bonus-badge">Bonus Available</span>
              </>
            )}
          </div>
        )}

        {isTelegram && (
          <div className="telegram-badge">
            <span className="tg-icon">📱</span>
            Joining via Telegram
            {telegramUser && ` (@${telegramUser.username})`}
          </div>
        )}

        {registrationSuccess && (
          <div className="success-message">
            ✅ Account created successfully! Redirecting...
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
              className={`modern-input ${referrerInfo ? 'referral-username' : ''}`}
              disabled={loading}
            />
            {referrerInfo && (
              <div className="referral-note">
                ✨ Welcome! You were referred by {referrerInfo.username}
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
              disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                disabled={loading}
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
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                disabled={loading}
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
            ) : referrerInfo ? (
              `Join & Get 100 ZP from ${referrerInfo.username}`
            ) : effectiveReferralCode ? (
              'Join with Referral Bonus'
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