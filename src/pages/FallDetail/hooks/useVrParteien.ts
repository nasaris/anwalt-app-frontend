import { useState, useMemo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import type { Fall, FallParteiEintrag, Partei, ParteienTyp, VerkehrsrechtDaten, ArbeitsrechtDaten } from '../../../types';
import { faelleApi } from '../../../api/faelle';
import { mandantenApi } from '../../../api/mandanten';
import type { Mandant } from '../../../types';
import { VR_ROLLE_LABEL } from '../../../utils/verkehrsParteienHelpers';

const VR_STAMM_PARTEI_TYPEN = ['versicherung', 'gutachter', 'werkstatt'] as const;
type VrStammParteiTyp = (typeof VR_STAMM_PARTEI_TYPEN)[number];
export type VrStammParteiFilter = 'alle' | VrStammParteiTyp;

export type VrParteiAustauschZiel =
  | { scope: 'vr-eintrag'; eintragId: string; label: string; aktuelleId: string; typ: ParteienTyp }
  | { scope: 'vr-neu'; rolle: ParteienTyp; label: string; typ: ParteienTyp; aktuelleId: '' }
  | { scope: 'ar'; key: string; label: string; aktuelleId: string; typ: ParteienTyp }
  | { scope: 'zr'; key: string; label: string; aktuelleId: string; typ: ParteienTyp };

const AR_PARTEI_SLOT_DEFS = [
  { key: 'gegenseite', label: 'Gegenseite', typ: 'gegenseite' as const, idField: 'gegenseiteId' as const },
  { key: 'gericht', label: 'Gericht', typ: 'gericht' as const, idField: 'gerichtId' as const },
] as const;

export function istVrStammParteiTyp(typ: ParteienTyp): typ is VrStammParteiTyp {
  return (VR_STAMM_PARTEI_TYPEN as readonly ParteienTyp[]).includes(typ);
}

export function parteiInitialen(p: Partei): string {
  const parts = p.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return p.name.slice(0, 2).toUpperCase();
}

export function useVrParteien(
  fall: Fall | null,
  alleParteien: Partei[],
  setFall: (f: Fall) => void,
  setAlleParteien: (fn: (prev: Partei[]) => Partei[]) => void,
  setParteienMap: (fn: (prev: Record<string, Partei>) => Record<string, Partei>) => void,
  navigate: NavigateFunction,
) {
  const [parteiBlockOpen, setParteiBlockOpen] = useState<Record<string, boolean>>({});
  const [parteiZumEditieren, setParteiZumEditieren] = useState<Partei | null>(null);
  const [parteiZumAustauschen, setParteiZumAustauschen] = useState<VrParteiAustauschZiel | null>(null);
  const [parteiAustauschNeu, setParteiAustauschNeu] = useState<string>('');
  const [parteiAustauschSuche, setParteiAustauschSuche] = useState<string>('');
  const [neueParteiSlot, setNeueParteiSlot] = useState<
    | { context: 'vr'; rolle: ParteienTyp }
    | { context: 'ar'; key: string; typ: ParteienTyp }
    | null
  >(null);
  const [weitererMandantDialogOpen, setWeitererMandantDialogOpen] = useState(false);
  const [mandantenWeiterePicker, setMandantenWeiterePicker] = useState<Mandant[]>([]);
  const [weitererMandantSuche, setWeitererMandantSuche] = useState('');
  const [vrParteiHinzufuegenOpen, setVrParteiHinzufuegenOpen] = useState(false);
  const [vrParteiHinzufuegenSuche, setVrParteiHinzufuegenSuche] = useState('');
  const [vrParteiStammFilter, setVrParteiStammFilter] = useState<VrStammParteiFilter>('alle');
  const [vrParteiAuswahl, setVrParteiAuswahl] = useState<Set<string>>(() => new Set());

  const vrBeteiligteZeilen = useMemo(() => {
    if (!fall || fall.rechtsgebiet !== 'verkehrsrecht') return [];
    const vr = fall.verkehrsrecht;
    if (!vr) return [];
    const entries = vr.beteiligteParteien ?? [];
    return entries.map((e: FallParteiEintrag) => {
      const rl = e.rolle;
      return {
        eintragId: e.eintragId,
        rolle: rl,
        label: VR_ROLLE_LABEL[rl] ?? rl,
        partei: null as Partei | null,
        rawId: e.parteiId,
      };
    });
  }, [fall]);

  const parteienMapFromFall = useMemo(() => {
    if (!fall || fall.rechtsgebiet !== 'verkehrsrecht') return {} as Record<string, Partei>;
    const vr = fall.verkehrsrecht;
    if (!vr?.beteiligteParteien) return {} as Record<string, Partei>;
    const map: Record<string, Partei> = {};
    for (const e of vr.beteiligteParteien) {
      const p = alleParteien.find((x) => x.id === e.parteiId);
      if (p) map[e.parteiId] = p;
    }
    return map;
  }, [fall, alleParteien]);

  const vrBeteiligteZeilenResolved = useMemo(() => {
    if (!fall || fall.rechtsgebiet !== 'verkehrsrecht') return [];
    const vr = fall.verkehrsrecht;
    if (!vr) return [];
    const entries = vr.beteiligteParteien ?? [];
    return entries.map((e: FallParteiEintrag) => {
      const rl = e.rolle;
      return {
        eintragId: e.eintragId,
        rolle: rl,
        label: VR_ROLLE_LABEL[rl] ?? rl,
        partei: alleParteien.find((p) => p.id === e.parteiId) ?? null,
        rawId: e.parteiId,
      };
    });
  }, [fall, alleParteien]);

  const arbeitsParteiSlots = useMemo(() => {
    if (!fall || fall.rechtsgebiet !== 'arbeitsrecht') return [];
    const ar: Partial<ArbeitsrechtDaten> = fall.arbeitsrecht ?? {};
    return AR_PARTEI_SLOT_DEFS.map((def) => {
      const rawId = ar[def.idField] as string | undefined;
      const partei = rawId ? (alleParteien.find((p) => p.id === rawId) ?? null) : null;
      return { ...def, rawId, partei };
    });
  }, [fall, alleParteien]);

  const beteiligteAmFall = useMemo(() => {
    if (!fall) return [] as { key: string; label: string; partei: Partei }[];
    const rows: { key: string; label: string; partei: Partei }[] = [];
    const vr = fall.verkehrsrecht;
    const ar = fall.arbeitsrecht;
    if (vr?.beteiligteParteien?.length) {
      for (const e of vr.beteiligteParteien as FallParteiEintrag[]) {
        const p = alleParteien.find((x) => x.id === e.parteiId);
        if (p) {
          rows.push({ key: e.eintragId, label: VR_ROLLE_LABEL[e.rolle] ?? e.rolle, partei: p });
        }
      }
    } else if (vr) {
      if (vr.versicherungId) {
        const p = alleParteien.find((x) => x.id === vr.versicherungId);
        if (p) rows.push({ key: 'versicherung', label: 'Versicherung', partei: p });
      }
      if (vr.gutachterId) {
        const p = alleParteien.find((x) => x.id === vr.gutachterId);
        if (p) rows.push({ key: 'gutachter', label: 'Gutachter / Sachverständiger', partei: p });
      }
      if (vr.werkstattId) {
        const p = alleParteien.find((x) => x.id === vr.werkstattId);
        if (p) rows.push({ key: 'werkstatt', label: 'Werkstatt', partei: p });
      }
    }
    if (ar?.gegenseiteId) {
      const p = alleParteien.find((x) => x.id === ar.gegenseiteId);
      if (p) rows.push({ key: 'gegenseite', label: 'Gegenseite', partei: p });
    }
    if (ar?.gerichtId) {
      const p = alleParteien.find((x) => x.id === ar.gerichtId);
      if (p) rows.push({ key: 'gericht', label: 'Gericht', partei: p });
    }
    return rows;
  }, [fall, alleParteien]);

  const vrStammParteienGezeigt = useMemo(() => {
    const q = vrParteiHinzufuegenSuche.trim().toLowerCase();
    return alleParteien.filter((p) => {
      if (!istVrStammParteiTyp(p.typ)) return false;
      if (vrParteiStammFilter !== 'alle' && p.typ !== vrParteiStammFilter) return false;
      if (!q) return true;
      const ort = p.adresse ? `${p.adresse.plz} ${p.adresse.ort}` : '';
      return (
        p.name.toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        ort.toLowerCase().includes(q)
      );
    });
  }, [alleParteien, vrParteiStammFilter, vrParteiHinzufuegenSuche]);

  const toggleVrParteiAuswahl = (parteiId: string) => {
    setVrParteiAuswahl((prev) => {
      const next = new Set(prev);
      if (next.has(parteiId)) next.delete(parteiId);
      else next.add(parteiId);
      return next;
    });
  };

  const closeVrParteiDialog = () => {
    setVrParteiHinzufuegenOpen(false);
    setVrParteiHinzufuegenSuche('');
    setVrParteiStammFilter('alle');
    setVrParteiAuswahl(new Set());
  };

  const openVrParteiDialog = () => {
    setVrParteiHinzufuegenSuche('');
    setVrParteiStammFilter('alle');
    setVrParteiAuswahl(new Set());
    setVrParteiHinzufuegenOpen(true);
  };

  const handleNeueParteiGespeichert = async (p: Partei) => {
    const meta = neueParteiSlot;
    setNeueParteiSlot(null);
    setAlleParteien((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p],
    );
    setParteienMap((prev) => ({ ...prev, [p.id]: p }));
    if (!fall || !meta) return;
    try {
      if (meta.context === 'vr') {
        if (!fall.verkehrsrecht) return;
        const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
        const bp = [...(vr.beteiligteParteien ?? [])];
        bp.push({ eintragId: crypto.randomUUID(), rolle: meta.rolle, parteiId: p.id });
        vr.beteiligteParteien = bp;
        const updated = await faelleApi.update(fall.id, { verkehrsrecht: vr });
        setFall(updated);
      } else {
        if (!fall.arbeitsrecht) return;
        const ar: ArbeitsrechtDaten = { ...fall.arbeitsrecht };
        if (meta.key === 'gegenseite') ar.gegenseiteId = p.id;
        else ar.gerichtId = p.id;
        const updated = await faelleApi.update(fall.id, { arbeitsrecht: ar });
        setFall(updated);
      }
    } catch {
      /* bleibt ohne Zuweisung */
    }
  };

  const handleParteiAustauschen = async () => {
    if (!fall || !parteiZumAustauschen || !parteiAustauschNeu) return;
    const t = parteiZumAustauschen;
    let updatePayload: Partial<Fall>;
    if (t.scope === 'vr-eintrag') {
      if (!fall.verkehrsrecht) return;
      const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
      const bp = [...(vr.beteiligteParteien ?? [])];
      const i = bp.findIndex((e) => e.eintragId === t.eintragId);
      if (i < 0) return;
      bp[i] = { ...bp[i], parteiId: parteiAustauschNeu };
      vr.beteiligteParteien = bp;
      updatePayload = { verkehrsrecht: vr };
    } else if (t.scope === 'vr-neu') {
      if (!fall.verkehrsrecht) return;
      const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
      const bp = [...(vr.beteiligteParteien ?? [])];
      bp.push({ eintragId: crypto.randomUUID(), rolle: t.rolle, parteiId: parteiAustauschNeu });
      vr.beteiligteParteien = bp;
      updatePayload = { verkehrsrecht: vr };
    } else if (t.scope === 'ar') {
      if (!fall.arbeitsrecht) return;
      const base = { ...fall.arbeitsrecht };
      if (t.key === 'gegenseite') {
        updatePayload = { arbeitsrecht: { ...base, gegenseiteId: parteiAustauschNeu } };
      } else if (t.key === 'gericht') {
        updatePayload = { arbeitsrecht: { ...base, gerichtId: parteiAustauschNeu } };
      } else return;
    } else if (t.scope === 'zr') {
      if (!fall.zivilrecht) return;
      const base = { ...fall.zivilrecht };
      if (t.key === 'gegenseite') {
        updatePayload = { zivilrecht: { ...base, gegenseiteId: parteiAustauschNeu } };
      } else if (t.key === 'gericht') {
        updatePayload = { zivilrecht: { ...base, gerichtId: parteiAustauschNeu } };
      } else return;
    } else return;
    const updated = await faelleApi.update(fall.id, updatePayload);
    setFall(updated);
    const neuePartei = alleParteien.find((p) => p.id === parteiAustauschNeu);
    if (neuePartei) setParteienMap((prev) => ({ ...prev, [neuePartei.id]: neuePartei }));
    setParteiZumAustauschen(null);
    setParteiAustauschNeu('');
    setParteiAustauschSuche('');
  };

  const handleVrEintragEntfernen = async (eintragId: string) => {
    if (!fall?.verkehrsrecht) return;
    const vr = { ...fall.verkehrsrecht };
    vr.beteiligteParteien = (vr.beteiligteParteien ?? []).filter((e) => e.eintragId !== eintragId);
    const updated = await faelleApi.update(fall.id, { verkehrsrecht: vr });
    setFall(updated);
  };

  const handleWeiterenMandantHinzufuegen = async (mandantId: string) => {
    if (!fall) return;
    const cur = [...(fall.weitereMandantenIds ?? [])];
    if (cur.includes(mandantId) || mandantId === fall.mandantId) return;
    const updated = await faelleApi.update(fall.id, { weitereMandantenIds: [...cur, mandantId] });
    setFall(updated);
    setWeitererMandantDialogOpen(false);
  };

  const handleWeiterenMandantEntfernen = async (mandantId: string) => {
    if (!fall) return;
    const updated = await faelleApi.update(fall.id, {
      weitereMandantenIds: (fall.weitereMandantenIds ?? []).filter((x) => x !== mandantId),
    });
    setFall(updated);
  };

  const openWeitererMandantDialog = async () => {
    setWeitererMandantDialogOpen(true);
    setWeitererMandantSuche('');
    try {
      setMandantenWeiterePicker(await mandantenApi.getAll());
    } catch {
      setMandantenWeiterePicker([]);
    }
  };

  const handleVrParteienMultiZuordnen = async () => {
    if (!fall?.verkehrsrecht || vrParteiAuswahl.size === 0) return;
    const idsToAdd = Array.from(vrParteiAuswahl);
    const parteienToAdd = idsToAdd
      .map((id) => alleParteien.find((p) => p.id === id))
      .filter((p): p is Partei => !!p && istVrStammParteiTyp(p.typ));
    if (parteienToAdd.length === 0) return;
    const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
    const bp = [...(vr.beteiligteParteien ?? [])];
    for (const partei of parteienToAdd) {
      bp.push({ eintragId: crypto.randomUUID(), rolle: partei.typ as VrStammParteiTyp, parteiId: partei.id });
    }
    vr.beteiligteParteien = bp;
    try {
      const updated = await faelleApi.update(fall.id, { verkehrsrecht: vr });
      setFall(updated);
      setParteienMap((prev) => {
        const next = { ...prev };
        for (const partei of parteienToAdd) next[partei.id] = partei;
        return next;
      });
      closeVrParteiDialog();
    } catch {
      /* keine Zuweisung */
    }
  };

  return {
    parteiBlockOpen,
    setParteiBlockOpen,
    parteiZumEditieren,
    setParteiZumEditieren,
    parteiZumAustauschen,
    setParteiZumAustauschen,
    parteiAustauschNeu,
    setParteiAustauschNeu,
    parteiAustauschSuche,
    setParteiAustauschSuche,
    neueParteiSlot,
    setNeueParteiSlot,
    weitererMandantDialogOpen,
    setWeitererMandantDialogOpen,
    mandantenWeiterePicker,
    weitererMandantSuche,
    setWeitererMandantSuche,
    vrParteiHinzufuegenOpen,
    setVrParteiHinzufuegenOpen,
    vrParteiHinzufuegenSuche,
    setVrParteiHinzufuegenSuche,
    vrParteiStammFilter,
    setVrParteiStammFilter,
    vrParteiAuswahl,
    setVrParteiAuswahl,
    vrBeteiligteZeilen: vrBeteiligteZeilenResolved,
    arbeitsParteiSlots,
    beteiligteAmFall,
    vrStammParteienGezeigt,
    toggleVrParteiAuswahl,
    closeVrParteiDialog,
    openVrParteiDialog,
    handleNeueParteiGespeichert,
    handleParteiAustauschen,
    handleVrEintragEntfernen,
    handleWeiterenMandantHinzufuegen,
    handleWeiterenMandantEntfernen,
    openWeitererMandantDialog,
    handleVrParteienMultiZuordnen,
    VR_ROLLE_LABEL,
    navigate,
  };
}
