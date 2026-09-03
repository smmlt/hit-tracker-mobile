import { apiRequest } from './api';

export const authService = {
  login: (email, password) => apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, null, 'Login failed'),

  register: (email, password) => apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }, null, 'Registration failed'),

  verifyRegistration: (email, code) => apiRequest('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }, null, 'Email verification failed'),

  exchangeOAuthCode: (code, codeVerifier) => apiRequest('/auth/oauth/exchange', {
    method: 'POST',
    body: JSON.stringify({ code, codeVerifier }),
  }, null, 'Google sign-in failed'),
};
