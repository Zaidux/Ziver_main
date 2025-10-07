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

  const login = async (sessionData) => {
    try {
      setLoading(true);
      const { user, token, appSettings } = sessionData;
      const fullUser = { ...user, token };

      // Store session data
      localStorage.setItem('session', JSON.stringify({ user: fullUser, appSettings }));

      // Update state
      setUser(fullUser);
      setAppSettings(appSettings);
      setAuthError(null);

      // Set default auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Check system status and load referral data
      await Promise.all([
        checkSystemStatus(),
        loadReferralData()
      ]);

      if (navigate) navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setAuthError('login');
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
    logout, 
    updateUser, 
    updateAppSettings,
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