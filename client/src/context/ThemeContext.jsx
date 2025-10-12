import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    initializeTheme();
  }, [user]);

  const initializeTheme = async () => {
    try {
      let savedTheme = localStorage.getItem('ziver-theme');
      
      // If user is logged in, try to get theme from server
      if (user) {
        try {
          const response = await api.get('/settings/appearance');
          if (response.data.success) {
            savedTheme = response.data.settings.theme?.value || savedTheme;
          }
        } catch (error) {
          console.log('Could not load theme from server, using local storage:', error.message);
        }
      }
      
      // Set theme with fallback to dark
      const initialTheme = savedTheme || 'dark';
      setTheme(initialTheme);
      applyTheme(initialTheme);
    } catch (error) {
      console.error('Error initializing theme:', error);
      applyTheme('dark');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (themeToApply) => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-auto');

    // Apply the selected theme
    if (themeToApply === 'auto') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const finalTheme = systemPrefersDark ? 'dark' : 'light';
      document.documentElement.classList.add(`theme-${finalTheme}`);
    } else {
      document.documentElement.classList.add(`theme-${themeToApply}`);
    }

    // Set data attribute for CSS variables
    document.documentElement.setAttribute('data-theme', themeToApply);

    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(themeToApply);
  };

  const updateMetaThemeColor = (themeToApply) => {
    let themeColor = '#1A1A1A'; // Dark theme default
    
    if (themeToApply === 'light') {
      themeColor = '#FFFFFF';
    } else if (themeToApply === 'auto') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      themeColor = systemPrefersDark ? '#1A1A1A' : '#FFFFFF';
    }

    // Update or create meta theme-color tag
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = themeColor;
  };

  const toggleTheme = async (newTheme) => {
    if (!newTheme || newTheme === theme) return;

    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('ziver-theme', newTheme);

    // Save to server if user is logged in
    if (user) {
      try {
        await api.put('/settings/appearance/theme', { theme: newTheme });
        console.log('Theme preference saved to server');
      } catch (error) {
        console.error('Failed to save theme preference to server:', error);
        // Don't throw error - local storage is the fallback
      }
    }
  };

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      if (theme === 'auto') {
        applyTheme('auto');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]);

  const value = {
    theme,
    toggleTheme,
    isLoading
  };

  if (isLoading) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };