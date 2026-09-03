import { apiRequest } from './api';

export const workoutsService = {
  async getHistory(token) {
    const data = await apiRequest('/workouts/history', {}, token, 'Failed to load history');
    return Array.isArray(data) ? data : [];
  },

  async deleteWorkout(token, workoutId) {
    await apiRequest(`/workouts/${workoutId}`, { method: 'DELETE' }, token, 'Failed to delete workout');
    return true;
  },
};
