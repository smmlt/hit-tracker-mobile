import { apiRequest } from './api';

export const bodyMetricsService = {
  get: (token, range) => apiRequest(
    `/users/me/body-metrics?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
    {},
    token,
    'Body metrics request failed',
  ),
  add: (token, measurement) => apiRequest(
    '/users/me/body-metrics',
    { method: 'POST', body: JSON.stringify(measurement) },
    token,
    'Body measurement could not be saved',
  ),
};
