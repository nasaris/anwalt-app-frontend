import type { Rechtsgebiet } from '../types';

const PREFIX: Record<Rechtsgebiet, string> = {
  verkehrsrecht: 'VR',
  arbeitsrecht: 'AR',
  zivilrecht: 'ZR',
  insolvenzrecht: 'IR',
  wettbewerbsrecht: 'WB',
  erbrecht: 'ER',
};

/** Aus einem Aktenzeichen die Zahl nach dem letzten „/“ lesen (rechtsgebietübergreifend vergleichbar). */
export function parseLaufnummerNachLetztemSlash(aktenzeichen: string): number | null {
  const t = aktenzeichen.trim();
  if (!t) return null;
  const i = t.lastIndexOf('/');
  if (i < 0) return null;
  const tail = t.slice(i + 1).replace(/\s/g, '');
  const n = parseInt(tail, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Nächstes Aktenzeichen: `{Präfix}/{Jahr}/{Lauf}`.
 * `Lauf` = max(all bestehenden Endnummern) + 1 über alle Fälle (rechtsübergreifend).
 */
export function naechstesAktenzeichen(
  bestehendeAktenzeichen: readonly string[],
  rechtsgebiet: Rechtsgebiet,
  jahr: number = new Date().getFullYear(),
): string {
  const prefix = PREFIX[rechtsgebiet];
  let max = 0;
  for (const az of bestehendeAktenzeichen) {
    const n = parseLaufnummerNachLetztemSlash(az);
    if (n !== null && n > max) max = n;
  }
  const next = max + 1;
  const lauf = next < 1000 ? String(next).padStart(3, '0') : String(next);
  return `${prefix}/${jahr}/${lauf}`;
}

export const AKTENZEICHEN_AUTO_HINT =
  'Wird automatisch vergeben. Die Nummer nach dem letzten Schrägstrich zählt über alle Rechtsgebiete fortlaufend hoch.';
