import { API_URL } from '../constants/config';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Login failed');
      error.status = response.status;
      throw error;
    }
    return data;
  },

  async register(fullName, email, password) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await response.json();
    
    if (!response.ok) {
      const error = new Error(data.message || 'Registration failed');
      error.status = response.status;
      throw error;
    }
    return data;
  },

  async verifyRegistration(email, code) {
    const response = await fetch(`${API_URL}/auth/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.message || 'Email verification failed');
      error.status = response.status;
      error.details = data;
      throw error;
    }
    return data;
  },
};
