import { apiRequest } from './api';
import { normalizeObservability } from '../utils/adminObservability';
import { createMediaFormData } from './mediaFormData';

export const adminService = {
  listUsers: ({ search, page, online }, token) =>
    apiRequest(`/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), ...(online ? { online: 'true' } : {}), page: String(page) })}`, {}, token, 'Admin request failed'),
  getUserDetails: (id, token) => apiRequest(`/admin/users/${id}`, {}, token, 'Could not load user details'),
  getUserActivity: (id, page, token) => apiRequest(`/admin/users/${id}/activity?${new URLSearchParams({ page: String(page), limit: '25' })}`, {}, token, 'Could not load user activity'),
  getObservability: async (token) => normalizeObservability(await apiRequest('/admin/observability', {}, token, 'Could not load system status')),
  updateRole: (id, role, token) =>
    apiRequest(
      `/admin/users/${id}/role`,
      {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      },
      token,
      'Admin request failed',
    ),
  deleteUser: (id, token) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }, token, 'Admin request failed'),
  revokeUserSessions: (id, token) => apiRequest(`/admin/users/${id}/revoke-sessions`, { method: 'POST' }, token, 'Could not revoke user sessions'),
  suspendUser: (id, payload, token) => apiRequest(`/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify(payload) }, token, 'Could not suspend the user'),
  unsuspendUser: (id, token) => apiRequest(`/admin/users/${id}/unsuspend`, { method: 'POST' }, token, 'Could not restore the user'),
  sendNotification: (payload, token, idempotencyKey) =>
    apiRequest(
      '/admin/notifications',
      {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      },
      token,
      'Could not queue notification',
    ),
  uploadNotificationImage: async (asset, token) =>
    apiRequest(
      '/admin/notifications/media',
      {
        method: 'POST',
        body: await createMediaFormData(asset),
      },
      token,
      'Could not upload notification image',
    ),
  listNotificationMedia: (token) => apiRequest('/admin/notifications/media', {}, token, 'Could not load notification images'),
  listNotificationHistory: (token) => apiRequest('/admin/notifications/history', {}, token, 'Could not load notification history'),
};
