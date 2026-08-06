import { API_URL } from '../constants/config';

export const workoutsService = {
  async getHistory(token) {
    const response = await fetch(`${API_URL}/workouts/history`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to load history');
    return Array.isArray(data) ? data : [];
  },

  async deleteWorkout(token, workoutId) {
    const response = await fetch(`${API_URL}/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to delete workout');
    return true;
  },
};