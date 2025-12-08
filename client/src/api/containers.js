import { request } from './http';

export const getContainers = () => request('/containers');

export const checkContainerUpdate = (id) =>
  request(`/containers/${id}/check-update`, { method: 'POST' });

export const updateContainer = (id) =>
  request(`/containers/${id}/update`, { method: 'POST' });

export const updateAllContainers = () =>
  request('/containers/update-all', { method: 'POST' });

export const setContainerExclusion = (id, excluded) =>
  request(`/containers/${id}/exclusion`, {
    method: 'POST',
    body: JSON.stringify({ excluded }),
  });
