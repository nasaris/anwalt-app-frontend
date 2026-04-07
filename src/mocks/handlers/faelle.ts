import { http, HttpResponse } from 'msw';
import { faelle } from '../data/seedData';
import type { Fall } from '../../types';

let faelleDb = [...faelle];

export const faelleHandlers = [
  // GET /api/faelle
  http.get('/api/faelle', ({ request }) => {
    const url = new URL(request.url);
    const rechtsgebiet = url.searchParams.get('rechtsgebiet');
    const status = url.searchParams.get('status');

    let result = faelleDb;
    if (rechtsgebiet) {
      result = result.filter((f) => f.rechtsgebiet === rechtsgebiet);
    }
    if (status) {
      result = result.filter((f) => f.status === status);
    }

    return HttpResponse.json(result);
  }),

  // GET /api/faelle/:id
  http.get('/api/faelle/:id', ({ params }) => {
    const fall = faelleDb.find((f) => f.id === params.id);
    if (!fall) {
      return HttpResponse.json({ message: 'Fall nicht gefunden' }, { status: 404 });
    }
    return HttpResponse.json(fall);
  }),

  // POST /api/faelle
  http.post('/api/faelle', async ({ request }) => {
    const body = (await request.json()) as Omit<Fall, 'id' | 'erstelltAm'>;
    const neuerFall: Fall = {
      ...body,
      id: `f-${Date.now()}`,
      erstelltAm: new Date().toISOString(),
    };
    faelleDb.push(neuerFall);
    return HttpResponse.json(neuerFall, { status: 201 });
  }),

  // PUT /api/faelle/:id
  http.put('/api/faelle/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Fall>;
    const idx = faelleDb.findIndex((f) => f.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Fall nicht gefunden' }, { status: 404 });
    }
    faelleDb[idx] = { ...faelleDb[idx], ...body };
    return HttpResponse.json(faelleDb[idx]);
  }),

  // DELETE /api/faelle/:id
  http.delete('/api/faelle/:id', ({ params }) => {
    const idx = faelleDb.findIndex((f) => f.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Fall nicht gefunden' }, { status: 404 });
    }
    faelleDb.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
