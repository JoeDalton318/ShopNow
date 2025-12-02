import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    // Charger la préférence depuis localStorage
    const saved = localStorage.getItem('shopnow_darkmode');
    return saved === 'true';
  });

  useEffect(() => {
    // Sauvegarder dans localStorage
    localStorage.setItem('shopnow_darkmode', darkMode);
    
    // Appliquer le mode sombre au body
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.setAttribute('data-bs-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.removeAttribute('data-bs-theme');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const value = {
    darkMode,
    toggleDarkMode
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
