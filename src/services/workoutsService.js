import { API_URL } from '../constants/config';

export const workoutsService = {
  async getHistory(token) {
    const response = await fetch(`${API_URL}/workouts/history`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json',
      },
    });

    // СПОЧАТКУ перевіряємо чи статус успішний (ok: true)
    if (!response.ok) {
      let errorMessage = 'Failed to load history';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async deleteWorkout(token, workoutId) {
    const response = await fetch(`${API_URL}/workouts/${workoutId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete workout');
    }
    
    return true;
  },
};