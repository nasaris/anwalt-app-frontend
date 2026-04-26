import type { ParteienTyp, VerkehrsrechtDaten } from '../types';

/** Anzeigelabel für die Rolle einer Partei am Verkehrsfall */
export const VR_ROLLE_LABEL: Partial<Record<ParteienTyp, string>> = {
  versicherung: 'Versicherung',
  gutachter: 'Gutachter / Sachverständiger',
  werkstatt: 'Werkstatt',
  gegenseite: 'Gegenseite',
  gericht: 'Gericht',
};

/** Alle Partei-IDs aus VR (Liste + Legacy-Felder). */
export function sammleVerkehrsParteiIds(vr?: VerkehrsrechtDaten | null): string[] {
  if (!vr) return [];
  const ids = new Set<string>();
  for (const e of vr.beteiligteParteien ?? []) {
    if (e?.parteiId) ids.add(e.parteiId);
  }
  for (const id of [vr.gutachterId, vr.werkstattId, vr.versicherungId]) {
    if (id) ids.add(id);
  }
  return [...ids];
}

export function parteiIdInFallVerkehrsrecht(vr: VerkehrsrechtDaten | undefined, parteiId: string): boolean {
  if (!vr) return false;
  if (vr.beteiligteParteien?.some((e) => e.parteiId === parteiId)) return true;
  return [vr.gutachterId, vr.werkstattId, vr.versicherungId].some((x) => x === parteiId);
}
