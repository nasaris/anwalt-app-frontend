import { http, HttpResponse } from 'msw';
import { parteien, wiedervorlagen } from '../data/seedData';
import type { Partei, Wiedervorlage } from '../../types';

let parteienDb = [...parteien];
let wiedervorlagenDb = [...wiedervorlagen];

export const parteienHandlers = [
  http.get('/api/parteien', ({ request }) => {
    const url = new URL(request.url);
    const typ = url.searchParams.get('typ');
    const result = typ ? parteienDb.filter((p) => p.typ === typ) : parteienDb;
    return HttpResponse.json(result);
  }),

  http.get('/api/parteien/:id', ({ params }) => {
    const partei = parteienDb.find((p) => p.id === params.id);
    if (!partei) {
      return HttpResponse.json({ message: 'Partei nicht gefunden' }, { status: 404 });
    }
    return HttpResponse.json(partei);
  }),

  http.post('/api/parteien', async ({ request }) => {
    const body = (await request.json()) as Omit<Partei, 'id'>;
    const neuePartei: Partei = { ...body, id: `p-${Date.now()}` };
    parteienDb.push(neuePartei);
    return HttpResponse.json(neuePartei, { status: 201 });
  }),

  http.put('/api/parteien/:id', async ({ params, request }) => {
    const body = (await request.json()) as Partial<Partei>;
    const idx = parteienDb.findIndex((p) => p.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Partei nicht gefunden' }, { status: 404 });
    }
    parteienDb[idx] = { ...parteienDb[idx], ...body };
    return HttpResponse.json(parteienDb[idx]);
  }),

  http.delete('/api/parteien/:id', ({ params }) => {
    parteienDb = parteienDb.filter((p) => p.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];

export const wiedervorlagenHandlers = [
  http.get('/api/wiedervorlagen', ({ request }) => {
    const url = new URL(request.url);
    const fallId = url.searchParams.get('fallId');
    const nurOffene = url.searchParams.get('nurOffene');

    let result = wiedervorlagenDb;
    if (fallId) result = result.filter((w) => w.fallId === fallId);
    if (nurOffene === 'true') result = result.filter((w) => !w.erledigt);

    // Sortiert nach Fälligkeit
    result = [...result].sort(
      (a, b) => new Date(a.faelligAm).getTime() - new Date(b.faelligAm).getTime()
    );

    return HttpResponse.json(result);
  }),

  http.put('/api/wiedervorlagen/:id/erledigen', ({ params }) => {
    const idx = wiedervorlagenDb.findIndex((w) => w.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ message: 'Wiedervorlage nicht gefunden' }, { status: 404 });
    }
    wiedervorlagenDb[idx] = { ...wiedervorlagenDb[idx], erledigt: true };
    return HttpResponse.json(wiedervorlagenDb[idx]);
  }),

  http.post('/api/wiedervorlagen', async ({ request }) => {
    const body = (await request.json()) as Omit<Wiedervorlage, 'id'>;
    const neue: Wiedervorlage = { ...body, id: `w-${Date.now()}` };
    wiedervorlagenDb.push(neue);
    return HttpResponse.json(neue, { status: 201 });
  }),
];
