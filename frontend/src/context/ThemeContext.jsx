import React, { createContext, useContext, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useLocalStorage('theme-dark', true); // Default to Dark mode!

  useEffect(() => {
    const root = window.document.body;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
