import { apiRequest } from './api';

export const profileService = {
  get: (token) => apiRequest('/users/me', {}, token, 'Profile request failed'),
  update: (profile, token) => apiRequest('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }, token, 'Profile request failed'),
};
