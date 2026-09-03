import { API_URL } from '../constants/config';
import { notifyUnauthorized } from './unauthorized';

/**
 * Універсальна обгортка над стандартним fetch для автоматичного додавання 
 * авторизації, заголовка ngrok та обробки JSON.
 */
export async function apiFetch(endpoint, options = {}, userToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };

  if (userToken) {
    headers['Authorization'] = `Bearer ${userToken}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  // Додай цей лог для відладки:
  // console.log('📡 FETCHING URL:', url);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && userToken) notifyUnauthorized();

  // Якщо сервер повернув порожню відповідь або статус 204
  if (response.status === 204) {
    return { ok: true, data: null };
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export async function apiRequest(endpoint, options = {}, userToken = null, fallbackMessage = 'Request failed') {
  const response = await apiFetch(endpoint, options, userToken);
  if (response.ok) return response.data;

  const error = new Error(response.data?.message || fallbackMessage);
  error.status = response.status;
  throw error;
}
