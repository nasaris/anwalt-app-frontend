import type { PhaseMapping, Textvorlage } from './vorlagenStore';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Entfernt gespeicherte Platzhalter `[BAUSTEIN:id]` aus Vorlagen-HTML bei gelöschtem Baustein */
export function stripBausteinPlatzhalterAusHtml(html: string, bausteinId: string): string {
  if (!html || !bausteinId) return html;
  const re = new RegExp(`\\[BAUSTEIN:${escapeRegExp(bausteinId)}\\]`, 'g');
  return html.replace(re, '');
}

export function arraysEqual(a: string[] | undefined, b: string[] | undefined): boolean {
  const aa = a ?? [];
  const bb = b ?? [];
  return aa.length === bb.length && aa.every((x, i) => x === bb[i]);
}

export function stripBausteinFromVorlage(v: Textvorlage, bausteinId: string): Textvorlage {
  const filtered = v.zugewieseneBausteinIds?.filter((x) => x !== bausteinId);
  const zugewieseneBausteinIds =
    filtered && filtered.length > 0 ? filtered : undefined;
  const inhalt = stripBausteinPlatzhalterAusHtml(v.inhalt ?? '', bausteinId);
  return { ...v, zugewieseneBausteinIds, inhalt };
}

/** Entfernt eine Dokumenttyp-ID aus allen Phasen-Overrides (keine toten Referenzen) */
export function stripTypFromPhaseMapping(mapping: PhaseMapping, typId: string): PhaseMapping {
  const out: PhaseMapping = {};
  for (const [rg, phases] of Object.entries(mapping)) {
    const nextPh: Record<number, string[]> = {};
    for (const [phStr, ids] of Object.entries(phases)) {
      nextPh[Number(phStr)] = ids.filter((tid) => tid !== typId);
    }
    out[rg] = nextPh;
  }
  return out;
}
