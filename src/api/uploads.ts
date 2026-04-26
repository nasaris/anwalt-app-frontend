import client from './client';
import type { UploadedDatei, DateiKategorie } from '../store/dokumenteStore';

export const uploadsApi = {
  list: (fallId: string) =>
    client.get<UploadedDatei[]>(`/api/faelle/${fallId}/uploads`).then((r) => r.data),

  upload: async (fallId: string, file: File, kategorie: DateiKategorie) => {
    const form = new FormData();
    form.append('file', file);
    form.append('kategorie', String(kategorie || 'sonstiges'));
    const resp = await client.post<UploadedDatei>(`/api/faelle/${fallId}/uploads`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return resp.data;
  },

  delete: (fallId: string, uploadId: string) =>
    client.delete(`/api/faelle/${fallId}/uploads/${uploadId}`),

  contentUrl: (fallId: string, uploadId: string) => `/api/faelle/${fallId}/uploads/${uploadId}/content`,
};

