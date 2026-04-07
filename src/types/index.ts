// ============================================================
// Gemeinsame TypeScript-Typen — Anwalts-App
// ============================================================

export type Rechtsgebiet = 'verkehrsrecht' | 'arbeitsrecht' | 'zivilrecht';

export type FallStatus =
  | 'aktiv'
  | 'abgeschlossen'
  | 'klage'
  | 'einigung'
  | 'frist_abgelaufen';

// Verkehrsrecht Phasen 1–4
export type VRPhase = 1 | 2 | 3 | 4;
// Arbeitsrecht Phasen 1–3
export type ARPhase = 1 | 2 | 3;
// Zivilrecht Phasen 1–2
export type ZRPhase = 1 | 2;

export type ZRFalltyp =
  | 'vertrag'
  | 'forderung'
  | 'kaufrecht'
  | 'schadensersatz'
  | 'mietrecht'
  | 'sonstiges';

export type Abrechnungsart = 'fiktiv' | 'konkret';
export type Anspruchsinhaber = 'mandant' | 'leasing' | 'bank';

export type ARFalltyp =
  | 'kuendigung'
  | 'abmahnung'
  | 'aufhebung'
  | 'lohn'
  | 'mobbing'
  | 'versetzung';

// ── Mandanten / Klienten-Portfolio ────────────────────────

/** Privatperson vs. Unternehmen (Portfolio-Ansicht) */
export type MandantKategorie = 'privat' | 'unternehmen';

/** Bearbeitungs-/Lifecycle-Status im Mandantenbestand */
export type MandantEngagementStatus = 'aktiv' | 'onboarding' | 'ruhend';

export interface Mandant {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  adresse: Adresse;
  rsv: boolean;          // Rechtsschutzversicherung vorhanden?
  rsvGesellschaft?: string;
  rsvNummer?: string;
  erstelltAm: string;    // ISO date string
  kategorie?: MandantKategorie;
  engagementStatus?: MandantEngagementStatus;
}

export interface Adresse {
  strasse: string;
  plz: string;
  ort: string;
}

export type ParteienTyp = 'gutachter' | 'werkstatt' | 'versicherung' | 'gegenseite' | 'gericht';

export interface Partei {
  id: string;
  typ: ParteienTyp;
  name: string;
  email?: string;
  telefon?: string;
  adresse?: Adresse;
  /** ISO — Anlagezeitpunkt im Verzeichnis */
  erstelltAm?: string;
  // Gutachter-spezifisch
  gutachterNr?: string;
  // Versicherung-spezifisch
  schadensnummer?: string;
}

// ── Fahrzeug ──────────────────────────────────────────────

export interface Fahrzeug {
  kennzeichen: string;
  typ: string;
  baujahr: number;
  erstzulassung?: string; // ISO date string (YYYY-MM-DD)
  fahrgestellnummer?: string;
}

// ── Fall ──────────────────────────────────────────────────

export interface VerkehrsrechtDaten {
  abrechnungsart: Abrechnungsart;
  anspruchsinhaber: Anspruchsinhaber;
  fahrzeug: Fahrzeug;
  gutachterId?: string;
  werkstattId?: string;
  versicherungId?: string;
  gutachtenwert?: number;   // netto, bei fiktiv
  reparaturkosten?: number; // brutto, bei konkret
  nutzungsausfall?: number;
  mietwagen?: number;
  schadenshoehe?: number;
}

export interface ArbeitsrechtDaten {
  falltyp: ARFalltyp;
  gegenseiteId?: string;
  gerichtId?: string;
  kuendigungsdatum?: string; // ISO date — für KSchG-Frist
  fristEnde?: string;        // ISO date — 3-Wochen-Frist Ende
  lohnrueckstand?: number;
}

export interface ZivilrechtDaten {
  falltyp: ZRFalltyp;
  gegenseite?: string;           // Name der Gegenseite (freies Textfeld)
  gegenseiteId?: string;
  gerichtId?: string;
  streitwert?: number;
  forderungsbetrag?: number;
  mahnfristEnde?: string;        // ISO date — Frist aus Mahnschreiben
  klageEingereichtAm?: string;   // ISO date
}

export interface Fall {
  id: string;
  aktenzeichen: string;
  rechtsgebiet: Rechtsgebiet;
  status: FallStatus;
  phase: VRPhase | ARPhase | ZRPhase;
  mandantId: string;
  wiedervorlage?: string;    // ISO date
  erstelltAm: string;        // ISO date
  notizen?: string;
  // Rechtsgebiet-spezifisch
  verkehrsrecht?: VerkehrsrechtDaten;
  arbeitsrecht?: ArbeitsrechtDaten;
  zivilrecht?: ZivilrechtDaten;
}

// ── Wiedervorlage ─────────────────────────────────────────

export type WiedervorlageTyp =
  | 'frist_versicherung'
  | 'kschg_frist'
  | 'lag_berufung'
  | 'allgemein'
  | 'kuendigung_frist';

export interface Wiedervorlage {
  id: string;
  fallId: string;
  typ: WiedervorlageTyp;
  faelligAm: string;  // ISO date
  beschreibung: string;
  erledigt: boolean;
}

// ── Schriftverkehr ────────────────────────────────────────

export type SchriftverkehrTyp =
  | 'schadensanzeige'
  | 'gutachten_uebersandt'
  | 'rechnung_uebersandt'
  | 'nutzungsausfall'
  | 'kuerzungsschreiben_eingegangen'
  | 'stellungnahme'
  | 'mahnschreiben'
  | 'anschreiben_gegenseite'
  | 'deckungsanfrage_rsv'
  | 'klageschrift'
  | 'sonstiges';

export type SchriftverkehrRichtung = 'gesendet' | 'empfangen';

export interface Schriftverkehr {
  id: string;
  fallId: string;
  typ: SchriftverkehrTyp;
  richtung: SchriftverkehrRichtung;
  datum: string;         // ISO date
  betreff: string;
  inhalt: string;
  empfaengerEmail?: string;
  empfaengerName?: string;
  erstelltAm: string;
}

// ── API Response Typen ────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
