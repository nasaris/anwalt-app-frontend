import type { Textvorlage, VorlagenRechtsgebiet } from '../store/vorlagenStore';

export interface ResolveInitialTextvorlageOpts {
  typId: string;
  /** Fall-Rechtsgebiet (ohne „alle“); wenn fehlt, werden alle Vorlagen zum Typ berücksichtigt */
  fallRechtsgebiet?: VorlagenRechtsgebiet;
  preferredVorlageId?: string | null;
}

/** Vorlagenliste bereits gefiltert (z. B. nur passendes RG) oder alle zum Typ */
export function resolveInitialTextvorlageFromList(
  alleZumTyp: Textvorlage[],
  opts: ResolveInitialTextvorlageOpts,
): Textvorlage | null {
  const { fallRechtsgebiet, preferredVorlageId } = opts;

  let list = alleZumTyp.filter((v) => v.typId === opts.typId);
  if (list.length === 0) return null;

  if (fallRechtsgebiet) {
    const rgMatch = list.filter(
      (v) => v.rechtsgebiet === 'alle' || v.rechtsgebiet === fallRechtsgebiet,
    );
    if (rgMatch.length > 0) list = rgMatch;
  }

  if (preferredVorlageId) {
    const pref = list.find((v) => v.id === preferredVorlageId);
    if (pref) return pref;
  }

  const sorted = [...list].sort((a, b) => {
    if (fallRechtsgebiet) {
      const score = (x: Textvorlage) =>
        x.rechtsgebiet === fallRechtsgebiet ? 0 : x.rechtsgebiet === 'alle' ? 1 : 2;
      const d = score(a) - score(b);
      if (d !== 0) return d;
    }
    return a.name.localeCompare(b.name, 'de');
  });

  return sorted[0] ?? null;
}
