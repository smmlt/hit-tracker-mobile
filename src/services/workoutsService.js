// EN: Wraps workout lifecycle and history endpoints so screens do not construct session URLs or request payloads themselves.
// UK: Інкапсулює endpoints життєвого циклу й історії тренувань, щоб екрани не формували URL і payload сесій самостійно.
import { apiRequest } from './api';

export const workoutsService = {
  async getHistory(token, filters = {}) {
    const query = Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return apiRequest(`/workouts/history${query ? `?${query}` : ''}`, { cache: 'no-store' }, token, 'Failed to load history');
  },

  async getHistoryDates(token, from, to) {
    const query = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    const data = await apiRequest(`/workouts/history/dates?${query}`, {}, token, 'Failed to load history dates');
    return Array.isArray(data) ? data : [];
  },

  async getHistoryDetails(token, workoutId) {
    return apiRequest(`/workouts/history/${workoutId}`, {}, token, 'Failed to load workout details');
  },

  async deleteWorkout(token, workoutId) {
    await apiRequest(`/workouts/${workoutId}`, { method: 'DELETE' }, token, 'Failed to delete workout');
    return true;
  },
};
