import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { apiRequest } from './api';
import { getInstallationId } from '../utils/installationId';
import {
  addPushListeners,
  getPushRegistration,
} from '../utils/pushRegistration';

export const notificationService = {
  getPreferences: (token) => apiRequest('/notifications/preferences', {}, token),
  updatePreferences: (preferences, token) => apiRequest('/notifications/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  }, token),
  list: (token, page = 1, limit = 25) => apiRequest(
    `/notifications?${new URLSearchParams({ page: String(page), limit: String(limit) })}`,
    {},
    token,
  ),
  markRead: (id, token) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }, token),
  markAllRead: (token) => apiRequest('/notifications/read-all', { method: 'POST' }, token),
  sendTest: (token) => apiRequest('/notifications/test', { method: 'POST' }, token),
  unregister: async (token) => {
    const installationId = await getInstallationId(AsyncStorage, Crypto.randomUUID);
    return apiRequest(`/notifications/devices/${installationId}`, { method: 'DELETE' }, token);
  },
};

export async function syncPushRegistration(token, requestPermission = false) {
  const registration = await getPushRegistration(requestPermission);
  const installationId = await getInstallationId(AsyncStorage, Crypto.randomUUID);
  await apiRequest('/notifications/devices', {
    method: 'PUT',
    body: JSON.stringify({ installationId, ...registration }),
  }, token);
  return registration;
}

export { addPushListeners };
