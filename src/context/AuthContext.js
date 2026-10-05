import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { authService } from '../services/authService';
import { apiFetch } from '../services/api';
import { notificationService, syncPushRegistration } from '../services/notificationService';
import { getInstallationId } from '../utils/installationId';
import { useWorkoutStore } from '../stores/workoutStore';
import { useLibraryStore } from '../stores/libraryStore';
import { refreshAccessToken, setAccountSuspendedHandler, setRefreshHandler, setUnauthorizedHandler } from '../services/unauthorized';
import { loadAuthToken, loadRefreshToken, removeAuthToken, removeRefreshToken, saveAuthToken as persistAuthToken, saveRefreshToken } from '../services/secureTokenStorage';
import { normalizeAccountSuspension } from '../utils/accountSuspension';

export const AuthContext = createContext();
const ACCOUNT_SUSPENSION_KEY = 'accountSuspension';

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingMfa, setPendingMfa] = useState(null);
  const [accountSuspension, setAccountSuspension] = useState(null);
  const sessionEpoch = useRef(0);

  const saveAuthToken = useCallback(async (token) => {
    await persistAuthToken(token);
    useWorkoutStore.getState().reset();
    useLibraryStore.getState().setSession(null, null);
    setUserToken(token);
  }, []);

  const clearAuth = useCallback(async () => {
    sessionEpoch.current += 1;
    useWorkoutStore.getState().reset();
    useLibraryStore.getState().setSession(null, null);
    try {
      await Promise.all([removeAuthToken(), removeRefreshToken(), AsyncStorage.removeItem('userData')]);
    } finally {
      setUserToken(null);
      setUserData(null);
      setPendingMfa(null);
    }
  }, []);

  const applySession = useCallback(async (data) => {
    const accessToken = data.accessToken || data.token;
    await Promise.all([persistAuthToken(accessToken), saveRefreshToken(data.refreshToken), data.user ? AsyncStorage.setItem('userData', JSON.stringify(data.user)) : Promise.resolve()]);
    if (data.user && useWorkoutStore.persist.hasHydrated() && useWorkoutStore.getState().userId !== data.user.id) {
      useWorkoutStore.getState().reset();
      useLibraryStore.getState().setSession(null, null);
    }
    setUserToken(accessToken);
    await AsyncStorage.removeItem(ACCOUNT_SUSPENSION_KEY);
    setAccountSuspension(null);
    if (data.user) setUserData(data.user);
    return accessToken;
  }, []);

  const handleAccountSuspended = useCallback(async (details) => {
    const suspension = normalizeAccountSuspension(details);
    if (!suspension) return;
    await AsyncStorage.setItem(ACCOUNT_SUSPENSION_KEY, JSON.stringify(suspension));
    setAccountSuspension(suspension);
    await clearAuth();
  }, [clearAuth]);

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
      if (error.details?.code === 'ACCOUNT_BANNED') {
        await handleAccountSuspended(error.details);
        return null;
      }
      if (error.status === 401) {
        await clearAuth();
        return null;
      }
      throw error;
    }
  }, [applySession, clearAuth, handleAccountSuspended]);

  useEffect(() => {
    setUnauthorizedHandler(clearAuth);
    setAccountSuspendedHandler(handleAccountSuspended);
    setRefreshHandler(refreshSession);
    return () => {
      setUnauthorizedHandler(null);
      setAccountSuspendedHandler(null);
      setRefreshHandler(null);
    };
  }, [clearAuth, handleAccountSuspended, refreshSession]);

  useEffect(() => {
    if (!userToken) return;
    const refreshTimer = setTimeout(() => {
      refreshAccessToken().catch(() => {});
    }, 4 * 60_000);
    const touchPresence = async () => {
      let body;
      try {
        body = JSON.stringify({
          installationId: await getInstallationId(AsyncStorage, Crypto.randomUUID),
          platform: Platform.OS,
        });
      } catch {
        // Presence still works when local storage is temporarily unavailable.
      }
      return apiFetch('/users/me/presence', { method: 'POST', body }, userToken).catch(() => {});
    };
    touchPresence();
    syncPushRegistration(userToken, Platform.OS !== 'web').catch(() => {});
    const interval = setInterval(touchPresence, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        touchPresence();
        syncPushRegistration(userToken, false).catch(() => {});
      }
    });
    return () => {
      clearTimeout(refreshTimer);
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshSession, userToken]);

  const handleOAuthRedirect = useCallback(
    async (url, codeVerifier) => {
      if (!url) return false;

      const parsed = Linking.parse(url);
      const hash = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
      const error = parsed.queryParams?.error || hash?.get('error');
      const token = parsed.queryParams?.accessToken || hash?.get('accessToken');
      const mfaChallenge = hash?.get('mfaChallenge');
      const mfaEnrollmentRequired = hash?.get('mfaEnrollmentRequired');
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
      if (mfaChallenge) {
        setPendingMfa({
          challengeToken: mfaChallenge,
          enrollmentRequired: mfaEnrollmentRequired === 'true',
        });
        return true;
      }
      if (code && codeVerifier) {
        const data = await authService.exchangeOAuthCode(code, codeVerifier);
        if (data.mfaRequired) setPendingMfa(data);
        else await applySession(data);
        return true;
      }
      return false;
    },
    [applySession, clearAuth, saveAuthToken],
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        const rawSuspension = await AsyncStorage.getItem(ACCOUNT_SUSPENSION_KEY);
        let storedSuspension = null;
        try {
          storedSuspension = normalizeAccountSuspension(JSON.parse(rawSuspension || 'null'));
        } catch {
          await AsyncStorage.removeItem(ACCOUNT_SUSPENSION_KEY);
        }
        if (storedSuspension) {
          setAccountSuspension(storedSuspension);
          await clearAuth();
          return;
        }
        await AsyncStorage.removeItem(ACCOUNT_SUSPENSION_KEY);

        // 1. Перевірка для Web (витягуємо токен з URL хешу #accessToken=...)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const redirectedToMfa = window.location.hash.includes('mfaChallenge=');
          const handled = await handleOAuthRedirect(window.location.href);
          if (handled) {
            if (!redirectedToMfa) {
              try {
                await refreshSession();
              } catch {
                // The new access token remains usable if refresh is temporarily unavailable.
              }
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

  const login = useCallback(
    async (email, password) => {
      setIsLoading(true);
      try {
        const data = await authService.login(email, password);
        if (data.mfaRequired) setPendingMfa(data);
        else await applySession(data);

        return data;
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [applySession],
  );

  const beginMfaEnrollment = useCallback(() => authService.beginMfaEnrollment(pendingMfa?.challengeToken), [pendingMfa]);

  const confirmMfaEnrollment = useCallback((code) => authService.confirmMfaEnrollment(pendingMfa?.challengeToken, code), [pendingMfa]);

  const acceptMfaSession = useCallback(
    async (data) => {
      await applySession(data);
      setPendingMfa(null);
    },
    [applySession],
  );

  const verifyMfa = useCallback(
    async (factor) => {
      const data = await authService.verifyMfa(pendingMfa?.challengeToken, factor);
      await acceptMfaSession(data);
      return data;
    },
    [acceptMfaSession, pendingMfa],
  );

  const cancelMfa = useCallback(() => setPendingMfa(null), []);

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
      if (userToken) await notificationService.unregister(userToken).catch(() => {});
      await authService.logout(await loadRefreshToken());
    } catch (error) {
      console.error('Failed to revoke the session during logout:', error);
    } finally {
      // Always clear local auth/store state even if the server-side revoke above failed
      // (e.g. offline): leaving stale tokens/workout data on this device so the user stays
      // "logged in" is worse than a session that outlives its (already best-effort) server logout.
      try {
        await clearAuth();
      } finally {
        setIsLoading(false);
      }
    }
  }, [clearAuth, userToken]);

  const logoutAll = useCallback(async () => {
    setIsLoading(true);
    sessionEpoch.current += 1;
    try {
      await authService.logoutAll(userToken);
    } finally {
      await clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth, userToken]);

  const updateUserData = useCallback(async (user) => {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    setUserData(user);
  }, []);

  const dismissAccountSuspension = useCallback(async () => {
    await AsyncStorage.removeItem(ACCOUNT_SUSPENSION_KEY);
    setAccountSuspension(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        isInitializing,
        pendingMfa,
        accountSuspension,
        login,
        register,
        verifyRegistration,
        beginMfaEnrollment,
        confirmMfaEnrollment,
        acceptMfaSession,
        verifyMfa,
        cancelMfa,
        logout,
        logoutAll,
        handleOAuthRedirect,
        updateUserData,
        dismissAccountSuspension,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
