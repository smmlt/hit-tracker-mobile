import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { authService } from '../services/authService';
import { apiFetch } from '../services/api';
import {
  refreshAccessToken,
  setRefreshHandler,
  setUnauthorizedHandler,
} from '../services/unauthorized';
import {
  loadAuthToken,
  loadRefreshToken,
  removeAuthToken,
  removeRefreshToken,
  saveAuthToken as persistAuthToken,
  saveRefreshToken,
} from '../services/secureTokenStorage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const sessionEpoch = useRef(0);

  const saveAuthToken = useCallback(async (token) => {
    await persistAuthToken(token);
    setUserToken(token);
  }, []);

  const clearAuth = useCallback(async () => {
    sessionEpoch.current += 1;
    await Promise.all([
      removeAuthToken(),
      removeRefreshToken(),
      AsyncStorage.removeItem('userData'),
    ]);
    setUserToken(null);
    setUserData(null);
  }, []);

  const applySession = useCallback(async (data) => {
    const accessToken = data.accessToken || data.token;
    await Promise.all([
      persistAuthToken(accessToken),
      saveRefreshToken(data.refreshToken),
      data.user
        ? AsyncStorage.setItem('userData', JSON.stringify(data.user))
        : Promise.resolve(),
    ]);
    setUserToken(accessToken);
    if (data.user) setUserData(data.user);
    return accessToken;
  }, []);

  const refreshSession = useCallback(async () => {
    const epoch = sessionEpoch.current;
    try {
      const data = await authService.refresh(await loadRefreshToken());
      if (epoch !== sessionEpoch.current) {
        await authService.logout(data.refreshToken).catch(() => {});
        return null;
      }
      return await applySession(data);
    } catch (error) {
      if (error.status === 401) {
        await clearAuth();
        return null;
      }
      throw error;
    }
  }, [applySession, clearAuth]);

  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    setRefreshHandler(refreshSession);
    return () => {
      setUnauthorizedHandler(null);
      setRefreshHandler(null);
    };
  }, [clearAuth, refreshSession]);

  useEffect(() => {
    if (!userToken) return;
    const refreshTimer = setTimeout(() => {
      refreshAccessToken().catch(() => {});
    }, 4 * 60_000);
    const touchPresence = () => apiFetch('/users/me/presence', { method: 'POST' }, userToken).catch(() => {});
    touchPresence();
    const interval = setInterval(touchPresence, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') touchPresence();
    });
    return () => {
      clearTimeout(refreshTimer);
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshSession, userToken]);

  const handleOAuthRedirect = useCallback(async (url, codeVerifier) => {
    if (!url) return false;

    const parsed = Linking.parse(url);
    const hash = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
    const error = parsed.queryParams?.error || hash?.get('error');
    const token = parsed.queryParams?.accessToken || hash?.get('accessToken');
    const code = parsed.queryParams?.code;

    if (error === 'access_denied') {
      try {
        await authService.logout(await loadRefreshToken());
      } finally {
        await clearAuth();
      }
      return true;
    }
    if (token) {
      await saveAuthToken(token);
      return true;
    }
    if (code && codeVerifier) {
      const data = await authService.exchangeOAuthCode(code, codeVerifier);
      await applySession(data);
      return true;
    }
    return false;
  }, [applySession, clearAuth, saveAuthToken]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Перевірка для Web (витягуємо токен з URL хешу #accessToken=...)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const handled = await handleOAuthRedirect(window.location.href);
          if (handled) {
            try {
              await refreshSession();
            } catch {
              // The new access token remains usable if refresh is temporarily unavailable.
            }
            window.history.replaceState({}, document.title, window.location.pathname);
            setIsInitializing(false);
            return;
          }
        }

        // 2. Refresh first so the restored role always comes from the database.
        const storedRefreshToken = await loadRefreshToken();
        if (Platform.OS === 'web' || storedRefreshToken) {
          try {
            const refreshedToken = await refreshSession();
            if (refreshedToken) return;
          } catch {
            // A temporary network failure may still leave a usable native access token.
          }
        }

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
        setIsInitializing(false);
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
  }, [handleOAuthRedirect, refreshSession]);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      await applySession(data);

      return data;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [applySession]);

  const register = useCallback(async (email, password, displayName) => {
    setIsLoading(true);
    try {
      return await authService.register(email, password, displayName);
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
    sessionEpoch.current += 1;
    try {
      await authService.logout(await loadRefreshToken());
      await clearAuth();
    } catch (error) {
      console.error('Failed to revoke the session during logout:', error);
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
        isInitializing,
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
