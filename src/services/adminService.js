import { apiFetch } from './api';

const request = async (endpoint, options, token) => {
  const response = await apiFetch(endpoint, options, token);
  if (response.ok) return response.data;

  const error = new Error(response.data?.message || 'Admin request failed');
  error.status = response.status;
  throw error;
};

export const adminService = {
  listUsers: ({ search, page }, token) => request(
    `/admin/users?${new URLSearchParams({ ...(search ? { search } : {}), page: String(page) })}`,
    {},
    token,
  ),
  updateRole: (id, role, token) => request(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }, token),
};
