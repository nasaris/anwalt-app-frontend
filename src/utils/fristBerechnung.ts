/**
 * Frist-Berechnungen für die Anwalts-App
 *
 * DSGVO-Hinweis: Diese Funktionen verarbeiten nur Datumswerte, keine Personendaten.
 */

import { differenceInDays, addWeeks, parseISO } from 'date-fns';

/**
 * Berechnet das Ende der 3-Wochen-Frist nach § 4 KSchG
 * ab dem Datum des Zugangs der Kündigung.
 */
export function berechneKSchGFrist(kuendigungsdatum: string): Date {
  return addWeeks(parseISO(kuendigungsdatum), 3);
}

/**
 * Gibt die verbleibenden Tage bis zu einem Fristende zurück.
 * Negativ = Frist bereits abgelaufen.
 */
export function verbleibendeTage(fristEnde: string): number {
  return differenceInDays(parseISO(fristEnde), new Date());
}

/**
 * Bestimmt die Dringlichkeit einer Frist.
 */
export type FristDringlichkeit = 'kritisch' | 'warnung' | 'normal' | 'abgelaufen';

export function fristDringlichkeit(fristEnde: string): FristDringlichkeit {
  const tage = verbleibendeTage(fristEnde);
  if (tage < 0) return 'abgelaufen';
  if (tage <= 3) return 'kritisch';
  if (tage <= 7) return 'warnung';
  return 'normal';
}

/**
 * Formatiert Tage-Anzahl als lesbaren String.
 */
export function formatVerbleibendeTage(tage: number): string {
  if (tage < 0) return `${Math.abs(tage)} Tage überfällig`;
  if (tage === 0) return 'Heute fällig!';
  if (tage === 1) return 'Morgen fällig';
  return `Noch ${tage} Tage`;
}
