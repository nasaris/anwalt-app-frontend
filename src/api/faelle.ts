import client from './client';
import type { Fall, FallAktivitaet, FallStatus } from '../types';

/** Neuer Aktivitätseintrag (ohne id; zeitpunkt optional — Server/Mock setzt bei Bedarf jetzt) */
export type FallAktivitaetCreate = Omit<FallAktivitaet, 'id' | 'zeitpunkt'> & { zeitpunkt?: string };

export interface FallAktivitaetUpdateBody {
  titel: string;
  beschreibung?: string;
}

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

  addAktivitaet: (id: string, data: FallAktivitaetCreate) =>
    client.post<Fall>(`/api/faelle/${id}/aktivitaeten`, data).then((r) => r.data),

  updateAktivitaet: (fallId: string, aktivitaetId: string, data: FallAktivitaetUpdateBody) =>
    client.put<Fall>(`/api/faelle/${fallId}/aktivitaeten/${aktivitaetId}`, data).then((r) => r.data),

  deleteAktivitaet: (fallId: string, aktivitaetId: string) =>
    client.delete<Fall>(`/api/faelle/${fallId}/aktivitaeten/${aktivitaetId}`).then((r) => r.data),

  delete: (id: string) =>
    client.delete(`/api/faelle/${id}`),
};
