import { format, parseISO } from 'date-fns';
import type { Fall, Wiedervorlage } from '../../types';
import { fristDringlichkeit, type FristDringlichkeit } from '../../utils/fristBerechnung';

export type KalenderEventQuelle = 'wiedervorlage' | 'kschg';

export interface KalenderEvent {
  id: string;
  /** ISO-Datum/Zeit */
  at: string;
  kurztext: string;
  aktenzeichen: string;
  fallId: string;
  quelle: KalenderEventQuelle;
  dringlichkeit: FristDringlichkeit;
}

/**
 * Baut alle anzeigbaren Termine aus offenen Wiedervorlagen und KSchG-Fristenden (Fälle).
 */
export function buildKalenderEvents(faelle: Fall[], wiedervorlagen: Wiedervorlage[]): KalenderEvent[] {
  const fallById = new Map(faelle.map((f) => [f.id, f]));
  const out: KalenderEvent[] = [];

  for (const w of wiedervorlagen) {
    if (w.erledigt) continue;
    const f = fallById.get(w.fallId);
    const text = w.beschreibung;
    out.push({
      id: `wv-${w.id}`,
      at: w.faelligAm,
      kurztext: text.length > 48 ? `${text.slice(0, 48)}…` : text,
      aktenzeichen: f?.aktenzeichen ?? w.fallId,
      fallId: w.fallId,
      quelle: 'wiedervorlage',
      dringlichkeit: fristDringlichkeit(w.faelligAm),
    });
  }

  const wvProFallTag = new Set<string>();
  for (const w of wiedervorlagen) {
    if (w.erledigt) continue;
    wvProFallTag.add(`${w.fallId}|${format(parseISO(w.faelligAm), 'yyyy-MM-dd')}`);
  }

  for (const f of faelle) {
    const ende = f.arbeitsrecht?.fristEnde;
    if (!ende) continue;
    const tag = format(parseISO(ende), 'yyyy-MM-dd');
    if (wvProFallTag.has(`${f.id}|${tag}`)) continue;

    out.push({
      id: `kschg-${f.id}`,
      at: ende,
      kurztext: 'KSchG — Klagefrist',
      aktenzeichen: f.aktenzeichen,
      fallId: f.id,
      quelle: 'kschg',
      dringlichkeit: fristDringlichkeit(ende),
    });
  }

  return out.sort((a, b) => parseISO(a.at).getTime() - parseISO(b.at).getTime());
}
