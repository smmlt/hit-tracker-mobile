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

export const analyticsService = {
  summary: (token) => apiRequest('/analytics/me/summary', {}, token),
  overview: (token, range) => apiRequest(`/analytics/me/overview${rangeQuery(range)}`, {}, token),
  weeklyVolume: (token, weeks = 12) => apiRequest(`/analytics/me/weekly-volume?weeks=${weeks}`, {}, token),
  personalRecords: (token) => apiRequest('/analytics/me/personal-records', {}, token),
  exerciseProgress: (token, exerciseId, range) => apiRequest(`/analytics/me/exercises/${encodeURIComponent(exerciseId)}/progress${rangeQuery(range)}`, {}, token),
  exerciseSets: (token, exerciseId, range) => apiRequest(`/analytics/me/exercises/${encodeURIComponent(exerciseId)}/sets${rangeQuery(range)}`, {}, token),
  dailyIntensity: (token, date) => apiRequest(`/analytics/me/intensity${queryString({ date })}`, {}, token),
  muscleGroups: (token, range, metric = 'workingSets') => apiRequest(`/analytics/me/muscle-groups${queryString({ ...range, metric })}`, {}, token),
  bodyMetrics: (token, range) => apiRequest(`/analytics/me/body-metrics${rangeQuery(range)}`, {}, token),
};
