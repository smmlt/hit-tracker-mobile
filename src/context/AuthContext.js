import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuthToken = async (token) => {
    await AsyncStorage.setItem('userToken', token);
    setUserToken(token);
  };

  const clearAuth = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    setUserToken(null);
    setUserData(null);
  };

  const handleOAuthRedirect = async (url) => {
    if (!url) return false;

    const parsed = Linking.parse(url);
    const hash = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
    const error = parsed.queryParams?.error || hash?.get('error');
    const token = parsed.queryParams?.accessToken || hash?.get('accessToken');

    if (error === 'access_denied') {
      await clearAuth();
      return true;
    }
    if (token) {
      await saveAuthToken(token);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Перевірка для Web (витягуємо токен з URL хешу #accessToken=...)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const handled = await handleOAuthRedirect(window.location.href);
          if (handled) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsLoading(false);
            return;
          }
        }

        // 2. Стандартна перевірка збережених даних з AsyncStorage
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedToken) {
          setUserToken(storedToken);
          if (storedUser) {
            setUserData(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Failed to load auth data from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 3. Обробник для мобільних пристроїв (Deep Linking: hittracker://...)
    const handleDeepLink = async (event) => {
      if (!event?.url) return;
      await handleOAuthRedirect(event.url);
    };

    initAuth();

    // Підписка на Deep Link тільки для iOS / Android
    if (Platform.OS !== 'web') {
      Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
      });

      const subscription = Linking.addEventListener('url', handleDeepLink);
      return () => subscription.remove();
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      const accessToken = data.accessToken || data.token;
      const user = data.user || null;

      await saveAuthToken(accessToken);
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }
      setUserData(user);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.register(email, password);
      const accessToken = data.accessToken || data.token;
      const user = data.user || null;

      await saveAuthToken(accessToken);
      if (user) {
        await AsyncStorage.setItem('userData', JSON.stringify(user));
      }
      setUserData(user);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await clearAuth();
    } catch (error) {
      console.error('Failed to clear storage during logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        login,
        register,
        logout,
        handleOAuthRedirect,
        updateUserData: async (user) => {
          await AsyncStorage.setItem('userData', JSON.stringify(user));
          setUserData(user);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
