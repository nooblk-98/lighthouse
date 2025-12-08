import { request } from './http';

export const getSettings = () => request('/settings');

export const saveSettings = (payload) =>
  request('/settings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const validateRegistry = ({ provider, username, token }) =>
  request('/registries/validate', {
    method: 'POST',
    body: JSON.stringify({ provider, username, token }),
  });

export const validateSmtp = ({ host, port, username, password, use_tls }) =>
  request('/notifications/validate', {
    method: 'POST',
    body: JSON.stringify({ host, port, username, password, use_tls }),
  });
