// EN: Owns the current locale, restores a supported choice from storage, persists changes, and exposes translated strings through React context.
// UK: Зберігає поточну мову, відновлює підтримуваний вибір зі сховища, зберігає зміни й надає переклади через React-контекст.

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from './translations';
import { DEFAULT_LOCALE, isSupportedLocale } from './locale';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    AsyncStorage.getItem('user_language').then((savedLang) => {
      if (isSupportedLocale(savedLang)) setLocale(savedLang);
    });
  }, []);

  const changeLanguage = async (lang) => {
    if (!isSupportedLocale(lang)) return;
    setLocale(lang);
    await AsyncStorage.setItem('user_language', lang);
  };

  const t = (key, values = {}) => {
    const template = translations[locale]?.[key] || translations.en[key] || key;
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
