import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null); // <-- Add state for settings
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem('session');
    if (storedData) {
      const { user, appSettings } = JSON.parse(storedData);
      setUser(user);
      setAppSettings(appSettings); // <-- Load settings from storage
    }
    setLoading(false);
  }, []);

  const login = (sessionData) => { // Expects { user, token, appSettings }
    const { user, token, appSettings } = sessionData;
    const fullUser = { ...user, token };
    localStorage.setItem('session', JSON.stringify({ user: fullUser, appSettings }));
    setUser(fullUser);
    setAppSettings(appSettings); // <-- Set settings on login
    navigate('/');
  };

  const logout = () => {
    localStorage.removeItem('session');
    setUser(null);
    setAppSettings(null);
    navigate('/login');
  };

  const updateUser = (newUserData) => {
    const storedData = JSON.parse(localStorage.getItem('session'));
    const sessionData = { ...storedData, user: newUserData };
    localStorage.setItem('session', JSON.stringify(sessionData));
    setUser(newUserData);
  };

  const value = { user, appSettings, loading, login, logout, updateUser };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};