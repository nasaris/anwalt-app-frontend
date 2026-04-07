import { http, HttpResponse } from 'msw';
import type { Schriftverkehr } from '../../types';

let db: Schriftverkehr[] = [];

export const schriftverkehrHandlers = [
  // GET /api/schriftverkehr?fallId=xxx
  http.get('/api/schriftverkehr', ({ request }) => {
    const url = new URL(request.url);
    const fallId = url.searchParams.get('fallId');
    const result = fallId ? db.filter((s) => s.fallId === fallId) : db;
    return HttpResponse.json([...result].sort((a, b) => b.datum.localeCompare(a.datum)));
  }),

  // POST /api/schriftverkehr
  http.post('/api/schriftverkehr', async ({ request }) => {
    const body = (await request.json()) as Omit<Schriftverkehr, 'id' | 'erstelltAm'>;
    const neu: Schriftverkehr = {
      ...body,
      id: `sv-${Date.now()}`,
      erstelltAm: new Date().toISOString(),
    };
    db.push(neu);
    return HttpResponse.json(neu, { status: 201 });
  }),

  // DELETE /api/schriftverkehr/:id
  http.delete('/api/schriftverkehr/:id', ({ params }) => {
    const idx = db.findIndex((s) => s.id === params.id);
    if (idx === -1) return HttpResponse.json({ message: 'Nicht gefunden' }, { status: 404 });
    db.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
