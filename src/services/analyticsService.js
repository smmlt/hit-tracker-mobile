import { apiRequest } from './api';

const rangeQuery = ({ from, to } = {}) => {
  const parts = [];
  if (from) parts.push(`from=${encodeURIComponent(from)}`);
  if (to) parts.push(`to=${encodeURIComponent(to)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export const analyticsService = {
  summary: (token) => apiRequest('/analytics/me/summary', {}, token),
  weeklyVolume: (token, weeks = 12) => apiRequest(`/analytics/me/weekly-volume?weeks=${weeks}`, {}, token),
  personalRecords: (token) => apiRequest('/analytics/me/personal-records', {}, token),
  exerciseProgress: (token, exerciseId, range) => apiRequest(`/analytics/me/exercises/${encodeURIComponent(exerciseId)}/progress${rangeQuery(range)}`, {}, token),
  bodyMetrics: (token, range) => apiRequest(`/analytics/me/body-metrics${rangeQuery(range)}`, {}, token),
};
