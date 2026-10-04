import { Platform } from 'react-native';
import { apiRequest } from './api';

export const authService = {
  login: (email, password) =>
    apiRequest(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          client: Platform.OS === 'web' ? 'web' : 'native',
        }),
      },
      null,
      'Login failed',
    ),

  register: (email, password, displayName) =>
    apiRequest(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      },
      null,
      'Registration failed',
    ),

  verifyRegistration: (email, code) =>
    apiRequest(
      '/auth/register/verify',
      {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      },
      null,
      'Email verification failed',
    ),

  exchangeOAuthCode: (code, codeVerifier) =>
    apiRequest(
      '/auth/oauth/exchange',
      {
        method: 'POST',
        body: JSON.stringify({ code, codeVerifier }),
      },
      null,
      'Google sign-in failed',
    ),

  refresh: (refreshToken) =>
    apiRequest(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      },
      null,
      'Session refresh failed',
    ),

  logout: (refreshToken) =>
    apiRequest(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      },
      null,
      'Logout failed',
    ),

  beginMfaEnrollment: (challengeToken) =>
    apiRequest(
      '/auth/mfa/enroll/start',
      {
        method: 'POST',
        body: JSON.stringify({ challengeToken }),
      },
      null,
      'Could not start two-factor authentication setup',
    ),

  confirmMfaEnrollment: (challengeToken, code) =>
    apiRequest(
      '/auth/mfa/enroll/confirm',
      {
        method: 'POST',
        body: JSON.stringify({
          challengeToken,
          code,
          client: Platform.OS === 'web' ? 'web' : 'native',
        }),
      },
      null,
      'Could not enable two-factor authentication',
    ),

  verifyMfa: (challengeToken, factor) =>
    apiRequest(
      '/auth/mfa/verify',
      {
        method: 'POST',
        body: JSON.stringify({
          challengeToken,
          ...factor,
          client: Platform.OS === 'web' ? 'web' : 'native',
        }),
      },
      null,
      'Two-factor verification failed',
    ),

  getMfaStatus: (token) => apiRequest('/auth/mfa/status', {}, token),

  regenerateMfaRecoveryCodes: (code, token) =>
    apiRequest(
      '/auth/mfa/recovery/regenerate',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      },
      token,
      'Could not regenerate recovery codes',
    ),

  disableMfa: (code, token) =>
    apiRequest(
      '/auth/mfa/disable',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      },
      token,
      'Could not disable two-factor authentication',
    ),

  logoutAll: (token) => apiRequest('/auth/logout-all', { method: 'POST' }, token),
};
