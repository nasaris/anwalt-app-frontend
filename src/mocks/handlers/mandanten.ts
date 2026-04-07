import { http, HttpResponse } from 'msw';
import { mandanten } from '../data/seedData';
import type { Mandant } from '../../types';

let mandantenDb = [...mandanten];

export const mandantenHandlers = [
  http.get('/api/mandanten', () => {
    return HttpResponse.json(mandantenDb);
  }),

  http.get('/api/mandanten/:id', ({ params }) => {
    const mandant = mandantenDb.find((m) => m.id === params.id);
    if (!mandant) {
      return HttpResponse.json({ message: 'Mandant nicht gefunden' }, { status: 404 });
    }
    return HttpResponse.json(mandant);
  }),

  http.post('/api/mandanten', async ({ request }) => {
    const body = (await request.json()) as Omit<Mandant, 'id' | 'erstelltAm'>;
    const neuerMandant: Mandant = {
      ...body,
      id: `m-${Date.now()}`,
      erstelltAm: new Date().toISOString(),
      kategorie: body.kategorie ?? 'privat',
      engagementStatus: body.engagementStatus ?? 'aktiv',
    };
    mandantenDb.push(neuerMandant);
    return HttpResponse.json(neuerMandant, { status: 201 });
  }),

  http.put('/api/mandanten/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Mandant>;
    const idx = mandantenDb.findIndex((m) => m.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Mandant nicht gefunden' }, { status: 404 });
    }
    mandantenDb[idx] = { ...mandantenDb[idx], ...body };
    return HttpResponse.json(mandantenDb[idx]);
  }),

  http.delete('/api/mandanten/:id', ({ params }) => {
    mandantenDb = mandantenDb.filter((m) => m.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
