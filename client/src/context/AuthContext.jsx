import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, navigate }) => {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);

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

  useEffect(() => {
    const checkAuth = async () => {
      const storedData = localStorage.getItem('session');
      if (storedData) {
        try {
          const { user: storedUser, appSettings: storedSettings } = JSON.parse(storedData);

          // Verify token with backend
          try {
            api.defaults.headers.common['Authorization'] = `Bearer ${storedUser.token}`;
            const response = await api.get('/user/verify-token');

            if (response.data && response.data.valid === true) {
              setUser(storedUser);
              setAppSettings(storedSettings);

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
              localStorage.removeItem('session');
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            if (error.response?.status === 401 || error.response?.status === 403) {
              localStorage.removeItem('session');
            }
          }
        } catch (parseError) {
          console.error('Error parsing stored session:', parseError);
          localStorage.removeItem('session');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (sessionData) => {
    const { user, token, appSettings } = sessionData;
    const fullUser = { ...user, token };

    // Store session data
    localStorage.setItem('session', JSON.stringify({ user: fullUser, appSettings }));

    // Update state
    setUser(fullUser);
    setAppSettings(appSettings);

    // Set default auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Check system status and load referral data
    checkSystemStatus();
    loadReferralData();

    if (navigate) navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('session');
    setUser(null);
    setAppSettings(null);
    setReferralData(null);
    setSystemStatus(null);
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

  const value = { 
    user, 
    appSettings, 
    referralData,
    systemStatus,
    loading, 
    login, 
    logout, 
    updateUser, 
    updateAppSettings,
    refreshReferralData,
    loadReferralData,
    checkSystemStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};