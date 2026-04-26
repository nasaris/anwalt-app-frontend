import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AufgabeRechtsgebiet =
  | 'verkehrsrecht'
  | 'arbeitsrecht'
  | 'zivilrecht'
  | 'insolvenzrecht'
  | 'wettbewerbsrecht'
  | 'erbrecht';

/** Primäre Aktion der Aufgabe in der Timeline */
export type AufgabenAktion = 'brief' | 'anruf' | 'upload';

/** Priorität einer Aufgabe — gilt global für Template und wird pro Fall vererbt */
export type AufgabePrioritaet = 'hoch' | 'normal' | 'niedrig';

/** Pro-Fall-Metadaten einer Aufgabe (Fälligkeit & Zeitstempel der Erledigung) */
export interface FallAufgabeMeta {
  /** ISO-Date (YYYY-MM-DD) für die Fälligkeit in diesem Fall */
  faelligAm?: string;
  /** ISO-Timestamp, wenn die Aufgabe erledigt wurde */
  erledigtAm?: string;
  /** Optionale Überschreibung der Priorität für diesen konkreten Fall */
  prioritaet?: AufgabePrioritaet;
}

/** Erwarteter Dokumenttyp beim Upload — Abbild auf DateiKategorie */
export type UploadErwartung =
  | 'gutachten'
  | 'rechnung'
  | 'rechnung_werkstatt'
  | 'messwerk'
  | 'foto'
  | 'sonstiges';

export interface Aufgabe {
  id: string;
  text: string;
  rechtsgebiet: AufgabeRechtsgebiet;
  phase: number;
  system: boolean;
  reihenfolge: number;
  /** Optionaler Link zu einem Schriftverkehr-Typ — löst automatische Erledigung aus */
  schriftverkehrTypId?: string;
  /** Standard-Textvorlage wenn mehrere zum Typ existieren */
  standardTextvorlageId?: string;
  /** Steuert Icon und Flow in der Timeline; Default siehe effectiveAktion */
  aktion?: AufgabenAktion;
  /** Nur bei aktion upload */
  uploadErwartung?: UploadErwartung;
  /** Priorität (Template-Default; Default wenn nicht gesetzt: normal) */
  prioritaet?: AufgabePrioritaet;
  /** Optionale Standard-Fälligkeit aus Verwaltung (kann pro Fall überschrieben werden) */
  faelligAm?: string;
  /** Optionale Standard-Fälligkeit in Tagen (ab Fallbeginn), wird zu Datum aufgelöst */
  faelligInTagen?: number;
}

/** Effektive Priorität (Fallback auf 'normal') */
export function effectivePrioritaet(a: Aufgabe, meta?: FallAufgabeMeta): AufgabePrioritaet {
  return meta?.prioritaet ?? a.prioritaet ?? 'normal';
}

/** Effektive Aktion (Defaults für bestehende System-Aufgaben ohne Feld) */
export function effectiveAktion(a: Aufgabe): AufgabenAktion {
  if (a.aktion) return a.aktion;
  if (a.schriftverkehrTypId) return 'brief';
  return 'anruf';
}

/** Standard-Phasenlabels — Fallback bis DB-Hydration */
const FALLBACK_PHASE_LABELS: Record<AufgabeRechtsgebiet, Record<number, string>> = {
  verkehrsrecht: {
    1: 'Phase 1 — Eingang & Fallanlage',
    2: 'Phase 2 — Schriftverkehr Versicherung',
    3: 'Phase 3 — Kürzungsschreiben & Stellungnahme',
    4: 'Phase 4 — Ablehnung & Klageerhebung',
  },
  arbeitsrecht: {
    1: 'Phase 1 — Eingang & Fallanlage',
    2: 'Phase 2 — Außergerichtlicher Versuch',
    3: 'Phase 3 — Gerichtliches Verfahren',
  },
  zivilrecht: {
    1: 'Phase 1 — Vorgerichtlich',
    2: 'Phase 2 — Klage',
  },
  insolvenzrecht: {
    1: 'Phase 1 — Forderungsanmeldung',
    2: 'Phase 2 — Prüfung & Widerspruch',
    3: 'Phase 3 — Verteilung & Abschluss',
  },
  wettbewerbsrecht: {
    1: 'Phase 1 — Eingang & Bewertung',
    2: 'Phase 2 — Außergerichtlich',
    3: 'Phase 3 — Gerichtliches Verfahren',
  },
  erbrecht: {
    1: 'Phase 1 — Eingang & Nachlassermittlung',
    2: 'Phase 2 — Außergerichtlich',
    3: 'Phase 3 — Gerichtliches Verfahren',
  },
};

function defaultPhaseNummern(rg: AufgabeRechtsgebiet): number[] {
  switch (rg) {
    case 'verkehrsrecht':
      return [1, 2, 3, 4];
    case 'arbeitsrecht':
    case 'insolvenzrecht':
    case 'wettbewerbsrecht':
    case 'erbrecht':
      return [1, 2, 3];
    case 'zivilrecht':
      return [1, 2];
    default:
      return [1];
  }
}

export const FALLBACK_SYSTEM_AUFGABEN: Aufgabe[] = [
  // ── Verkehrsrecht Phase 1 ─────────────────────────────────
  { id: 'vr-1-1', text: 'Mandatsunterlagen anfordern',                   rechtsgebiet: 'verkehrsrecht', phase: 1, system: true, reihenfolge: 10 },
  { id: 'vr-1-2', text: 'Unfallhergang dokumentieren',                    rechtsgebiet: 'verkehrsrecht', phase: 1, system: true, reihenfolge: 20 },
  { id: 'vr-1-3', text: 'Fahrzeugdaten aufnehmen',                        rechtsgebiet: 'verkehrsrecht', phase: 1, system: true, reihenfolge: 30 },
  { id: 'vr-1-4', text: 'Parteien anlegen (Versicherung, Gutachter)',     rechtsgebiet: 'verkehrsrecht', phase: 1, system: true, reihenfolge: 40 },
  { id: 'vr-1-5', text: 'Vollmacht einholen',                             rechtsgebiet: 'verkehrsrecht', phase: 1, system: true, reihenfolge: 50 },

  // ── Verkehrsrecht Phase 2 ─────────────────────────────────
  { id: 'vr-2-1', text: 'Schadensanzeige an Versicherung senden',         rechtsgebiet: 'verkehrsrecht', phase: 2, system: true, reihenfolge: 10, schriftverkehrTypId: 'schadensanzeige' },
  { id: 'vr-2-2', text: 'Gutachter beauftragen',                          rechtsgebiet: 'verkehrsrecht', phase: 2, system: true, reihenfolge: 20 },
  { id: 'vr-2-3', text: 'Gutachten prüfen und weiterleiten',              rechtsgebiet: 'verkehrsrecht', phase: 2, system: true, reihenfolge: 30, schriftverkehrTypId: 'gutachten_uebersandt' },
  { id: 'vr-2-4', text: 'Reparaturrechnung einholen und übersenden',      rechtsgebiet: 'verkehrsrecht', phase: 2, system: true, reihenfolge: 40, schriftverkehrTypId: 'rechnung_uebersandt' },
  { id: 'vr-2-5', text: 'Nutzungsausfall / Mietwagen geltend machen',     rechtsgebiet: 'verkehrsrecht', phase: 2, system: true, reihenfolge: 50, schriftverkehrTypId: 'nutzungsausfall' },

  // ── Verkehrsrecht Phase 3 ─────────────────────────────────
  { id: 'vr-3-1', text: 'Kürzungsschreiben prüfen und erfassen',          rechtsgebiet: 'verkehrsrecht', phase: 3, system: true, reihenfolge: 10, schriftverkehrTypId: 'kuerzungsschreiben_eingegangen' },
  { id: 'vr-3-2', text: 'Stellungnahme fertigen und senden',              rechtsgebiet: 'verkehrsrecht', phase: 3, system: true, reihenfolge: 20, schriftverkehrTypId: 'stellungnahme' },
  { id: 'vr-3-3', text: 'Mahnschreiben versenden (falls keine Reaktion)', rechtsgebiet: 'verkehrsrecht', phase: 3, system: true, reihenfolge: 30, schriftverkehrTypId: 'mahnschreiben' },

  // ── Verkehrsrecht Phase 4 ─────────────────────────────────
  { id: 'vr-4-1', text: 'Mandant über Klageerhebung informieren',         rechtsgebiet: 'verkehrsrecht', phase: 4, system: true, reihenfolge: 10 },
  { id: 'vr-4-2', text: 'Vorschussrechnung stellen',                      rechtsgebiet: 'verkehrsrecht', phase: 4, system: true, reihenfolge: 20 },
  { id: 'vr-4-3', text: 'Klageschrift einreichen',                        rechtsgebiet: 'verkehrsrecht', phase: 4, system: true, reihenfolge: 30, schriftverkehrTypId: 'klageschrift' },
  { id: 'vr-4-4', text: 'Mahnbescheid oder Klage einreichen',             rechtsgebiet: 'verkehrsrecht', phase: 4, system: true, reihenfolge: 40 },

  // ── Arbeitsrecht Phase 1 ──────────────────────────────────
  { id: 'ar-1-1', text: 'Kündigungsschreiben / Abmahnung prüfen',         rechtsgebiet: 'arbeitsrecht',  phase: 1, system: true, reihenfolge: 10 },
  { id: 'ar-1-2', text: 'KSchG-Frist prüfen (§ 4 — 3 Wochen!)',          rechtsgebiet: 'arbeitsrecht',  phase: 1, system: true, reihenfolge: 20 },
  { id: 'ar-1-3', text: 'RSV-Deckungsanfrage stellen',                    rechtsgebiet: 'arbeitsrecht',  phase: 1, system: true, reihenfolge: 30, schriftverkehrTypId: 'deckungsanfrage_rsv' },
  { id: 'ar-1-4', text: 'Vollmacht einholen',                             rechtsgebiet: 'arbeitsrecht',  phase: 1, system: true, reihenfolge: 40 },
  { id: 'ar-1-5', text: 'Falltyp bestimmen',                              rechtsgebiet: 'arbeitsrecht',  phase: 1, system: true, reihenfolge: 50 },

  // ── Arbeitsrecht Phase 2 ──────────────────────────────────
  { id: 'ar-2-1', text: 'Anschreiben an Gegenseite (Arbeitgeber) senden', rechtsgebiet: 'arbeitsrecht',  phase: 2, system: true, reihenfolge: 10, schriftverkehrTypId: 'anschreiben_gegenseite' },
  { id: 'ar-2-2', text: 'Stellungnahme / Vergleichsangebot prüfen',       rechtsgebiet: 'arbeitsrecht',  phase: 2, system: true, reihenfolge: 20, schriftverkehrTypId: 'stellungnahme' },
  { id: 'ar-2-3', text: 'Abfindungsangebot prüfen',                       rechtsgebiet: 'arbeitsrecht',  phase: 2, system: true, reihenfolge: 30 },
  { id: 'ar-2-4', text: 'Mahnschreiben versenden',                        rechtsgebiet: 'arbeitsrecht',  phase: 2, system: true, reihenfolge: 40, schriftverkehrTypId: 'mahnschreiben' },

  // ── Arbeitsrecht Phase 3 ──────────────────────────────────
  { id: 'ar-3-1', text: 'Klageschrift einreichen (ArbG)',                 rechtsgebiet: 'arbeitsrecht',  phase: 3, system: true, reihenfolge: 10, schriftverkehrTypId: 'klageschrift' },
  { id: 'ar-3-2', text: 'Gütetermin vorbereiten',                         rechtsgebiet: 'arbeitsrecht',  phase: 3, system: true, reihenfolge: 20 },
  { id: 'ar-3-3', text: 'Kammertermin koordinieren',                      rechtsgebiet: 'arbeitsrecht',  phase: 3, system: true, reihenfolge: 30 },

  // ── Zivilrecht Phase 1 ────────────────────────────────────
  { id: 'zr-1-1', text: 'Sachverhalt und Anspruchsgrundlage prüfen',      rechtsgebiet: 'zivilrecht',    phase: 1, system: true, reihenfolge: 10 },
  { id: 'zr-1-2', text: 'Mahnschreiben an Gegenseite senden',             rechtsgebiet: 'zivilrecht',    phase: 1, system: true, reihenfolge: 20, schriftverkehrTypId: 'mahnschreiben' },
  { id: 'zr-1-3', text: 'Forderungsbetrag und Streitwert ermitteln',      rechtsgebiet: 'zivilrecht',    phase: 1, system: true, reihenfolge: 30 },

  // ── Zivilrecht Phase 2 ────────────────────────────────────
  { id: 'zr-2-1', text: 'Klageschrift vorbereiten und einreichen',        rechtsgebiet: 'zivilrecht',       phase: 2, system: true, reihenfolge: 10, schriftverkehrTypId: 'klageschrift' },
  { id: 'zr-2-2', text: 'Stellungnahme zu Klageerwiderung fertigen',      rechtsgebiet: 'zivilrecht',       phase: 2, system: true, reihenfolge: 20, schriftverkehrTypId: 'stellungnahme' },
  { id: 'zr-2-3', text: 'Gerichtstermin koordinieren',                    rechtsgebiet: 'zivilrecht',       phase: 2, system: true, reihenfolge: 30 },

  // ── Insolvenzrecht Phase 1 ────────────────────────────────
  { id: 'ir-1-1', text: 'Vollmacht einholen',                             rechtsgebiet: 'insolvenzrecht',   phase: 1, system: true, reihenfolge: 10 },
  { id: 'ir-1-2', text: 'Forderung prüfen und beziffern',                 rechtsgebiet: 'insolvenzrecht',   phase: 1, system: true, reihenfolge: 20 },
  { id: 'ir-1-3', text: 'Forderungsanmeldung beim Insolvenzverwalter',    rechtsgebiet: 'insolvenzrecht',   phase: 1, system: true, reihenfolge: 30, schriftverkehrTypId: 'anschreiben_gegenseite' },
  { id: 'ir-1-4', text: 'RSV-Deckungsanfrage stellen',                   rechtsgebiet: 'insolvenzrecht',   phase: 1, system: true, reihenfolge: 40, schriftverkehrTypId: 'deckungsanfrage_rsv' },

  // ── Insolvenzrecht Phase 2 ────────────────────────────────
  { id: 'ir-2-1', text: 'Forderungstabelle prüfen',                       rechtsgebiet: 'insolvenzrecht',   phase: 2, system: true, reihenfolge: 10 },
  { id: 'ir-2-2', text: 'Widerspruch gegen Kürzung einlegen (ggf.)',      rechtsgebiet: 'insolvenzrecht',   phase: 2, system: true, reihenfolge: 20, schriftverkehrTypId: 'stellungnahme' },
  { id: 'ir-2-3', text: 'Prüfungstermin vorbereiten',                     rechtsgebiet: 'insolvenzrecht',   phase: 2, system: true, reihenfolge: 30 },

  // ── Insolvenzrecht Phase 3 ────────────────────────────────
  { id: 'ir-3-1', text: 'Verteilungsplan prüfen',                         rechtsgebiet: 'insolvenzrecht',   phase: 3, system: true, reihenfolge: 10 },
  { id: 'ir-3-2', text: 'Schlussabrechnung prüfen',                       rechtsgebiet: 'insolvenzrecht',   phase: 3, system: true, reihenfolge: 20 },
  { id: 'ir-3-3', text: 'Mandant über Abschluss informieren',             rechtsgebiet: 'insolvenzrecht',   phase: 3, system: true, reihenfolge: 30 },

  // ── Wettbewerbsrecht Phase 1 ──────────────────────────────
  { id: 'wb-1-1', text: 'Sachverhalt und Verletzungshandlung prüfen',     rechtsgebiet: 'wettbewerbsrecht', phase: 1, system: true, reihenfolge: 10 },
  { id: 'wb-1-2', text: 'Vollmacht einholen',                             rechtsgebiet: 'wettbewerbsrecht', phase: 1, system: true, reihenfolge: 20 },
  { id: 'wb-1-3', text: 'Streitwert ermitteln',                           rechtsgebiet: 'wettbewerbsrecht', phase: 1, system: true, reihenfolge: 30 },
  { id: 'wb-1-4', text: 'RSV-Deckungsanfrage stellen',                   rechtsgebiet: 'wettbewerbsrecht', phase: 1, system: true, reihenfolge: 40, schriftverkehrTypId: 'deckungsanfrage_rsv' },

  // ── Wettbewerbsrecht Phase 2 ──────────────────────────────
  { id: 'wb-2-1', text: 'Abmahnung an Verletzer versenden',               rechtsgebiet: 'wettbewerbsrecht', phase: 2, system: true, reihenfolge: 10, schriftverkehrTypId: 'anschreiben_gegenseite' },
  { id: 'wb-2-2', text: 'Unterlassungserklärung prüfen',                  rechtsgebiet: 'wettbewerbsrecht', phase: 2, system: true, reihenfolge: 20, schriftverkehrTypId: 'stellungnahme' },
  { id: 'wb-2-3', text: 'Schutzschrift hinterlegen (ggf.)',               rechtsgebiet: 'wettbewerbsrecht', phase: 2, system: true, reihenfolge: 30 },

  // ── Wettbewerbsrecht Phase 3 ──────────────────────────────
  { id: 'wb-3-1', text: 'Antrag auf einstweilige Verfügung / Klage',      rechtsgebiet: 'wettbewerbsrecht', phase: 3, system: true, reihenfolge: 10, schriftverkehrTypId: 'klageschrift' },
  { id: 'wb-3-2', text: 'Termin zur mündlichen Verhandlung vorbereiten',  rechtsgebiet: 'wettbewerbsrecht', phase: 3, system: true, reihenfolge: 20 },
  { id: 'wb-3-3', text: 'Ordnungsmittelantrag ggf. stellen',              rechtsgebiet: 'wettbewerbsrecht', phase: 3, system: true, reihenfolge: 30 },

  // ── Erbrecht Phase 1 ──────────────────────────────────────
  { id: 'er-1-1', text: 'Vollmacht einholen',                             rechtsgebiet: 'erbrecht',         phase: 1, system: true, reihenfolge: 10 },
  { id: 'er-1-2', text: 'Nachlassbestand ermitteln (Aktiva/Passiva)',     rechtsgebiet: 'erbrecht',         phase: 1, system: true, reihenfolge: 20 },
  { id: 'er-1-3', text: 'Testament / Erbvertrag prüfen',                  rechtsgebiet: 'erbrecht',         phase: 1, system: true, reihenfolge: 30 },
  { id: 'er-1-4', text: 'RSV-Deckungsanfrage stellen',                   rechtsgebiet: 'erbrecht',         phase: 1, system: true, reihenfolge: 40, schriftverkehrTypId: 'deckungsanfrage_rsv' },

  // ── Erbrecht Phase 2 ──────────────────────────────────────
  { id: 'er-2-1', text: 'Anschreiben an Gegenseite / Miterben senden',    rechtsgebiet: 'erbrecht',         phase: 2, system: true, reihenfolge: 10, schriftverkehrTypId: 'anschreiben_gegenseite' },
  { id: 'er-2-2', text: 'Stellungnahme / Vergleichsangebot prüfen',       rechtsgebiet: 'erbrecht',         phase: 2, system: true, reihenfolge: 20, schriftverkehrTypId: 'stellungnahme' },
  { id: 'er-2-3', text: 'Erbscheinantrag stellen (ggf.)',                 rechtsgebiet: 'erbrecht',         phase: 2, system: true, reihenfolge: 30 },

  // ── Erbrecht Phase 3 ──────────────────────────────────────
  { id: 'er-3-1', text: 'Klageschrift einreichen',                        rechtsgebiet: 'erbrecht',         phase: 3, system: true, reihenfolge: 10, schriftverkehrTypId: 'klageschrift' },
  { id: 'er-3-2', text: 'Gerichtstermin vorbereiten',                     rechtsgebiet: 'erbrecht',         phase: 3, system: true, reihenfolge: 20 },
  { id: 'er-3-3', text: 'Urteil / Vergleich prüfen und umsetzen',         rechtsgebiet: 'erbrecht',         phase: 3, system: true, reihenfolge: 30 },
];

/** @deprecated Nutze Store-State `bundledSystemAufgaben` */
export const SYSTEM_AUFGABEN = FALLBACK_SYSTEM_AUFGABEN;

type SystemOverride = Partial<
  Pick<
    Aufgabe,
    | 'text'
    | 'reihenfolge'
    | 'phase'
    | 'schriftverkehrTypId'
    | 'standardTextvorlageId'
    | 'aktion'
    | 'uploadErwartung'
    | 'prioritaet'
  >
>;

export interface PhaseKonfigurationEintrag {
  nummer: number;
  label: string;
}

interface AufgabenState {
  /** Aus SQLite (bundled Catalog); Fallback: FALLBACK_SYSTEM_AUFGABEN */
  bundledSystemAufgaben: Aufgabe[];
  bundledPhaseLabels: Record<AufgabeRechtsgebiet, Record<number, string>>;

  customAufgaben: Aufgabe[];
  customAufgabenProFall: Record<string, Aufgabe[]>;
  ausgeblendetProFall: Record<string, string[]>;
  deaktiviertIds: string[];
  erledigtProFall: Record<string, string[]>;
  /** Pro-Fall-Meta (Fälligkeit, Zeitstempel der Erledigung, Prio-Override) */
  fallAufgabenMeta: Record<string, Record<string, FallAufgabeMeta>>;
  systemOverrides: Record<string, SystemOverride>;
  /** Wenn gesetzt: exakte Phasen-Reihenfolge für dieses RG (inkl. zusätzlicher Phasen) */
  phasenNummern: Partial<Record<AufgabeRechtsgebiet, number[]>>;
  phaseLabelOverrides: Partial<Record<AufgabeRechtsgebiet, Record<number, string>>>;

  getPhasenNummern: (rg: AufgabeRechtsgebiet) => number[];
  getPhaseLabel: (rg: AufgabeRechtsgebiet, nummer: number) => string;
  getPhasenKonfiguration: (rg: AufgabeRechtsgebiet) => PhaseKonfigurationEintrag[];
  addPhase: (rg: AufgabeRechtsgebiet) => void;
  setPhaseLabel: (rg: AufgabeRechtsgebiet, nummer: number, label: string) => void;
  /** Keine aktive/zuweisende Aufgabe mehr in dieser Phase (nur noch deaktivierte System-Aufgaben oder leer); mindestens eine Phase bleibt */
  phaseKannEntferntWerden: (rg: AufgabeRechtsgebiet, nummer: number) => boolean;
  /** Entfernt die Phase aus der Konfiguration; verbleibende nur-deaktivierte System-Aufgaben werden auf die erste verbleibende Phase verschoben */
  removePhase: (rg: AufgabeRechtsgebiet, nummer: number) => void;
  /** Reihenfolge innerhalb einer Phase anhand der ID-Liste (zeilenweise, oben nach unten) */
  setReihenfolgeInPhase: (rg: AufgabeRechtsgebiet, phaseNummer: number, aufgabeIdsGeordnet: string[]) => void;
  /** Aufgabe in andere Phase; position = Index in der Zielphase (0-basiert) */
  verschiebeAufgabeZuPhase: (rg: AufgabeRechtsgebiet, aufgabeId: string, zielPhase: number, positionIndex: number) => void;

  getAufgaben: (rechtsgebiet: AufgabeRechtsgebiet, phase: number) => Aufgabe[];
  getTypenFuerPhase: (rechtsgebiet: AufgabeRechtsgebiet, phase: number) => string[];
  isErledigt: (fallId: string, aufgabeId: string) => boolean;
  toggleErledigt: (fallId: string, aufgabeId: string) => void;
  /** Aufgabe als erledigt markieren (kein Toggle; bereits erledigt bleibt unverändert) */
  markiereAufgabeErledigt: (fallId: string, aufgabeId: string) => void;
  markiereBySchriftverkehrTyp: (fallId: string, rechtsgebiet: AufgabeRechtsgebiet, phase: number, typId: string) => void;

  /** Fall-spezifische Metadaten (Fälligkeit, Prio-Override, Erledigungszeitpunkt) */
  getFallAufgabeMeta: (fallId: string, aufgabeId: string) => FallAufgabeMeta;
  setFallAufgabeFaelligkeit: (fallId: string, aufgabeId: string, iso: string | null) => void;
  setFallAufgabePrioritaet: (fallId: string, aufgabeId: string, prio: AufgabePrioritaet | null) => void;

  addAufgabe: (a: Omit<Aufgabe, 'id' | 'system'>) => void;
  addFallAufgabe: (fallId: string, a: Omit<Aufgabe, 'id' | 'system'>) => void;
  hideAufgabeImFall: (fallId: string, aufgabeId: string) => void;
  showAufgabeImFall: (fallId: string, aufgabeId: string) => void;
  deleteFallAufgabe: (fallId: string, aufgabeId: string) => void;
  updateAufgabe: (id: string, changes: Partial<Omit<Aufgabe, 'id' | 'system'>>) => void;
  deleteAufgabe: (id: string) => void;
  toggleDeaktiviert: (id: string) => void;
  resetSystemAufgabe: (id: string) => void;

  /** Nach Entfernen eines Dokumententyps aus der Kanzlei-Konfiguration */
  bereinigeNachDokumentTypEntfernt: (dokumentTypId: string) => void;
  /** Nach Löschen/Ausblenden von Textvorlagen — verwaiste Standardvorlage an Aufgaben entfernen */
  bereinigeNachTextvorlageIdsEntfernt: (vorlageIds: Iterable<string>) => void;
}

export const useAufgabenStore = create<AufgabenState>()(
  persist(
    (set, get) => ({
      bundledSystemAufgaben: structuredClone(FALLBACK_SYSTEM_AUFGABEN),
      bundledPhaseLabels: structuredClone(FALLBACK_PHASE_LABELS),

      customAufgaben: [],
      customAufgabenProFall: {},
      ausgeblendetProFall: {},
      deaktiviertIds: [],
      erledigtProFall: {},
      fallAufgabenMeta: {},
      systemOverrides: {},
      phasenNummern: {},
      phaseLabelOverrides: {},

      getPhasenNummern: (rg) => {
        const nums = get().phasenNummern[rg];
        if (nums && nums.length > 0) return [...nums].sort((a, b) => a - b);
        return defaultPhaseNummern(rg);
      },

      getPhaseLabel: (rg, nummer) => {
        const o = get().phaseLabelOverrides[rg]?.[nummer];
        if (o && o.trim()) return o;
        const def = get().bundledPhaseLabels[rg]?.[nummer];
        if (def) return def;
        // Fallback for new Rechtsgebiete not yet in persisted bundledPhaseLabels
        const fallback = FALLBACK_PHASE_LABELS[rg]?.[nummer];
        if (fallback) return fallback;
        return `Phase ${nummer}`;
      },

      getPhasenKonfiguration: (rg) =>
        get()
          .getPhasenNummern(rg)
          .map((nummer) => ({ nummer, label: get().getPhaseLabel(rg, nummer) })),

      addPhase: (rg) =>
        set((s) => {
          const prev = get().getPhasenNummern(rg);
          const nextNum = (prev.length ? Math.max(...prev) : 0) + 1;
          const merged = [...new Set([...prev, nextNum])].sort((a, b) => a - b);
          return { phasenNummern: { ...s.phasenNummern, [rg]: merged } };
        }),

      setPhaseLabel: (rg, nummer, label) =>
        set((s) => ({
          phaseLabelOverrides: {
            ...s.phaseLabelOverrides,
            [rg]: { ...(s.phaseLabelOverrides[rg] ?? {}), [nummer]: label },
          },
        })),

      phaseKannEntferntWerden: (rg, nummer) => {
        const nums = get().getPhasenNummern(rg);
        if (nums.length <= 1 || !nums.includes(nummer)) return false;

        const { customAufgaben, deaktiviertIds, systemOverrides } = get();
        const merged = [
          ...get().bundledSystemAufgaben.map((a) => ({ ...a, ...(systemOverrides[a.id] ?? {}) })),
          ...customAufgaben,
        ].filter((a) => a.rechtsgebiet === rg);

        const hatBlockierende = merged.some(
          (a) =>
            a.phase === nummer &&
            !(a.system && deaktiviertIds.includes(a.id)),
        );
        return !hatBlockierende;
      },

      removePhase: (rg, nummer) => {
        if (!get().phaseKannEntferntWerden(rg, nummer)) return;

        const nums = get().getPhasenNummern(rg);
        const remainingNums = nums.filter((n) => n !== nummer).sort((a, b) => a - b);
        const fallback = remainingNums[0];
        if (fallback === undefined) return;

        const merged = [
          ...get().bundledSystemAufgaben.map((a) => ({ ...a, ...(get().systemOverrides[a.id] ?? {}) })),
          ...get().customAufgaben,
        ].filter((a) => a.rechtsgebiet === rg);

        merged
          .filter((a) => a.phase === nummer)
          .forEach((a) => {
            get().updateAufgabe(a.id, { phase: fallback });
          });

        set((s) => {
          const prevLab = { ...(s.phaseLabelOverrides[rg] ?? {}) };
          delete prevLab[nummer];
          return {
            phasenNummern: { ...s.phasenNummern, [rg]: remainingNums },
            phaseLabelOverrides: {
              ...s.phaseLabelOverrides,
              [rg]: prevLab,
            },
          };
        });
      },

      setReihenfolgeInPhase: (_rg, phaseNummer, aufgabeIdsGeordnet) => {
        aufgabeIdsGeordnet.forEach((id, i) => {
          get().updateAufgabe(id, { phase: phaseNummer, reihenfolge: (i + 1) * 10 });
        });
      },

      verschiebeAufgabeZuPhase: (rg, aufgabeId, zielPhase, positionIndex) => {
        const mergedList = [
          ...get().bundledSystemAufgaben.filter((a) => !get().deaktiviertIds.includes(a.id)).map((a) => ({
            ...a,
            ...(get().systemOverrides[a.id] ?? {}),
          })),
          ...get().customAufgaben,
        ].filter((a) => a.rechtsgebiet === rg);

        const moved = mergedList.find((a) => a.id === aufgabeId);
        if (!moved) return;

        const altePhase = moved.phase;
        let zielListe = get()
          .getAufgaben(rg, zielPhase)
          .filter((a) => a.id !== aufgabeId)
          .sort((a, b) => a.reihenfolge - b.reihenfolge)
          .map((a) => a.id);

        const pos = Math.max(0, Math.min(positionIndex, zielListe.length));
        zielListe.splice(pos, 0, aufgabeId);
        zielListe.forEach((id, i) => {
          get().updateAufgabe(id, { phase: zielPhase, reihenfolge: (i + 1) * 10 });
        });

        if (altePhase !== zielPhase) {
          const altListe = get()
            .getAufgaben(rg, altePhase)
            .sort((a, b) => a.reihenfolge - b.reihenfolge)
            .map((a) => a.id);
          altListe.forEach((id, i) => {
            get().updateAufgabe(id, { reihenfolge: (i + 1) * 10 });
          });
        }
      },

      getAufgaben: (rechtsgebiet, phase) => {
        const { customAufgaben, deaktiviertIds, systemOverrides } = get();
        return [
          ...get().bundledSystemAufgaben.filter((a) => !deaktiviertIds.includes(a.id))
            .map((a) => ({ ...a, ...(systemOverrides[a.id] ?? {}) })),
          ...customAufgaben,
        ]
          .filter((a) => a.rechtsgebiet === rechtsgebiet && a.phase === phase)
          .sort((a, b) => a.reihenfolge - b.reihenfolge);
      },

      /** Leitet die vorgeschlagenen Dokumententypen einer Phase direkt aus den Aufgaben ab */
      getTypenFuerPhase: (rechtsgebiet, phase) => {
        const aufgaben = get().getAufgaben(rechtsgebiet, phase);
        const ids = aufgaben
          .filter((a) => !!a.schriftverkehrTypId)
          .map((a) => a.schriftverkehrTypId!);
        return [...new Set(ids)];
      },

      isErledigt: (fallId, aufgabeId) =>
        get().erledigtProFall[fallId]?.includes(aufgabeId) ?? false,

      toggleErledigt: (fallId, aufgabeId) =>
        set((s) => {
          const prev = s.erledigtProFall[fallId] ?? [];
          const wasErledigt = prev.includes(aufgabeId);
          const nextIds = wasErledigt
            ? prev.filter((id) => id !== aufgabeId)
            : [...prev, aufgabeId];
          const metaFall = { ...(s.fallAufgabenMeta[fallId] ?? {}) };
          const current = { ...(metaFall[aufgabeId] ?? {}) };
          if (wasErledigt) {
            delete current.erledigtAm;
          } else {
            current.erledigtAm = new Date().toISOString();
          }
          if (Object.keys(current).length === 0) {
            delete metaFall[aufgabeId];
          } else {
            metaFall[aufgabeId] = current;
          }
          return {
            erledigtProFall: { ...s.erledigtProFall, [fallId]: nextIds },
            fallAufgabenMeta: { ...s.fallAufgabenMeta, [fallId]: metaFall },
          };
        }),

      markiereAufgabeErledigt: (fallId, aufgabeId) =>
        set((s) => {
          const prev = s.erledigtProFall[fallId] ?? [];
          if (prev.includes(aufgabeId)) return s;
          const metaFall = { ...(s.fallAufgabenMeta[fallId] ?? {}) };
          metaFall[aufgabeId] = {
            ...(metaFall[aufgabeId] ?? {}),
            erledigtAm: new Date().toISOString(),
          };
          return {
            erledigtProFall: {
              ...s.erledigtProFall,
              [fallId]: [...prev, aufgabeId],
            },
            fallAufgabenMeta: { ...s.fallAufgabenMeta, [fallId]: metaFall },
          };
        }),

      /** Wird aufgerufen wenn ein Schriftverkehr gespeichert wird — markiert passende Aufgaben */
      markiereBySchriftverkehrTyp: (fallId, rechtsgebiet, phase, typId) =>
        set((s) => {
          const aufgaben = get().getAufgaben(rechtsgebiet, phase);
          const zuMarkieren = aufgaben
            .filter((a) => a.schriftverkehrTypId === typId && effectiveAktion(a) === 'brief')
            .map((a) => a.id);
          if (zuMarkieren.length === 0) return s;
          const prev = s.erledigtProFall[fallId] ?? [];
          const next = [...new Set([...prev, ...zuMarkieren])];
          const now = new Date().toISOString();
          const metaFall = { ...(s.fallAufgabenMeta[fallId] ?? {}) };
          for (const id of zuMarkieren) {
            if (prev.includes(id)) continue;
            metaFall[id] = { ...(metaFall[id] ?? {}), erledigtAm: now };
          }
          return {
            erledigtProFall: { ...s.erledigtProFall, [fallId]: next },
            fallAufgabenMeta: { ...s.fallAufgabenMeta, [fallId]: metaFall },
          };
        }),

      getFallAufgabeMeta: (fallId, aufgabeId) =>
        get().fallAufgabenMeta[fallId]?.[aufgabeId] ?? {},

      setFallAufgabeFaelligkeit: (fallId, aufgabeId, iso) =>
        set((s) => {
          const metaFall = { ...(s.fallAufgabenMeta[fallId] ?? {}) };
          const current = { ...(metaFall[aufgabeId] ?? {}) };
          if (iso) {
            current.faelligAm = iso;
          } else {
            delete current.faelligAm;
          }
          if (Object.keys(current).length === 0) {
            delete metaFall[aufgabeId];
          } else {
            metaFall[aufgabeId] = current;
          }
          return { fallAufgabenMeta: { ...s.fallAufgabenMeta, [fallId]: metaFall } };
        }),

      setFallAufgabePrioritaet: (fallId, aufgabeId, prio) =>
        set((s) => {
          const metaFall = { ...(s.fallAufgabenMeta[fallId] ?? {}) };
          const current = { ...(metaFall[aufgabeId] ?? {}) };
          if (prio) {
            current.prioritaet = prio;
          } else {
            delete current.prioritaet;
          }
          if (Object.keys(current).length === 0) {
            delete metaFall[aufgabeId];
          } else {
            metaFall[aufgabeId] = current;
          }
          return { fallAufgabenMeta: { ...s.fallAufgabenMeta, [fallId]: metaFall } };
        }),

      addAufgabe: (a) =>
        set((s) => ({
          customAufgaben: [
            ...s.customAufgaben,
            { ...a, id: `custom-aufgabe-${Date.now()}`, system: false },
          ],
        })),

      addFallAufgabe: (fallId, a) =>
        set((s) => ({
          customAufgabenProFall: {
            ...s.customAufgabenProFall,
            [fallId]: [
              ...(s.customAufgabenProFall[fallId] ?? []),
              { ...a, id: `custom-fall-aufgabe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, system: false },
            ],
          },
        })),

      hideAufgabeImFall: (fallId, aufgabeId) =>
        set((s) => {
          const prev = s.ausgeblendetProFall[fallId] ?? [];
          if (prev.includes(aufgabeId)) return s;
          return {
            ausgeblendetProFall: {
              ...s.ausgeblendetProFall,
              [fallId]: [...prev, aufgabeId],
            },
          };
        }),

      showAufgabeImFall: (fallId, aufgabeId) =>
        set((s) => ({
          ausgeblendetProFall: {
            ...s.ausgeblendetProFall,
            [fallId]: (s.ausgeblendetProFall[fallId] ?? []).filter((id) => id !== aufgabeId),
          },
        })),

      deleteFallAufgabe: (fallId, aufgabeId) =>
        set((s) => ({
          customAufgabenProFall: {
            ...s.customAufgabenProFall,
            [fallId]: (s.customAufgabenProFall[fallId] ?? []).filter((a) => a.id !== aufgabeId),
          },
        })),

      updateAufgabe: (id, changes) => {
        const isSystem = get().bundledSystemAufgaben.some((a) => a.id === id);
        if (isSystem) {
          set((s) => ({
            systemOverrides: {
              ...s.systemOverrides,
              [id]: { ...(s.systemOverrides[id] ?? {}), ...changes },
            },
          }));
        } else {
          set((s) => {
            const nextCustom = s.customAufgaben.map((a) => (a.id === id ? { ...a, ...changes } : a));
            const nextPerFall = Object.fromEntries(
              Object.entries(s.customAufgabenProFall).map(([fid, aufgaben]) => [
                fid,
                aufgaben.map((a) => (a.id === id ? { ...a, ...changes } : a)),
              ]),
            );
            return {
              customAufgaben: nextCustom,
              customAufgabenProFall: nextPerFall,
            };
          });
        }
      },

      deleteAufgabe: (id) =>
        set((s) => ({
          customAufgaben: s.customAufgaben.filter((a) => a.id !== id),
          customAufgabenProFall: Object.fromEntries(
            Object.entries(s.customAufgabenProFall).map(([fid, aufgaben]) => [
              fid,
              aufgaben.filter((a) => a.id !== id),
            ]),
          ),
          ausgeblendetProFall: Object.fromEntries(
            Object.entries(s.ausgeblendetProFall).map(([fid, ids]) => [
              fid,
              ids.filter((x) => x !== id),
            ]),
          ),
        })),

      toggleDeaktiviert: (id) =>
        set((s) => ({
          deaktiviertIds: s.deaktiviertIds.includes(id)
            ? s.deaktiviertIds.filter((x) => x !== id)
            : [...s.deaktiviertIds, id],
        })),

      resetSystemAufgabe: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.systemOverrides;
          return { systemOverrides: rest };
        }),

      bereinigeNachDokumentTypEntfernt: (dokumentTypId) =>
        set((s) => {
          let systemOverrides = { ...s.systemOverrides };

          const customAufgaben = s.customAufgaben.map((a) => {
            if (a.schriftverkehrTypId !== dokumentTypId) return a;
            const next = { ...a };
            delete next.schriftverkehrTypId;
            delete next.standardTextvorlageId;
            return next;
          });

          get().bundledSystemAufgaben.forEach((base) => {
            const merged = { ...base, ...(systemOverrides[base.id] ?? {}) };
            if (merged.schriftverkehrTypId !== dokumentTypId) return;
            systemOverrides = {
              ...systemOverrides,
              [base.id]: {
                ...(systemOverrides[base.id] ?? {}),
                schriftverkehrTypId: '',
                standardTextvorlageId: '',
              },
            };
          });

          return { systemOverrides, customAufgaben };
        }),

      bereinigeNachTextvorlageIdsEntfernt: (vorlageIds) => {
        const remove = new Set(vorlageIds);
        if (remove.size === 0) return;

        set((s) => {
          let systemOverrides = { ...s.systemOverrides };

          const customAufgaben = s.customAufgaben.map((a) => {
            if (!a.standardTextvorlageId || !remove.has(a.standardTextvorlageId)) return a;
            const next = { ...a };
            delete next.standardTextvorlageId;
            return next;
          });

          get().bundledSystemAufgaben.forEach((base) => {
            const merged = { ...base, ...(systemOverrides[base.id] ?? {}) };
            if (!merged.standardTextvorlageId || !remove.has(merged.standardTextvorlageId)) return;
            systemOverrides = {
              ...systemOverrides,
              [base.id]: {
                ...(systemOverrides[base.id] ?? {}),
                standardTextvorlageId: '',
              },
            };
          });

          return { systemOverrides, customAufgaben };
        });
      },
    }),
    {
      name: 'jurist-aufgaben',
      version: 8,
      migrate: (persistedState, fromVersion) => {
        if (persistedState == null || typeof persistedState !== 'object') return persistedState as AufgabenState;
        let p = persistedState as Partial<AufgabenState>;

        if (fromVersion < 4) {
          if (!Array.isArray(p.bundledSystemAufgaben) || p.bundledSystemAufgaben.length === 0) {
            p = { ...p, bundledSystemAufgaben: structuredClone(FALLBACK_SYSTEM_AUFGABEN) };
          }
          if (!p.bundledPhaseLabels || typeof p.bundledPhaseLabels !== 'object') {
            p = { ...p, bundledPhaseLabels: structuredClone(FALLBACK_PHASE_LABELS) };
          }
        }

        if (fromVersion < 2) {
          p = {
            ...p,
            phasenNummern: typeof p.phasenNummern === 'object' && p.phasenNummern !== null ? p.phasenNummern : {},
            phaseLabelOverrides:
              typeof p.phaseLabelOverrides === 'object' && p.phaseLabelOverrides !== null ? p.phaseLabelOverrides : {},
          };
        }
        if (fromVersion < 5) {
          p = {
            ...p,
            customAufgabenProFall:
              typeof p.customAufgabenProFall === 'object' && p.customAufgabenProFall !== null
                ? p.customAufgabenProFall
                : {},
          };
        }
        if (fromVersion < 6) {
          p = {
            ...p,
            ausgeblendetProFall:
              typeof p.ausgeblendetProFall === 'object' && p.ausgeblendetProFall !== null
                ? p.ausgeblendetProFall
                : {},
          };
        }
        if (fromVersion < 7) {
          // Merge new Rechtsgebiete (insolvenzrecht, wettbewerbsrecht, erbrecht) into persisted state
          const newRg = ['insolvenzrecht', 'wettbewerbsrecht', 'erbrecht'] as const;
          const labels = (p.bundledPhaseLabels ?? {}) as Record<string, Record<number, string>>;
          for (const rg of newRg) {
            if (!labels[rg]) {
              labels[rg] = structuredClone(FALLBACK_PHASE_LABELS[rg]);
            }
          }
          p = { ...p, bundledPhaseLabels: labels as Record<AufgabeRechtsgebiet, Record<number, string>> };

          const existingAufgaben = Array.isArray(p.bundledSystemAufgaben) ? p.bundledSystemAufgaben : [];
          const existingIds = new Set(existingAufgaben.map((a) => a.id));
          const newAufgaben = FALLBACK_SYSTEM_AUFGABEN.filter((a) => !existingIds.has(a.id));
          p = { ...p, bundledSystemAufgaben: [...existingAufgaben, ...newAufgaben] };
        }
        if (fromVersion < 8) {
          p = {
            ...p,
            fallAufgabenMeta:
              typeof (p as { fallAufgabenMeta?: unknown }).fallAufgabenMeta === 'object' &&
              (p as { fallAufgabenMeta?: unknown }).fallAufgabenMeta !== null
                ? (p as { fallAufgabenMeta: Record<string, Record<string, FallAufgabeMeta>> }).fallAufgabenMeta
                : {},
          };
        }
        return p as AufgabenState;
      },
    },
  ),
);
