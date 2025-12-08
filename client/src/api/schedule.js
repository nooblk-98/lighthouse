import { request } from './http';

export const getSchedule = () => request('/schedule');
