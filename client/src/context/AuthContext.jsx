import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const storedData = localStorage.getItem('session');
      if (storedData) {
        try {
          const { user: storedUser, appSettings: storedSettings } = JSON.parse(storedData);
          
          // Verify token with backend
          try {
            // Set auth header for verification request
            api.defaults.headers.common['Authorization'] = `Bearer ${storedUser.token}`;
            const response = await api.get('/auth/verify');
            
            if (response.data.valid) {
              setUser(storedUser);
              setAppSettings(storedSettings);
            } else {
              // Token is invalid
              localStorage.removeItem('session');
            }
          } catch (error) {
            // Token verification failed
            console.error('Token verification failed:', error);
            localStorage.removeItem('session');
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
    localStorage.setItem('session', JSON.stringify({ user: fullUser, appSettings }));
    setUser(fullUser);
    setAppSettings(appSettings);
    
    // Set default auth header for future requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('session');
    setUser(null);
    setAppSettings(null);
    
    // Remove auth header
    delete api.defaults.headers.common['Authorization'];
    
    navigate('/login');
  };

  const updateUser = (newUserData) => {
    const storedData = JSON.parse(localStorage.getItem('session'));
    const updatedSession = { ...storedData, user: newUserData };
    localStorage.setItem('session', JSON.stringify(updatedSession));
    setUser(newUserData);
  };

  const value = { user, appSettings, loading, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};