// context/ThemeContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes } from '../constants/colors';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState('dark');

  useEffect(() => {
    AsyncStorage.getItem('theme').then((savedTheme) => {
      if (themes[savedTheme]) setThemeName(savedTheme);
    });
  }, []);

  const theme = themes[themeName] || themes.dark;

  const toggleTheme = (name) => {
    if (themes[name]) {
      setThemeName(name);
      AsyncStorage.setItem('theme', name);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
