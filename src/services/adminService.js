import { apiRequest } from './api';

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
  updateRole: (id, role, token) => apiRequest(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token, 'Admin request failed'),
  deleteUser: (id, token) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }, token, 'Admin request failed'),
};
