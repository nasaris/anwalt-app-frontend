import client from './client';
import type { Fall, FallStatus } from '../types';

export interface FaelleFilter {
  rechtsgebiet?: 'verkehrsrecht' | 'arbeitsrecht';
  status?: FallStatus;
}

export const faelleApi = {
  getAll: (filter?: FaelleFilter) =>
    client.get<Fall[]>('/api/faelle', { params: filter }).then((r) => r.data),

  getById: (id: string) =>
    client.get<Fall>(`/api/faelle/${id}`).then((r) => r.data),

  create: (data: Omit<Fall, 'id' | 'erstelltAm'>) =>
    client.post<Fall>('/api/faelle', data).then((r) => r.data),

  update: (id: string, data: Partial<Fall>) =>
    client.put<Fall>(`/api/faelle/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/faelle/${id}`),
};
