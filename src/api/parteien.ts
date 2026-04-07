import client from './client';
import type { Partei, ParteienTyp, Wiedervorlage } from '../types';

export const parteienApi = {
  getAll: (typ?: ParteienTyp) =>
    client.get<Partei[]>('/api/parteien', { params: typ ? { typ } : {} }).then((r) => r.data),

  getById: (id: string) =>
    client.get<Partei>(`/api/parteien/${id}`).then((r) => r.data),

  create: (data: Omit<Partei, 'id'>) =>
    client.post<Partei>('/api/parteien', data).then((r) => r.data),

  update: (id: string, data: Partial<Partei>) =>
    client.put<Partei>(`/api/parteien/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/parteien/${id}`),
};

export const wiedervorlagenApi = {
  getAll: (params?: { fallId?: string; nurOffene?: boolean }) =>
    client.get<Wiedervorlage[]>('/api/wiedervorlagen', { params }).then((r) => r.data),

  erledigen: (id: string) =>
    client.put<Wiedervorlage>(`/api/wiedervorlagen/${id}/erledigen`).then((r) => r.data),

  create: (data: Omit<Wiedervorlage, 'id'>) =>
    client.post<Wiedervorlage>('/api/wiedervorlagen', data).then((r) => r.data),
};
