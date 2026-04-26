import client from './client';
import type { Schriftverkehr } from '../types';

export const schriftverkehrApi = {
  getByFall: (fallId: string) =>
    client.get<Schriftverkehr[]>('/api/schriftverkehr', { params: { fallId } }).then((r) => r.data),

  create: (data: Omit<Schriftverkehr, 'id' | 'erstelltAm'>) =>
    client.post<Schriftverkehr>('/api/schriftverkehr', data).then((r) => r.data),

  update: (id: string, changes: Partial<Omit<Schriftverkehr, 'id' | 'fallId' | 'erstelltAm'>>) =>
    client.patch<Schriftverkehr>(`/api/schriftverkehr/${id}`, changes).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/schriftverkehr/${id}`),
};
