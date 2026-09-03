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
};
