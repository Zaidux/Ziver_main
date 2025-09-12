import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, navigate }) => {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);

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

            // FIX: Check if response has valid property AND it's true
            if (response.data && response.data.valid === true) {
              setUser(storedUser);
              setAppSettings(storedSettings);
            } else {
              console.log('Token invalid or verification failed');
              localStorage.removeItem('session');
            }
          } catch (error) {
            console.error('Token verification failed:', error);
            // Don't immediately remove session on network errors
            // Only remove if it's an authentication error (401/403)
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
    
    // Navigate if navigate function is provided
    if (navigate) navigate('/');
  };

  const logout = () => {
    // Clear local storage
    localStorage.removeItem('session');
    
    // Clear state
    setUser(null);
    setAppSettings(null);
    
    // Remove auth header
    delete api.defaults.headers.common['Authorization'];
    
    // Navigate to login if navigate function is provided
    if (navigate) navigate('/login');
  };

  const updateUser = (newUserData) => {
    // Update both localStorage and state
    const storedData = localStorage.getItem('session');
    if (storedData) {
      const sessionData = JSON.parse(storedData);
      const updatedSession = { ...sessionData, user: newUserData };
      localStorage.setItem('session', JSON.stringify(updatedSession));
      setUser(newUserData);
    }
  };

  const value = { user, appSettings, loading, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};