import { request } from './http';

export async function getHistory(params = {}) {
  const query = new URLSearchParams();

  if (params.action) query.append('action', params.action);
  if (params.status) query.append('status', params.status);
  if (params.limit) query.append('limit', params.limit);

  const qs = query.toString() ? `?${query.toString()}` : '';
  return request(`/history${qs}`);
}
