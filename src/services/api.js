import { API_URL } from '../constants/config';
import { notifyUnauthorized, refreshAccessToken } from './unauthorized';

/**
 * Універсальна обгортка над стандартним fetch для автоматичного додавання 
 * авторизації, заголовка ngrok та обробки JSON.
 */
export async function apiFetch(endpoint, options = {}, userToken = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const send = (token) => {
    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      ...(options.headers || {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, credentials: 'include', headers });
  };

  let response = await send(userToken);
  if (response.status === 401 && userToken) {
    const nextToken = await refreshAccessToken();
    if (nextToken) response = await send(nextToken);
    if (!nextToken || response.status === 401) notifyUnauthorized();
  }

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
    retryAfter: response.headers.get('Retry-After'),
  };
}

export async function apiRequest(endpoint, options = {}, userToken = null, fallbackMessage = 'Request failed') {
  const response = await apiFetch(endpoint, options, userToken);
  if (response.ok) return response.data;

  const error = new Error(response.data?.message || fallbackMessage);
  error.status = response.status;
  error.details = response.data;
  if (response.retryAfter) {
    const retryAfter = Number(response.retryAfter);
    // Nest's throttler currently sends milliseconds; standard HTTP uses seconds.
    error.retryAfterSeconds = Math.ceil(retryAfter > 1_000 ? retryAfter / 1_000 : retryAfter);
  }
  throw error;
}
