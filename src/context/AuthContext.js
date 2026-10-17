// EN: Owns authentication bootstrap, access-token refresh, OAuth callbacks, presence, and logout while exposing one session API to the UI.
// UK: Керує запуском автентифікації, оновленням access token, OAuth callback, присутністю та виходом і надає UI єдиний API сесії.
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

/**
 * EN: Provides the application-wide authenticated session and coordinates persistence, refresh, OAuth, MFA, presence, and logout side effects.
 * UK: Надає всьому застосунку автентифіковану сесію та узгоджує збереження, оновлення, OAuth, MFA, присутність і побічні дії виходу.
 */
export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingMfa, setPendingMfa] = useState(null);
  const [accountSuspension, setAccountSuspension] = useState(null);
  const sessionEpoch = useRef(0);

  /**
   * EN: Persists a token-only OAuth session and clears user-bound workout and library state before exposing it.
   * UK: Зберігає OAuth-сесію лише з токеном і очищає прив'язаний до користувача стан тренувань та бібліотеки перед її оприлюдненням.
   */
  const saveAuthToken = useCallback(/* EN: Persists the token and resets account-bound stores. / UK: Зберігає токен і очищає сховища, прив'язані до облікового запису. */ async (token) => {
    await persistAuthToken(token);
    useWorkoutStore.getState().reset();
    useLibraryStore.getState().setSession(null, null);
    setUserToken(token);
  }, []);

  /**
   * EN: Invalidates pending session work, removes every local credential, and resets user-specific stores even when storage cleanup fails.
   * UK: Скасовує актуальність незавершених операцій сесії, видаляє всі локальні облікові дані й очищає сховища користувача навіть у разі помилки очищення пам'яті.
   */
  const clearAuth = useCallback(/* EN: Clears credentials and all reactive session state. / UK: Очищає облікові дані та весь реактивний стан сесії. */ async () => {
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

  /**
   * EN: Atomically persists returned credentials and user data, prevents cross-account store reuse, and clears a prior suspension marker.
   * UK: Узгоджено зберігає отримані облікові дані та дані користувача, запобігає повторному використанню сховищ іншого облікового запису й очищає попередню позначку блокування.
   */
  const applySession = useCallback(/* EN: Persists and activates a complete server-issued session. / UK: Зберігає та активує повну сесію, видану сервером. */ async (data) => {
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

  /**
   * EN: Normalizes and persists a valid suspension notice before clearing credentials so the signed-out UI can still explain the restriction.
   * UK: Нормалізує та зберігає чинне повідомлення про блокування перед очищенням облікових даних, щоб інтерфейс після виходу міг пояснити обмеження.
   */
  const handleAccountSuspended = useCallback(/* EN: Preserves a valid suspension notice before signing out. / UK: Зберігає чинне повідомлення про блокування перед виходом. */ async (details) => {
    const suspension = normalizeAccountSuspension(details);
    if (!suspension) return;
    await AsyncStorage.setItem(ACCOUNT_SUSPENSION_KEY, JSON.stringify(suspension));
    setAccountSuspension(suspension);
    await clearAuth();
  }, [clearAuth]);

  /**
   * EN: Rotates the refresh token, rejects results from an obsolete session epoch, and distinguishes suspension, invalid credentials, and transient failures.
   * UK: Оновлює refresh token, відкидає результат застарілої епохи сесії та розрізняє блокування, недійсні облікові дані й тимчасові помилки.
   */
  const refreshSession = useCallback(/* EN: Rotates credentials without applying an obsolete response. / UK: Оновлює облікові дані без застосування застарілої відповіді. */ async () => {
    const epoch = sessionEpoch.current;
    try {
      const data = await authService.refresh(await loadRefreshToken());
      if (epoch !== sessionEpoch.current) {
        await authService.logout(data.refreshToken).catch(/* EN: Best-effort revocation must not revive or apply an obsolete session. / UK: Спроба відкликання не повинна відновлювати або застосовувати застарілу сесію. */ () => {});
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

  useEffect(/* EN: Registers this provider as the central response to unauthorized, suspended, and refresh events from the API layer. / UK: Реєструє цей провайдер як центральний обробник подій неавторизованого доступу, блокування та оновлення з шару API. */ () => {
    setUnauthorizedHandler(clearAuth);
    setAccountSuspendedHandler(handleAccountSuspended);
    setRefreshHandler(refreshSession);
    return /* EN: Detaches global handlers on provider replacement or unmount to avoid calls into stale state. / UK: Від'єднує глобальні обробники під час заміни або демонтажу провайдера, щоб уникнути звернень до застарілого стану. */ () => {
      setUnauthorizedHandler(null);
      setAccountSuspendedHandler(null);
      setRefreshHandler(null);
    };
  }, [clearAuth, handleAccountSuspended, refreshSession]);

  useEffect(/* EN: While authenticated, schedules refresh, maintains presence, synchronizes push registration, and mirrors foreground transitions. / UK: Під час автентифікованої сесії планує оновлення, підтримує присутність, синхронізує push-реєстрацію та обробляє повернення застосунку на передній план. */ () => {
    if (!userToken) return;
    const refreshTimer = setTimeout(/* EN: Starts proactive access-token rotation before a typical short-lived token expires. / UK: Завчасно запускає оновлення access token до завершення дії типового короткочасного токена. */ () => {
      refreshAccessToken().catch(/* EN: A background refresh failure is deferred to the normal request-level authentication flow. / UK: Помилка фонового оновлення передається звичайному механізму автентифікації на рівні запиту. */ () => {});
    }, 4 * 60_000);
    /**
     * EN: Sends a best-effort heartbeat with stable installation identity when available; presence never blocks the session.
     * UK: Надсилає необов'язковий сигнал присутності зі сталим ідентифікатором встановлення, якщо він доступний; присутність ніколи не блокує сесію.
     */
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
      return apiFetch('/users/me/presence', { method: 'POST', body }, userToken).catch(/* EN: Presence is informational, so network failure is intentionally non-fatal. / UK: Присутність має інформаційний характер, тому помилка мережі навмисно не є критичною. */ () => {});
    };
    touchPresence();
    syncPushRegistration(userToken, Platform.OS !== 'web').catch(/* EN: Push registration is retried later and must not interrupt authentication. / UK: Реєстрація push-повідомлень буде повторена пізніше й не повинна переривати автентифікацію. */ () => {});
    const interval = setInterval(touchPresence, 60_000);
    const subscription = AppState.addEventListener('change', /* EN: Refreshes presence and push registration when the application becomes active again. / UK: Оновлює присутність і реєстрацію push-повідомлень, коли застосунок знову стає активним. */ (state) => {
      if (state === 'active') {
        touchPresence();
        syncPushRegistration(userToken, false).catch(/* EN: Foreground push synchronization remains best-effort and does not affect the signed-in UI. / UK: Синхронізація push-повідомлень після повернення на передній план залишається необов'язковою та не впливає на автентифікований інтерфейс. */ () => {});
      }
    });
    return /* EN: Stops timers and the application-state listener when the token changes or the provider unmounts. / UK: Зупиняє таймери та слухач стану застосунку після зміни токена або демонтажу провайдера. */ () => {
      clearTimeout(refreshTimer);
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshSession, userToken]);

  /**
   * EN: Interprets OAuth redirect outcomes, including suspension, denial, legacy token delivery, MFA challenges, and PKCE code exchange.
   * UK: Розбирає результати OAuth-перенаправлення, зокрема блокування, відмову, застарілу передачу токена, запити MFA та обмін коду PKCE.
   */
  const handleOAuthRedirect = useCallback(
    /* EN: Converts one OAuth redirect into suspension, MFA, or authenticated-session state. / UK: Перетворює OAuth-перенаправлення на стан блокування, MFA або автентифікованої сесії. */
    async (url, codeVerifier) => {
      if (!url) return false;

      const parsed = Linking.parse(url);
      const hash = url.includes('#') ? new URLSearchParams(url.split('#')[1]) : null;
      const error = parsed.queryParams?.error || hash?.get('error');
      const token = parsed.queryParams?.accessToken || hash?.get('accessToken');
      const mfaChallenge = hash?.get('mfaChallenge');
      const mfaEnrollmentRequired = hash?.get('mfaEnrollmentRequired');
      const code = parsed.queryParams?.code;

      if (error === 'account_banned') {
        await handleAccountSuspended({
          code: 'ACCOUNT_BANNED',
          expiresAt: parsed.queryParams?.expiresAt || hash?.get('expiresAt'),
          reason: parsed.queryParams?.reason || hash?.get('reason'),
        });
        return true;
      }
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
    [applySession, clearAuth, handleAccountSuspended, saveAuthToken],
  );

  useEffect(/* EN: Restores suspension or credentials at startup and installs native deep-link handling for later OAuth redirects. / UK: Під час запуску відновлює блокування або облікові дані та встановлює обробку нативних глибоких посилань для наступних OAuth-перенаправлень. */ () => {
    /**
     * EN: Bootstraps auth in precedence order: suspension, web redirect, server refresh, then stored native access token.
     * UK: Ініціалізує автентифікацію в порядку пріоритету: блокування, вебперенаправлення, серверне оновлення, а потім збережений нативний access token.
     */
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
    /**
     * EN: Forwards native OAuth links to the shared parser while deliberately refusing cold-start PKCE exchange without its in-memory verifier.
     * UK: Передає нативні OAuth-посилання спільному обробнику й навмисно не виконує PKCE-обмін після холодного запуску без перевірочного значення в пам'яті.
     */
    const handleDeepLink = async (event) => {
      if (!event?.url) return;
      // PKCE verifier is only held by the screen that initiated mobile OAuth.
      // A cold-start deep link without it is deliberately not accepted.
      await handleOAuthRedirect(event.url);
    };

    initAuth();

    // Підписка на Deep Link тільки для iOS / Android
    if (Platform.OS !== 'web') {
      Linking.getInitialURL().then(/* EN: Replays the launch URL once so OAuth completed while the app was closed can be recognized. / UK: Одноразово обробляє початкове посилання, щоб розпізнати OAuth, завершений під час закритого застосунку. */ (url) => {
        if (url) handleDeepLink({ url });
      });

      const subscription = Linking.addEventListener('url', handleDeepLink);
      return /* EN: Removes the native URL listener when authentication bootstrap dependencies change. / UK: Видаляє нативний слухач URL, коли змінюються залежності ініціалізації автентифікації. */ () => subscription.remove();
    }
  }, [handleOAuthRedirect, refreshSession]);

  /**
   * EN: Authenticates credentials, stores either an MFA challenge or a complete session, and exposes loading state through the whole attempt.
   * UK: Автентифікує облікові дані, зберігає або запит MFA, або повну сесію та показує стан завантаження протягом усієї спроби.
   */
  const login = useCallback(
    /* EN: Resolves credentials to either a pending MFA challenge or an active session. / UK: Перетворює облікові дані на незавершений запит MFA або активну сесію. */
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

  /**
   * EN: Requests enrollment details for the currently pending MFA challenge.
   * UK: Запитує дані налаштування для поточного незавершеного запиту MFA.
   */
  const beginMfaEnrollment = useCallback(/* EN: Starts enrollment for the pending MFA challenge. / UK: Починає налаштування для поточного запиту MFA. */ () => authService.beginMfaEnrollment(pendingMfa?.challengeToken), [pendingMfa]);

  /**
   * EN: Confirms MFA enrollment by pairing the entered one-time code with the pending challenge.
   * UK: Підтверджує налаштування MFA, поєднуючи введений одноразовий код із поточним запитом.
   */
  const confirmMfaEnrollment = useCallback(/* EN: Confirms MFA enrollment with the submitted code. / UK: Підтверджує налаштування MFA за допомогою надісланого коду. */ (code) => authService.confirmMfaEnrollment(pendingMfa?.challengeToken, code), [pendingMfa]);

  /**
   * EN: Promotes successful MFA data into the active session and then clears the pending challenge.
   * UK: Перетворює успішні дані MFA на активну сесію, а потім очищає незавершений запит.
   */
  const acceptMfaSession = useCallback(
    /* EN: Activates the MFA-verified session and closes the challenge. / UK: Активує підтверджену через MFA сесію та закриває запит. */
    async (data) => {
      await applySession(data);
      setPendingMfa(null);
    },
    [applySession],
  );

  /**
   * EN: Verifies the selected MFA factor and applies the returned authenticated session.
   * UK: Перевіряє вибраний чинник MFA та застосовує повернену автентифіковану сесію.
   */
  const verifyMfa = useCallback(
    /* EN: Verifies an MFA factor and accepts the resulting session. / UK: Перевіряє чинник MFA та приймає отриману сесію. */
    async (factor) => {
      const data = await authService.verifyMfa(pendingMfa?.challengeToken, factor);
      await acceptMfaSession(data);
      return data;
    },
    [acceptMfaSession, pendingMfa],
  );

  /**
   * EN: Abandons the local MFA flow without creating a session.
   * UK: Скасовує локальний процес MFA без створення сесії.
   */
  const cancelMfa = useCallback(/* EN: Discards the pending MFA challenge locally. / UK: Локально скасовує незавершений запит MFA. */ () => setPendingMfa(null), []);

  /**
   * EN: Creates an account while exposing form loading state; verification remains a separate required step.
   * UK: Створює обліковий запис і показує стан завантаження форми; підтвердження залишається окремим обов'язковим кроком.
   */
  const register = useCallback(/* EN: Submits account registration with shared loading state. / UK: Надсилає реєстрацію облікового запису зі спільним станом завантаження. */ async (email, password, displayName) => {
    setIsLoading(true);
    try {
      return await authService.register(email, password, displayName);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * EN: Submits the email verification code and maintains loading state without implicitly logging the user in.
   * UK: Надсилає код підтвердження електронної пошти та підтримує стан завантаження без автоматичного входу користувача.
   */
  const verifyRegistration = useCallback(/* EN: Verifies the registered email without creating a session. / UK: Підтверджує зареєстровану електронну пошту без створення сесії. */ async (email, code) => {
    setIsLoading(true);
    try {
      return await authService.verifyRegistration(email, code);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * EN: Best-effort unregisters push delivery and revokes the current refresh session, then always clears sensitive local state.
   * UK: За можливості скасовує реєстрацію push-доставки та відкликає поточну refresh-сесію, після чого завжди очищає конфіденційний локальний стан.
   */
  const logout = useCallback(/* EN: Attempts remote revocation and always clears this device. / UK: Намагається виконати віддалене відкликання та завжди очищає цей пристрій. */ async () => {
    setIsLoading(true);
    sessionEpoch.current += 1;
    try {
      if (userToken) await notificationService.unregister(userToken).catch(/* EN: Failure to unregister a device must not prevent local logout or server revocation. / UK: Помилка скасування реєстрації пристрою не повинна завадити локальному виходу або серверному відкликанню. */ () => {});
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

  /**
   * EN: Revokes every server session for the account and clears this device even if the remote request fails.
   * UK: Відкликає всі серверні сесії облікового запису й очищає цей пристрій навіть у разі помилки віддаленого запиту.
   */
  const logoutAll = useCallback(/* EN: Revokes all account sessions before clearing local state. / UK: Відкликає всі сесії облікового запису перед очищенням локального стану. */ async () => {
    setIsLoading(true);
    sessionEpoch.current += 1;
    try {
      await authService.logoutAll(userToken);
    } finally {
      await clearAuth();
      setIsLoading(false);
    }
  }, [clearAuth, userToken]);

  /**
   * EN: Keeps the persisted profile snapshot and reactive context value synchronized after profile changes.
   * UK: Синхронізує збережений знімок профілю та реактивне значення контексту після змін профілю.
   */
  const updateUserData = useCallback(/* EN: Synchronizes the stored and in-memory profile snapshot. / UK: Синхронізує збережений і поточний знімок профілю. */ async (user) => {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    setUserData(user);
  }, []);

  /**
   * EN: Removes the locally acknowledged suspension notice without restoring credentials or a session.
   * UK: Видаляє локально підтверджене повідомлення про блокування без відновлення облікових даних або сесії.
   */
  const dismissAccountSuspension = useCallback(/* EN: Acknowledges and removes the local suspension notice. / UK: Підтверджує та видаляє локальне повідомлення про блокування. */ async () => {
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
