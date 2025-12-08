import { request } from './http';

export const getContainers = () => request('/containers');

export const checkContainerUpdate = (id) =>
  request(`/containers/${id}/check-update`, { method: 'POST' });

export const updateContainer = (id) =>
  request(`/containers/${id}/update`, { method: 'POST' });
