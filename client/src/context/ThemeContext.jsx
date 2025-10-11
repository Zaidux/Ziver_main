import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Load theme from localStorage or server
    const savedTheme = localStorage.getItem('ziver-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (themeToApply) => {
    // Remove all theme classes
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    
    // Apply the selected theme
    if (themeToApply === 'auto') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.add(systemPrefersDark ? 'theme-dark' : 'theme-light');
    } else {
      document.documentElement.classList.add(`theme-${themeToApply}`);
    }
    
    // Set data attribute for CSS variables
    document.documentElement.setAttribute('data-theme', themeToApply);
  };

  const toggleTheme = async (newTheme) => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('ziver-theme', newTheme);
    
    // Save to server if user is logged in
    try {
      // This would be your API call to save the theme preference
      // await api.put('/settings/appearance/theme', { theme: newTheme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const value = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export { ThemeContext };