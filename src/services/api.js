// EN: Central HTTP boundary: resolves the API host, adds credentials, normalizes errors, refreshes expired sessions once, and retries safely.
// UK: Центральна HTTP-межа: визначає API host, додає credentials, нормалізує помилки, один раз оновлює прострочену сесію та безпечно повторює запит.
// EN: Relative endpoints are joined to API_URL; a 401 refresh is shared by unauthorized.js and the original request is retried once.
// UK: Відносні endpoint-и доповнюються API_URL; після 401 unauthorized.js спільно оновлює токен і повторює початковий запит один раз.
import { API_URL } from '../constants/config';
import { isMultipartBody } from '../utils/requestBody';
import { notifyAccountSuspended, notifyUnauthorized, refreshAccessToken } from './unauthorized';

/** EN: Sends one HTTP request, performs at most one shared token refresh, and returns a normalized response envelope. UK: Надсилає один HTTP-запит, виконує щонайбільше одне спільне оновлення токена та повертає нормалізовану відповідь. */
export async function apiFetch(endpoint, options = {}, userToken = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  /** EN: Builds headers for the current body type, attaches an optional bearer token, and performs the underlying fetch. UK: Формує заголовки для поточного типу даних, додає необов’язковий bearer-токен і виконує базовий fetch-запит. */
  const send = (token) => {
    const isMultipart = isMultipartBody(options.body);
    const headers = {
      ...(!isMultipart && { 'Content-Type': 'application/json' }),
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

  if (response.status === 403 && data?.code === 'ACCOUNT_BANNED') {
    notifyAccountSuspended(data);
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    retryAfter: response.headers.get('Retry-After'),
  };
}

/** EN: Returns successful response data or throws an Error enriched with status, details, and retry timing. UK: Повертає дані успішної відповіді або викидає Error зі статусом, деталями та часом повторної спроби. */
export async function apiRequest(endpoint, options = {}, userToken = null, fallbackMessage = 'Request failed') {
  const response = await apiFetch(endpoint, options, userToken);
  if (response.ok) return response.data;

  const error = new Error(response.data?.message || fallbackMessage);
  error.status = response.status;
  error.details = response.data;
  if (response.retryAfter) {
    const retryAfter = Number(response.retryAfter);
    // Retry-After uses the standard HTTP seconds unit.
    error.retryAfterSeconds = Math.ceil(retryAfter);
  }
  throw error;
}
