import { request, requestBlob } from './http';

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

export const exportSettingsBackup = ({ password, format = 'json' }) =>
  requestBlob('/settings/export', {
    method: 'POST',
    body: JSON.stringify({ password, format }),
  });

export const importSettingsBackup = ({ password, content }) =>
  request('/settings/import', {
    method: 'POST',
    body: JSON.stringify({ password, content }),
  });
