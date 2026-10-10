import { apiRequest } from './api';

const rangeQuery = ({ from, to } = {}) => {
  const parts = [];
  if (from) parts.push(`from=${encodeURIComponent(from)}`);
  if (to) parts.push(`to=${encodeURIComponent(to)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const queryString = (values) => {
  const parts = Object.entries(values)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

const withTimeZone = ({ from, to } = {}) => ({
  from,
  to,
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
});

export const analyticsService = {
  summary: (token) => apiRequest('/analytics/me/summary', {}, token),
  overview: (token, range) => apiRequest(`/analytics/me/overview${queryString(withTimeZone(range))}`, {}, token),
  weeklyVolume: (token, weeks = 12) => apiRequest(`/analytics/me/weekly-volume?weeks=${weeks}`, {}, token),
  personalRecords: (token) => apiRequest('/analytics/me/personal-records', {}, token),
  exerciseProgress: (token, exerciseId, range) => apiRequest(`/analytics/me/exercises/${encodeURIComponent(exerciseId)}/progress${rangeQuery(range)}`, {}, token),
  exerciseSets: (token, exerciseId, range) => apiRequest(`/analytics/me/exercises/${encodeURIComponent(exerciseId)}/sets${rangeQuery(range)}`, {}, token),
  intensity: (token, range) => apiRequest(`/analytics/me/intensity${queryString(withTimeZone(range))}`, {}, token),
  muscleGroups: (token, range) => apiRequest(`/analytics/me/muscle-groups${queryString(withTimeZone(range))}`, {}, token),
  strength: (token, range) => apiRequest(`/analytics/me/strength${rangeQuery(range)}`, {}, token),
  bodyMetrics: (token, range) => apiRequest(`/analytics/me/body-metrics${rangeQuery(range)}`, {}, token),
  schedule: (token, date) => apiRequest(`/workout-programs/schedule?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`, {}, token),
};
