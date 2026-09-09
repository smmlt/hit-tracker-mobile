import { apiRequest } from './api';

const identityContractHeaders = { 'X-Profile-Contract': 'v2' };

export const profileService = {
  get: (token) => apiRequest('/users/me', {
    headers: identityContractHeaders,
  }, token, 'Profile request failed'),
  checkUsername: (username, token, signal) => apiRequest(
    `/users/me/username-availability?username=${encodeURIComponent(username)}`,
    { signal },
    token,
    'Username availability check failed',
  ),
  update: (profile, token) => apiRequest('/users/me', {
    method: 'PATCH',
    headers: identityContractHeaders,
    body: JSON.stringify(profile),
  }, token, 'Profile request failed'),
  updateUsername: (username, token) => apiRequest('/users/me/username', {
    method: 'PATCH',
    body: JSON.stringify({ username }),
  }, token, 'Username update failed'),
};
