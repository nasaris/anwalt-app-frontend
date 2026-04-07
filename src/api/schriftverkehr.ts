import client from './client';
import type { Schriftverkehr } from '../types';

export const schriftverkehrApi = {
  getByFall: (fallId: string) =>
    client.get<Schriftverkehr[]>('/api/schriftverkehr', { params: { fallId } }).then((r) => r.data),

  create: (data: Omit<Schriftverkehr, 'id' | 'erstelltAm'>) =>
    client.post<Schriftverkehr>('/api/schriftverkehr', data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/schriftverkehr/${id}`),
};
