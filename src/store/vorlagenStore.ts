import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SYSTEM_TEXTVORLAGEN as FALLBACK_SYSTEM_TEXTVORLAGEN } from '../data/systemTextvorlagen';
import { BEISPIEL_TEXTBAUSTEINE } from '../data/beispielTextBausteine';
import { resolveInitialTextvorlageFromList } from '../utils/resolveInitialTextvorlage';
import { useAufgabenStore } from './aufgabenStore';
import { arraysEqual, stripBausteinFromVorlage, stripTypFromPhaseMapping } from './vorlagenReferenzHelpers';

export type VorlagenRechtsgebiet =
  | 'alle'
  | 'verkehrsrecht'
  | 'arbeitsrecht'
  | 'zivilrecht'
  | 'insolvenzrecht'
  | 'wettbewerbsrecht'
  | 'erbrecht';

export interface DokumentTyp {
  id: string;
  label: string;
  system: boolean;
  aktiv: boolean;
}

export interface Textvorlage {
  id: string;
  name: string;
  typId: string;
  rechtsgebiet: VorlagenRechtsgebiet;
  betreff: string;
  inhalt: string;
  /** Textbausteine, die beim Schreiben vorgeschlagen werden (Auswahl im Fall möglich) */
  zugewieseneBausteinIds?: string[];
  /** System-Standard (nicht löschbar); Inhalt per Override anpassbar */
  system?: boolean;
}

export type SystemVorlageOverride = Partial<
  Pick<Textvorlage, 'name' | 'betreff' | 'inhalt' | 'typId' | 'rechtsgebiet' | 'zugewieseneBausteinIds' | 'system'>
>;

/** Kurztext / Baustein für den Aufbau von Textvorlagen (Verwaltungs-Tab „Textbausteine“) */
export interface Textbaustein {
  id: string;
  name: string;
  inhalt: string;
  rechtsgebiet: VorlagenRechtsgebiet;
}

// Phasenzuordnung: Rechtsgebiet → Phase → Typ-IDs (vorgeschlagen)
export type PhaseMapping = Record<string, Record<number, string[]>>;

// System-Dokumententypen (Fallback bis DB-Hydration; Kanonisch in settings_kv.vorlagen)
export const FALLBACK_SYSTEM_TYPEN: DokumentTyp[] = [
  { id: 'schadensanzeige',               label: 'Schadensanzeige',                 system: true, aktiv: true },
  { id: 'gutachten_uebersandt',           label: 'Gutachten übersandt',             system: true, aktiv: true },
  { id: 'rechnung_uebersandt',            label: 'Reparaturrechnung übersandt',     system: true, aktiv: true },
  { id: 'nutzungsausfall',                label: 'Nutzungsausfall / Mietwagen',     system: true, aktiv: true },
  { id: 'kuerzungsschreiben_eingegangen', label: 'Kürzungsschreiben (eingegangen)', system: true, aktiv: true },
  { id: 'stellungnahme',                  label: 'Stellungnahme',                   system: true, aktiv: true },
  { id: 'mahnschreiben',                  label: 'Mahnschreiben',                   system: true, aktiv: true },
  { id: 'anschreiben_gegenseite',         label: 'Anschreiben Gegenseite',          system: true, aktiv: true },
  { id: 'deckungsanfrage_rsv',            label: 'Deckungsanfrage RSV',             system: true, aktiv: true },
  { id: 'klageschrift',                   label: 'Klageschrift',                    system: true, aktiv: true },
  { id: 'sonstiges',                      label: 'Sonstiges',                       system: true, aktiv: true },
];

/** @deprecated Nutze Store-State `bundledSystemTypen` (aus DB), Konstante nur Fallback */
export const SYSTEM_TYPEN = FALLBACK_SYSTEM_TYPEN;

// Standard-Phasenzuordnung (Fallback)
const FALLBACK_DEFAULT_PHASE_MAPPING: PhaseMapping = {
  verkehrsrecht: {
    1: ['schadensanzeige', 'sonstiges'],
    2: ['gutachten_uebersandt', 'rechnung_uebersandt', 'nutzungsausfall', 'sonstiges'],
    3: ['kuerzungsschreiben_eingegangen', 'stellungnahme', 'mahnschreiben', 'sonstiges'],
    4: ['klageschrift', 'mahnschreiben', 'sonstiges'],
  },
  arbeitsrecht: {
    1: ['deckungsanfrage_rsv', 'sonstiges'],
    2: ['anschreiben_gegenseite', 'stellungnahme', 'mahnschreiben', 'sonstiges'],
    3: ['klageschrift', 'sonstiges'],
  },
  zivilrecht: {
    1: ['mahnschreiben', 'anschreiben_gegenseite', 'sonstiges'],
    2: ['klageschrift', 'stellungnahme', 'sonstiges'],
  },
};

interface VorlagenState {
  /** Aus SQLite settings_kv (bundled Catalog); Fallback: FALLBACK_* */
  bundledSystemTypen: DokumentTyp[];
  bundledSystemTextvorlagen: Textvorlage[];
  bundledDefaultPhaseMapping: PhaseMapping;

  typLabelOverrides: Record<string, string>;
  typAktivOverrides: Record<string, boolean>;
  /** Löschschutz (false) abweichend von bundled Systemtypen; fehlender Key = Standard */
  typSystemOverrides: Record<string, boolean>;
  /** Aus der Verwaltung entfernte mitgelieferte Typ-IDs (wie removedSystemVorlageIds) */
  removedSystemTypIds: string[];
  customTypen: DokumentTyp[];
  /** Nur benutzerdefinierte Textvorlagen (persistiert) */
  vorlagen: Textvorlage[];
  /** Anpassungen an System-Textvorlagen, Schlüssel = Vorlagen-ID (z. B. sys-schadensanzeige) */
  systemVorlageOverrides: Record<string, SystemVorlageOverride>;
  /** Aus dem UI „gelöschte“ System-Vorlagen (Bundle bleibt; Eintrag wird ausgeblendet) */
  removedSystemVorlageIds: string[];
  /** Textbausteine (persistiert; neue Installation enthält Standard-Beispiele) */
  textBausteine: Textbaustein[];
  // null bedeutet: Default verwenden
  phaseMappingOverrides: PhaseMapping;

  getAlleTypen: () => DokumentTyp[];
  getTypenFuerPhase: (rechtsgebiet: string, phase: number) => string[];

  /** System-Standards (mit Overrides) + eigene Vorlagen */
  getAlleTextvorlagen: () => Textvorlage[];
  /** Eine Standard-Vorlage pro Dokumententyp (für Schriftverkehr-Dialog) */
  getDefaultVorlageFuerTyp: (typId: string) => Textvorlage | null;

  resolveInitialTextvorlage: (opts: {
    typId: string;
    fallRechtsgebiet?: VorlagenRechtsgebiet;
    preferredVorlageId?: string | null;
  }) => Textvorlage | null;

  updateSystemTyp: (id: string, changes: { label?: string; aktiv?: boolean; system?: boolean }) => void;
  addCustomTyp: (typ: { label: string; aktiv: boolean; system?: boolean }) => void;
  updateCustomTyp: (id: string, changes: Partial<Pick<DokumentTyp, 'label' | 'aktiv' | 'system'>>) => void;
  deleteCustomTyp: (id: string) => void;
  /** Nur wenn merged.system !== true — Bundle-Typ oder eigener Typ */
  deleteDokumentTyp: (id: string) => void;

  addVorlage: (v: Omit<Textvorlage, 'id'> & Partial<Pick<Textvorlage, 'system'>>) => void;
  updateVorlage: (id: string, changes: Partial<Omit<Textvorlage, 'id'>>) => void;
  updateSystemVorlage: (vorlageId: string, changes: SystemVorlageOverride) => void;
  resetSystemVorlage: (vorlageId: string) => void;
  deleteVorlage: (id: string) => void;

  getAlleTextBausteine: () => Textbaustein[];

  addTextBaustein: (v: Omit<Textbaustein, 'id'>) => void;
  updateTextBaustein: (id: string, changes: Partial<Omit<Textbaustein, 'id'>>) => void;
  deleteTextBaustein: (id: string) => void;

  setTypenFuerPhase: (rechtsgebiet: string, phase: number, typIds: string[]) => void;
  resetPhaseMapping: (rechtsgebiet: string, phase: number) => void;
}

function textBausteineInitial(): Textbaustein[] {
  return BEISPIEL_TEXTBAUSTEINE.map(({ id, name, inhalt, rechtsgebiet }) => ({
    id,
    name,
    inhalt,
    rechtsgebiet,
  }));
}

export const useVorlagenStore = create<VorlagenState>()(
  persist(
    (set, get) => ({
      bundledSystemTypen: structuredClone(FALLBACK_SYSTEM_TYPEN),
      bundledSystemTextvorlagen: structuredClone(FALLBACK_SYSTEM_TEXTVORLAGEN),
      bundledDefaultPhaseMapping: structuredClone(FALLBACK_DEFAULT_PHASE_MAPPING),

      typLabelOverrides: {},
      typAktivOverrides: {},
      typSystemOverrides: {},
      removedSystemTypIds: [],
      customTypen: [],
      vorlagen: [],
      systemVorlageOverrides: {},
      removedSystemVorlageIds: [],
      textBausteine: textBausteineInitial(),
      phaseMappingOverrides: {},

      getAlleTextBausteine: () => get().textBausteine,

      getAlleTextvorlagen: () => {
        const { vorlagen, systemVorlageOverrides, removedSystemVorlageIds, bundledSystemTextvorlagen } = get();
        const removed = new Set(removedSystemVorlageIds);
        const mergedSystem = bundledSystemTextvorlagen.filter((base) => !removed.has(base.id)).map((base) => {
          const o = systemVorlageOverrides[base.id];
          return o ? { ...base, ...o } : base;
        });
        return [...mergedSystem, ...vorlagen];
      },

      resolveInitialTextvorlage: (opts) => {
        const all = get().getAlleTextvorlagen();
        return resolveInitialTextvorlageFromList(all, opts);
      },

      getDefaultVorlageFuerTyp: (typId) =>
        get().resolveInitialTextvorlage({ typId }),

      getAlleTypen: () => {
        const {
          typLabelOverrides,
          typAktivOverrides,
          typSystemOverrides,
          customTypen,
          removedSystemTypIds,
          bundledSystemTypen,
        } = get();
        const removed = new Set(removedSystemTypIds);
        const systemMitOverrides = bundledSystemTypen.filter((t) => !removed.has(t.id)).map((t) => ({
          ...t,
          label: typLabelOverrides[t.id] ?? t.label,
          aktiv: typAktivOverrides[t.id] ?? t.aktiv,
          system: typSystemOverrides[t.id] ?? t.system,
        }));
        return [...systemMitOverrides, ...customTypen];
      },

      getTypenFuerPhase: (rechtsgebiet, phase) => {
        const { phaseMappingOverrides, bundledDefaultPhaseMapping } = get();
        const raw =
          phaseMappingOverrides[rechtsgebiet]?.[phase] ??
          bundledDefaultPhaseMapping[rechtsgebiet]?.[phase] ??
          [];
        const validIds = new Set(get().getAlleTypen().map((t) => t.id));
        return raw.filter((tid) => validIds.has(tid));
      },

      updateSystemTyp: (id, changes) =>
        set((s) => {
          const typSystemOverrides = { ...s.typSystemOverrides };
          if (changes.system !== undefined) {
            if (changes.system === true) {
              delete typSystemOverrides[id];
            } else {
              typSystemOverrides[id] = false;
            }
          }
          return {
            typLabelOverrides:
              changes.label !== undefined ? { ...s.typLabelOverrides, [id]: changes.label } : s.typLabelOverrides,
            typAktivOverrides:
              changes.aktiv !== undefined ? { ...s.typAktivOverrides, [id]: changes.aktiv } : s.typAktivOverrides,
            typSystemOverrides,
          };
        }),

      addCustomTyp: (typ) =>
        set((s) => ({
          customTypen: [
            ...s.customTypen,
            {
              label: typ.label,
              aktiv: typ.aktiv,
              id: `custom-${Date.now()}`,
              system: typ.system ?? false,
            },
          ],
        })),

      updateCustomTyp: (id, changes) =>
        set((s) => ({
          customTypen: s.customTypen.map((t) => (t.id === id ? { ...t, ...changes } : t)),
        })),

      deleteCustomTyp: (id) => {
        const vorlageIds = get().vorlagen.filter((v) => v.typId === id).map((v) => v.id);
        set((s) => ({
          customTypen: s.customTypen.filter((t) => t.id !== id),
          vorlagen: s.vorlagen.filter((v) => v.typId !== id),
          phaseMappingOverrides: stripTypFromPhaseMapping(s.phaseMappingOverrides, id),
        }));
        useAufgabenStore.getState().bereinigeNachDokumentTypEntfernt(id);
        useAufgabenStore.getState().bereinigeNachTextvorlageIdsEntfernt(vorlageIds);
      },

      deleteDokumentTyp: (id) => {
        const merged = get().getAlleTypen().find((t) => t.id === id);
        if (!merged || merged.system === true) return;

        const isBundled = get().bundledSystemTypen.some((t) => t.id === id);
        if (isBundled) {
          set((s) => ({
            removedSystemTypIds: s.removedSystemTypIds.includes(id)
              ? s.removedSystemTypIds
              : [...s.removedSystemTypIds, id],
            phaseMappingOverrides: stripTypFromPhaseMapping(s.phaseMappingOverrides, id),
          }));
          useAufgabenStore.getState().bereinigeNachDokumentTypEntfernt(id);
          return;
        }

        get().deleteCustomTyp(id);
      },

      addVorlage: (v) =>
        set((s) => {
          const { system: sysFlag, ...rest } = v;
          return {
            vorlagen: [
              ...s.vorlagen,
              { ...rest, id: `vl-${Date.now()}`, system: sysFlag ?? false },
            ],
          };
        }),

      updateVorlage: (id, changes) =>
        set((s) => ({
          vorlagen: s.vorlagen.map((v) => (v.id === id ? { ...v, ...changes } : v)),
        })),

      updateSystemVorlage: (vorlageId, changes) =>
        set((s) => ({
          systemVorlageOverrides: {
            ...s.systemVorlageOverrides,
            [vorlageId]: { ...s.systemVorlageOverrides[vorlageId], ...changes },
          },
        })),

      resetSystemVorlage: (vorlageId) =>
        set((s) => {
          const next = { ...s.systemVorlageOverrides };
          delete next[vorlageId];
          return { systemVorlageOverrides: next };
        }),

      deleteVorlage: (id) => {
        const merged = get().getAlleTextvorlagen().find((x) => x.id === id);
        if (!merged) return;
        if (merged.system === true) return;

        const isBundledSystem = get().bundledSystemTextvorlagen.some((b) => b.id === id);
        if (isBundledSystem) {
          set((s) => ({
            removedSystemVorlageIds: s.removedSystemVorlageIds.includes(id)
              ? s.removedSystemVorlageIds
              : [...s.removedSystemVorlageIds, id],
          }));
          useAufgabenStore.getState().bereinigeNachTextvorlageIdsEntfernt([id]);
          return;
        }

        set((s) => ({ vorlagen: s.vorlagen.filter((v) => v.id !== id) }));
        useAufgabenStore.getState().bereinigeNachTextvorlageIdsEntfernt([id]);
      },

      addTextBaustein: (v) =>
        set((s) => ({
          textBausteine: [...s.textBausteine, { ...v, id: `tb-${Date.now()}` }],
        })),

      updateTextBaustein: (id, changes) =>
        set((s) => ({
          textBausteine: s.textBausteine.map((t) => (t.id === id ? { ...t, ...changes } : t)),
        })),

      deleteTextBaustein: (bausteinId) =>
        set((s) => {
          const nextOverrides = { ...s.systemVorlageOverrides };

          for (const base of get().bundledSystemTextvorlagen) {
            const prevOverride = nextOverrides[base.id];
            const merged: Textvorlage = { ...base, ...(prevOverride ?? {}) };
            const stripped = stripBausteinFromVorlage(merged, bausteinId);

            if (
              stripped.inhalt === merged.inhalt &&
              arraysEqual(stripped.zugewieseneBausteinIds, merged.zugewieseneBausteinIds)
            ) {
              continue;
            }

            const next: SystemVorlageOverride = { ...(prevOverride ?? {}) };
            if (stripped.inhalt === base.inhalt) {
              delete next.inhalt;
            } else {
              next.inhalt = stripped.inhalt;
            }
            if (arraysEqual(stripped.zugewieseneBausteinIds, base.zugewieseneBausteinIds)) {
              delete next.zugewieseneBausteinIds;
            } else {
              next.zugewieseneBausteinIds = stripped.zugewieseneBausteinIds;
            }

            if (Object.keys(next).length === 0) {
              delete nextOverrides[base.id];
            } else {
              nextOverrides[base.id] = next;
            }
          }

          return {
            textBausteine: s.textBausteine.filter((t) => t.id !== bausteinId),
            vorlagen: s.vorlagen.map((v) => stripBausteinFromVorlage(v, bausteinId)),
            systemVorlageOverrides: nextOverrides,
          };
        }),

      setTypenFuerPhase: (rechtsgebiet, phase, typIds) =>
        set((s) => ({
          phaseMappingOverrides: {
            ...s.phaseMappingOverrides,
            [rechtsgebiet]: {
              ...(s.phaseMappingOverrides[rechtsgebiet] ?? {}),
              [phase]: typIds,
            },
          },
        })),

      resetPhaseMapping: (rechtsgebiet, phase) =>
        set((s) => {
          const rg = { ...(s.phaseMappingOverrides[rechtsgebiet] ?? {}) };
          delete rg[phase];
          return {
            phaseMappingOverrides: { ...s.phaseMappingOverrides, [rechtsgebiet]: rg },
          };
        }),
    }),
    {
      name: 'jurist-vorlagen',
      version: 4,
      migrate: (persistedState, fromVersion) => {
        if (persistedState == null || typeof persistedState !== 'object') {
          return persistedState as VorlagenState;
        }
        let p = persistedState as Partial<VorlagenState>;

        if (fromVersion < 4) {
          if (!Array.isArray(p.bundledSystemTypen) || p.bundledSystemTypen.length === 0) {
            p = { ...p, bundledSystemTypen: structuredClone(FALLBACK_SYSTEM_TYPEN) };
          }
          if (!Array.isArray(p.bundledSystemTextvorlagen) || p.bundledSystemTextvorlagen.length === 0) {
            p = { ...p, bundledSystemTextvorlagen: structuredClone(FALLBACK_SYSTEM_TEXTVORLAGEN) };
          }
          if (!p.bundledDefaultPhaseMapping || typeof p.bundledDefaultPhaseMapping !== 'object') {
            p = { ...p, bundledDefaultPhaseMapping: structuredClone(FALLBACK_DEFAULT_PHASE_MAPPING) };
          }
        }

        if (fromVersion < 3) {
          p = {
            ...p,
            typSystemOverrides:
              typeof p.typSystemOverrides === 'object' && p.typSystemOverrides !== null ? p.typSystemOverrides : {},
            removedSystemTypIds: Array.isArray(p.removedSystemTypIds) ? p.removedSystemTypIds : [],
          };
        }

        if (fromVersion < 2) {
          const old = (p.systemVorlageOverrides ?? {}) as Record<string, SystemVorlageOverride>;
          const neu: Record<string, SystemVorlageOverride> = {};
          for (const [key, val] of Object.entries(old)) {
            const byTyp = FALLBACK_SYSTEM_TEXTVORLAGEN.find((x) => x.typId === key);
            if (byTyp && val && typeof val === 'object') {
              neu[byTyp.id] = { ...(neu[byTyp.id] ?? {}), ...val };
            } else {
              neu[key] = val as SystemVorlageOverride;
            }
          }
          p = {
            ...p,
            systemVorlageOverrides: neu,
            removedSystemVorlageIds: Array.isArray(p.removedSystemVorlageIds)
              ? p.removedSystemVorlageIds
              : [],
          };
        }

        if (fromVersion === 0) {
          const existing = Array.isArray(p.textBausteine) ? [...p.textBausteine] : [];
          const ids = new Set(existing.map((t) => t.id));
          const toAdd = BEISPIEL_TEXTBAUSTEINE.filter((b) => !ids.has(b.id)).map(({ id, name, inhalt, rechtsgebiet }) => ({
            id,
            name,
            inhalt,
            rechtsgebiet,
          }));
          if (toAdd.length > 0) {
            p = { ...p, textBausteine: [...toAdd, ...existing] };
          }
        }

        return p as VorlagenState;
      },
    },
  ),
);
