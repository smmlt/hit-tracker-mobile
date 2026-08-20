import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('user_language').then((savedLang) => {
      if (savedLang) setLocale(savedLang);
    });
  }, []);

  const changeLanguage = async (lang) => {
    setLocale(lang);
    await AsyncStorage.setItem('user_language', lang);
  };

  const t = (key) => {
    return translations[locale][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};