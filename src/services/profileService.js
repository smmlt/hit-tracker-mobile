import { apiFetch } from './api';

const request = async (endpoint, options, token) => {
  const response = await apiFetch(endpoint, options, token);
  if (response.ok) return response.data;

  const error = new Error(response.data?.message || 'Profile request failed');
  error.status = response.status;
  throw error;
};

export const profileService = {
  get: (token) => request('/users/me', {}, token),
  update: (profile, token) => request('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }, token),
};
