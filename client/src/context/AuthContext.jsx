import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import LoadingScreen from '../components/LoadingScreen';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, navigate }) => {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [authError, setAuthError] = useState(null);

  // NEW: Auto-save Telegram username function
  const autoSaveTelegramUsername = async (user, token) => {
    try {
      // Check if we're in Telegram and have a username
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        const telegramUsername = tgUser.username;
        
        if (telegramUsername && !user.telegram_username) {
          console.log('Auto-saving Telegram username:', telegramUsername);
          
          // Auto-save Telegram username to profile
          await api.post('/user/telegram-auto-save', {
            telegram_username: telegramUsername
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          console.log('Telegram username auto-saved:', telegramUsername);
          
          // Update local user state
          const updatedUser = { ...user, telegram_username: telegramUsername };
          setUser(updatedUser);
          
          // Update localStorage
          const storedData = localStorage.getItem('session');
          if (storedData) {
            const sessionData = JSON.parse(storedData);
            const updatedSession = { ...sessionData, user: updatedUser };
            localStorage.setItem('session', JSON.stringify(updatedSession));
          }
          
          return true;
        }
      }
    } catch (error) {
      console.log('Telegram auto-save skipped:', error.message);
    }
    return false;
  };

  // Check system status
  const checkSystemStatus = async () => {
    try {
      const response = await api.get('/system/status');
      setSystemStatus(response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking system status:', error);
      return null;
    }
  };

  // Enhanced auth verification with better error handling
  useEffect(() => {
    const checkAuth = async () => {
      const storedData = localStorage.getItem('session');

      if (!storedData) {
        setLoading(false);
        return;
      }

      try {
        const { user: storedUser, appSettings: storedSettings } = JSON.parse(storedData);

        // Verify token with backend
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedUser.token}`;
          const response = await api.get('/user/verify-token');

          if (response.data && response.data.valid === true) {
            setUser(storedUser);
            setAppSettings(storedSettings);
            setAuthError(null);

            // Check system status after auth
            await checkSystemStatus();

            // Load referral data after auth
            try {
              const referralResponse = await api.get('/referrals');
              setReferralData(referralResponse.data);
            } catch (refError) {
              console.log('Could not load referral data:', refError);
            }

            // Auto-save Telegram username if needed
            await autoSaveTelegramUsername(storedUser, storedUser.token);
          } else {
            console.log('Token invalid or verification failed');
            handleAuthFailure();
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            handleAuthFailure();
          } else {
            // Network error - proceed with stored data but show warning
            console.warn('Network error during auth verification, using stored session');
            setUser(storedUser);
            setAppSettings(storedSettings);
            setAuthError('network');
          }
        }
      } catch (parseError) {
        console.error('Error parsing stored session:', parseError);
        handleAuthFailure();
      } finally {
        setLoading(false);
      }
    };

    const handleAuthFailure = () => {
      localStorage.removeItem('session');
      setUser(null);
      setAppSettings(null);
      setReferralData(null);
      setSystemStatus(null);
      delete api.defaults.headers.common['Authorization'];
      setAuthError('invalid');
    };

    // Add small delay for better UX
    setTimeout(() => {
      checkAuth();
    }, 800);
  }, []);

  // UPDATED: Enhanced login function with Telegram auto-save
  const login = async (sessionData) => {
    try {
      setLoading(true);

      // Handle different response formats
      let user, token, appSettings;

      if (sessionData.user && sessionData.token) {
        // Google OAuth format: { user: {...}, token: '...', appSettings: {...} }
        user = sessionData.user;
        token = sessionData.token;
        appSettings = sessionData.appSettings;
      } else if (sessionData.token && sessionData.user) {
        // Regular login format: { token: '...', user: {...}, appSettings: {...} }
        token = sessionData.token;
        user = sessionData.user;
        appSettings = sessionData.appSettings;
      } else {
        // Direct token and user (backward compatibility)
        token = sessionData.token || sessionData;
        user = sessionData.user || sessionData;
        appSettings = sessionData.appSettings || {};
      }

      // Validate token
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received');
      }

      console.log('Token received, length:', token.length);
      console.log('Token preview:', token.substring(0, 20) + '...');

      const fullUser = { ...user, token };

      // Store session data
      const sessionToStore = { user: fullUser, appSettings };
      localStorage.setItem('session', JSON.stringify(sessionToStore));

      // Update state
      setUser(fullUser);
      setAppSettings(appSettings);
      setAuthError(null);

      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // FIXED: Verify the token works by making a test request to /api/user/me
      try {
        const testResponse = await api.get('/user/me');
        console.log('Token verification successful');
      } catch (testError) {
        console.error('Token test failed:', testError);
        throw new Error('Token validation failed');
      }

      // Check system status and load referral data
      await Promise.all([
        checkSystemStatus(),
        loadReferralData()
      ]);

      // Auto-save Telegram username after successful login
      await autoSaveTelegramUsername(fullUser, token);

      if (navigate) navigate('/mining');
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('login');

      // Clear invalid session
      localStorage.removeItem('session');
      setUser(null);
      setAppSettings(null);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Google OAuth login with Telegram auto-save
  const loginWithGoogle = async (googleResponse) => {
    try {
      setLoading(true);
      console.log('Google OAuth login:', googleResponse);

      const { user, token, appSettings, isNewUser } = googleResponse;

      if (!token) {
        throw new Error('No token received from Google OAuth');
      }

      // Validate token format
      if (typeof token !== 'string' || token.length < 10) {
        throw new Error('Invalid token format');
      }

      console.log('Google OAuth token length:', token.length);

      const fullUser = { ...user, token };

      // Store session data
      const sessionData = { user: fullUser, appSettings: appSettings || {} };
      localStorage.setItem('session', JSON.stringify(sessionData));

      // Update state
      setUser(fullUser);
      setAppSettings(appSettings || {});
      setAuthError(null);

      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // FIXED: Test the token using the correct endpoint /api/user/me
      try {
        await api.get('/user/me');
        console.log('Google OAuth token verified successfully');
      } catch (error) {
        console.error('Google OAuth token test failed:', error);
        throw new Error('Token validation failed');
      }

      // Load additional data
      await Promise.all([
        checkSystemStatus(),
        loadReferralData()
      ]);

      // Auto-save Telegram username after successful login
      await autoSaveTelegramUsername(fullUser, token);

      if (navigate) {
        if (isNewUser) {
          navigate('/profile/setup', { 
            state: { 
              message: 'Welcome! Please complete your profile to start mining.',
              showWelcome: true 
            } 
          });
        } else {
          navigate('/mining', { 
            state: { 
              message: `Welcome back, ${user.username}!` 
            } 
          });
        }
      }

    } catch (error) {
      console.error('Google OAuth login error:', error);
      setAuthError('google_login');
      localStorage.removeItem('session');
      setUser(null);
      setAppSettings(null);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Update user profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);

      const response = await api.put('/user/profile', profileData);

      if (response.data.success) {
        // Update user in state and localStorage
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);

        // Update localStorage
        const storedData = localStorage.getItem('session');
        if (storedData) {
          const sessionData = JSON.parse(storedData);
          const updatedSession = { ...sessionData, user: updatedUser };
          localStorage.setItem('session', JSON.stringify(updatedSession));
        }

        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);

      // Handle specific error cases
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: Upload avatar function
  const uploadAvatar = async (avatarFile) => {
    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await api.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update user in state and localStorage
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);

        // Update localStorage
        const storedData = localStorage.getItem('session');
        if (storedData) {
          const sessionData = JSON.parse(storedData);
          const updatedSession = { ...sessionData, user: updatedUser };
          localStorage.setItem('session', JSON.stringify(updatedSession));
        }

        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);

      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('Failed to upload avatar. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('session');
    setUser(null);
    setAppSettings(null);
    setReferralData(null);
    setSystemStatus(null);
    setAuthError(null);
    delete api.defaults.headers.common['Authorization'];
    if (navigate) navigate('/login');
  };

  const updateUser = (newUserData) => {
    const storedData = localStorage.getItem('session');
    if (storedData) {
      const sessionData = JSON.parse(storedData);
      const updatedUser = { ...sessionData.user, ...newUserData };
      const updatedSession = { ...sessionData, user: updatedUser };
      localStorage.setItem('session', JSON.stringify(updatedSession));
      setUser(updatedUser);
    }
  };

  const updateAppSettings = (newSettings) => {
    const storedData = localStorage.getItem('session');
    if (storedData) {
      const sessionData = JSON.parse(storedData);
      const updatedSession = { ...sessionData, appSettings: newSettings };
      localStorage.setItem('session', JSON.stringify(updatedSession));
      setAppSettings(newSettings);
    }
  };

  const loadReferralData = async () => {
    try {
      const response = await api.get('/referrals');
      setReferralData(response.data);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    }
  };

  const refreshReferralData = async () => {
    await loadReferralData();
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value = { 
    user, 
    appSettings, 
    referralData,
    systemStatus,
    loading, 
    authError,
    login, 
    loginWithGoogle,
    logout, 
    updateUser, 
    updateAppSettings,
    updateProfile, // NEW: Added profile update function
    uploadAvatar,  // NEW: Added avatar upload function
    autoSaveTelegramUsername, // NEW: Added Telegram auto-save function
    refreshReferralData,
    loadReferralData,
    checkSystemStatus,
    clearAuthError
  };

  // Show loading screen during auth initialization
  if (loading) {
    return <LoadingScreen message="Securing your session..." />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};