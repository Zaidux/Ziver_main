import React, { createContext, useState, useEffect, useContext } from 'react';
// Remove useNavigate import
import api from '../services/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children, navigate }) => { // Add navigate as prop
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
            const response = await api.get('/auth/verify');
            
            if (response.data.valid) {
              setUser(storedUser);
              setAppSettings(storedSettings);
            } else {
              localStorage.removeItem('session');
            }
          } catch (error) {
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
    
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    if (navigate) navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('session');
    setUser(null);
    setAppSettings(null);
    
    delete api.defaults.headers.common['Authorization'];
    
    if (navigate) navigate('/login');
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