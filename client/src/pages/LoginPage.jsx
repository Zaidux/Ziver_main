import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import './LoginPage.css';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  // Helper function to load Google script
  const loadGoogleScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      
      document.head.appendChild(script);
    });
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      // Load Google API script
      await loadGoogleScript();
      
      // Initialize Google Auth2
      const googleAuth = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.access_token) {
            try {
              // Send the access token to your backend via POST
              const result = await authService.googleAuth(response.access_token);
              
              if (result.token && result.user) {
                login(result.token, result.user);
                navigate("/mining");
              }
            } catch (err) {
              console.error("Google auth error:", err);
              setError("Google authentication failed. Please try again.");
            } finally {
              setGoogleLoading(false);
            }
          } else {
            setError("Google authentication was cancelled.");
            setGoogleLoading(false);
          }
        },
      });
      
      // Request access token
      googleAuth.requestAccessToken();
    } catch (error) {
      console.error("Google login error:", error);
      setError("Failed to initialize Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await authService.login(email, password);
      login(userData);
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">⚡ ZIVER</div>
          <h1>Welcome Back</h1>
          <p>Continue your mining journey</p>
        </div>

        <div className="social-login">
          <button 
            className={`social-btn google ${googleLoading ? 'loading' : ''}`} 
            onClick={handleGoogleLogin} 
            type="button" 
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Connecting...
              </div>
            ) : (
              <>
                <svg className="social-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <div className="divider">
          <span>or sign in with email</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

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
              disabled={loading || googleLoading}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="modern-input"
              disabled={loading || googleLoading}
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading || googleLoading}>
            {loading ? (
              <div className="button-loading">
                <div className="spinner"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create Account
            </Link>
          </p>
          <div className="security-note">
            <span className="shield-icon">🛡️</span>
            Your data is securely encrypted
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;