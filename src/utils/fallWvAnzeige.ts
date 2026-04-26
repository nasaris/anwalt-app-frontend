import { parseISO } from 'date-fns';
import type { Fall } from '../types';
import type { Wiedervorlage } from '../types';

/** Frühestes Fälligkeitsdatum pro Fall aus offenen Wiedervorlagen-Einträgen. */
export function naechsteOffeneWvProFall(wv: Wiedervorlage[]): Record<string, string> {
  const next: Record<string, string> = {};
  for (const w of wv) {
    if (w.erledigt) continue;
    const cur = next[w.fallId];
    if (!cur || parseISO(w.faelligAm).getTime() < parseISO(cur).getTime()) {
      next[w.fallId] = w.faelligAm;
    }
  }
  return next;
}

/**
 * Ermittelt das anzuzeigende Wiedervorlage-Datum: Minimum aus API-Wiedervorlagen
 * und optionalem Legacy-Feld `fall.wiedervorlage`, nur bei Status aktiv.
 */
export function effektiveWvIso(fall: Fall, naechsteWvByFallId: Record<string, string>): string | undefined {
  if (fall.status !== 'aktiv') return undefined;
  const a = naechsteWvByFallId[fall.id];
  const b = fall.wiedervorlage;
  const candidates = [a, b].filter((x): x is string => Boolean(x));
  if (candidates.length === 0) return undefined;
  return candidates.reduce((best, x) => (parseISO(x).getTime() < parseISO(best).getTime() ? x : best));
}
