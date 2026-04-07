import client from './client';
import type { Mandant } from '../types';

export const mandantenApi = {
  getAll: () =>
    client.get<Mandant[]>('/api/mandanten').then((r) => r.data),

  getById: (id: string) =>
    client.get<Mandant>(`/api/mandanten/${id}`).then((r) => r.data),

  create: (data: Omit<Mandant, 'id' | 'erstelltAm'>) =>
    client.post<Mandant>('/api/mandanten', data).then((r) => r.data),

  update: (id: string, data: Partial<Mandant>) =>
    client.put<Mandant>(`/api/mandanten/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/mandanten/${id}`),
};
