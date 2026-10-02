import { apiRequest } from './api';
import { normalizeObservability } from '../utils/adminObservability';

export const adminService = {
  listUsers: ({ search, page, online }, token) => apiRequest(
    `/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), ...(online ? { online: 'true' } : {}), page: String(page) })}`,
    {},
    token, 'Admin request failed',
  ),
  getUserDetails: (id, token) => apiRequest(
    `/admin/users/${id}`,
    {},
    token,
    'Could not load user details',
  ),
  getUserActivity: (id, page, token) => apiRequest(
    `/admin/users/${id}/activity?${new URLSearchParams({ page: String(page), limit: '25' })}`,
    {},
    token,
    'Could not load user activity',
  ),
  getObservability: async (token) => normalizeObservability(await apiRequest(
    '/admin/observability', {}, token, 'Could not load system status',
  )),
  updateRole: (id, role, token) => apiRequest(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token, 'Admin request failed'),
  deleteUser: (id, token) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }, token, 'Admin request failed'),
  sendNotification: (payload, token) => apiRequest('/admin/notifications', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, token, 'Could not queue notification'),
};
