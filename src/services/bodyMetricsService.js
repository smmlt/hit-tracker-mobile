// EN: Wraps authenticated body-measurement history, creation, update, and deletion endpoints.
// UK: Інкапсулює авторизовані endpoints історії, створення, оновлення та видалення вимірювань тіла.
import { apiRequest } from './api';

export const bodyMetricsService = {
  /** EN: Loads the authenticated user's measurements inside an inclusive date range. UK: Завантажує вимірювання автентифікованого користувача в заданому діапазоні дат. */
  get: (token, range) => apiRequest(
    `/users/me/body-metrics?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`,
    {},
    token,
    'Body metrics request failed',
  ),
  /** EN: Creates one body-measurement record for the authenticated user. UK: Створює один запис вимірювань тіла для автентифікованого користувача. */
  add: (token, measurement) => apiRequest(
    '/users/me/body-metrics',
    { method: 'POST', body: JSON.stringify(measurement) },
    token,
    'Body measurement could not be saved',
  ),
};
