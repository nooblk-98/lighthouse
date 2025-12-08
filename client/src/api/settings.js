import { request } from './http';

export const getSettings = () => request('/settings');

export const saveSettings = (payload) =>
  request('/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
