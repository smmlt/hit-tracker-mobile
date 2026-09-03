import React, { createContext, useCallback, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/unauthorized';
import { loadAuthToken, removeAuthToken, saveAuthToken as persistAuthToken } from '../services/secureTokenStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveAuthToken = useCallback(async (token) => {
    await persistAuthToken(token);
    setUserToken(token);
  }, []);

  const clearAuth = useCallback(async () => {
    await Promise.all([removeAuthToken(), AsyncStorage.removeItem('userData')]);
    setUserToken(null);
    setUserData(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    return () => setUnauthorizedHandler(null);
  }, [clearAuth]);

  const handleOAuthRedirect = useCallback(async (url, codeVerifier) => {
    if (!url) return false;

    const parsed = Linking.parse(url);
    const hash = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
    const error = parsed.queryParams?.error || hash?.get('error');
    const token = parsed.queryParams?.accessToken || hash?.get('accessToken');
    const code = parsed.queryParams?.code;

    if (error === 'access_denied') {
      await clearAuth();
      return true;
    }
    if (token) {
      await saveAuthToken(token);
      return true;
    }
    if (code && codeVerifier) {
      const data = await authService.exchangeOAuthCode(code, codeVerifier);
      await saveAuthToken(data.accessToken || data.token);
      if (data.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        setUserData(data.user);
      }
      return true;
    }
    return false;
  }, [clearAuth, saveAuthToken]);

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

        // 2. Native tokens are protected by Keychain/Keystore; web uses its browser storage.
        const storedToken = await loadAuthToken();
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
      // PKCE verifier is only held by the screen that initiated mobile OAuth.
      // A cold-start deep link without it is deliberately not accepted.
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

  const login = useCallback(async (email, password) => {
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
  }, [saveAuthToken]);

  const register = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      return await authService.register(email, password);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyRegistration = useCallback(async (email, code) => {
    setIsLoading(true);
    try {
      return await authService.verifyRegistration(email, code);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearAuth();
    } catch (error) {
      console.error('Failed to clear storage during logout:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  const updateUserData = useCallback(async (user) => {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    setUserData(user);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        login,
        register,
        verifyRegistration,
        logout,
        handleOAuthRedirect,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
