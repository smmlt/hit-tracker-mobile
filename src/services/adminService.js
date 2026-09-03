import { apiRequest } from './api';

export const adminService = {
  listUsers: ({ search, page }, token) => apiRequest(
    `/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page) })}`,
    {},
    token, 'Admin request failed',
  ),
  updateRole: (id, role, token) => apiRequest(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token, 'Admin request failed'),
  deleteUser: (id, token) => apiRequest(`/admin/users/${id}`, { method: 'DELETE' }, token, 'Admin request failed'),
};
