// ============================================================
// Gemeinsame TypeScript-Typen — Anwalts-App
// ============================================================

export type Rechtsgebiet =
  | 'verkehrsrecht'
  | 'arbeitsrecht'
  | 'zivilrecht'
  | 'insolvenzrecht'
  | 'wettbewerbsrecht'
  | 'erbrecht';

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
// Insolvenzrecht / Wettbewerbsrecht / Erbrecht Phasen 1–3
export type IRPhase = 1 | 2 | 3;
export type WBPhase = 1 | 2 | 3;
export type ERPhase = 1 | 2 | 3;

export type ZRFalltyp =
  | 'vertrag'
  | 'forderung'
  | 'kaufrecht'
  | 'schadensersatz'
  | 'mietrecht'
  | 'sonstiges';

export type IRFalltyp =
  | 'regelinsolvenz'
  | 'verbraucherinsolvenz'
  | 'eigenverwaltung'
  | 'planinsolvenz'
  | 'sonstiges';

export type WBFalltyp =
  | 'abmahnung'
  | 'einstw_verfuegung'
  | 'hauptsacheklage'
  | 'schutzschrift'
  | 'sonstiges';

export type ERFalltyp =
  | 'pflichtteil'
  | 'testament_anfechtung'
  | 'erbschein'
  | 'erbauseinandersetzung'
  | 'nachlasspflege'
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

/** Eine Partei mit Rolle am Verkehrsfall (mehrfach gleiche Rolle möglich, z. B. zwei Gutachter). */
export interface FallParteiEintrag {
  eintragId: string;
  rolle: ParteienTyp;
  parteiId: string;
}

export interface VerkehrsrechtDaten {
  abrechnungsart: Abrechnungsart;
  anspruchsinhaber: Anspruchsinhaber;
  /** Wurde der Unfall polizeilich aufgenommen? */
  polizeiAufnahme?: boolean;
  /** Polizeiliches Aktenzeichen */
  polizeiAktenzeichen?: string;
  /** Geht der Fall an die Staatsanwaltschaft (z. B. Fahrerflucht)? */
  staatsanwaltschaftFall?: boolean;
  /** Justiz-/StA-Aktenzeichen */
  justizAktenzeichen?: string;
  fahrzeug: Fahrzeug;
  /** Dynamische Liste; gleichzeitig werden die ersten je Rolle in gutachterId / … gespiegelt (Kompatibilität). */
  beteiligteParteien?: FallParteiEintrag[];
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

export interface InsolvenzrechtDaten {
  falltyp: IRFalltyp;
  schuldner?: string;
  forderungsbetrag?: number;
  insolvenzgericht?: string;
  insolvenzAktenzeichen?: string;
  antragsdatum?: string;         // ISO date
  eroeffnungsdatum?: string;     // ISO date
}

export interface WettbewerbsrechtDaten {
  falltyp: WBFalltyp;
  gegenseite?: string;
  verletzungshandlung?: string;
  abmahnungsdatum?: string;      // ISO date
  fristsetzung?: string;         // ISO date
  streitwert?: number;
}

export interface ErbrechtDaten {
  falltyp: ERFalltyp;
  erblasser?: string;
  todesdatum?: string;           // ISO date
  nachlassgericht?: string;
  nachlassAktenzeichen?: string;
  forderungsbetrag?: number;
}

/** Einträge in der Fallaktivität (manuell oder protokolliert) */
export type FallAktivitaetTyp =
  | 'notiz'
  | 'anruf'
  | 'phase_geaendert'
  | 'status_geaendert'
  | 'wiedervorlage';

export interface FallAktivitaet {
  id: string;
  typ: FallAktivitaetTyp;
  /** ISO-Zeitstempel */
  zeitpunkt: string;
  titel: string;
  beschreibung?: string;
  meta?: Record<string, unknown>;
}

export interface Fall {
  id: string;
  aktenzeichen: string;
  rechtsgebiet: Rechtsgebiet;
  status: FallStatus;
  /** Phasennummer (1…n), n ist konfigurierbar pro Rechtsgebiet */
  phase: number;
  mandantId: string;
  /** Zusätzliche Mandanten am Fall (der in mandantId bleibt immer der Hauptmandant). */
  weitereMandantenIds?: string[];
  wiedervorlage?: string;    // ISO date
  erstelltAm: string;        // ISO date
  /** @deprecated Erste Notizen aus älteren Versionen — Inhalt erscheint in der Fallaktivität; neue Notizen liegen in aktivitaeten */
  notizen?: string;
  /** Chronologische Aktivität (Notizen, Anrufe, Phasen-/Statuswechsel, Wiedervorlagen …) */
  aktivitaeten?: FallAktivitaet[];
  // Rechtsgebiet-spezifisch
  verkehrsrecht?: VerkehrsrechtDaten;
  arbeitsrecht?: ArbeitsrechtDaten;
  zivilrecht?: ZivilrechtDaten;
  insolvenzrecht?: InsolvenzrechtDaten;
  wettbewerbsrecht?: WettbewerbsrechtDaten;
  erbrecht?: ErbrechtDaten;
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

// ── RVG Gebührentabelle (Anlage 2) ───────────────────────

/** Eine Stufe der Anlage-2-Tabelle: Gegenstandswert bis X → 1,0-Gebühr Y */
export interface RvgTabelleEintrag {
  bis: number;     // Gegenstandswert bis (einschließlich) in €
  gebuehr: number; // 1,0-Gebühr in €
}

/** Eine versionierte Gebührentabelle (z. B. "ab 01.06.2025") */
export interface RvgTabelle {
  version: string;      // eindeutiger Schlüssel, z. B. "2025-06-01"
  bezeichnung: string;  // Anzeigename, z. B. "ab 01.06.2025"
  gueltigAb: string;    // ISO date
  eintraege: RvgTabelleEintrag[];
}

// ── Abrechnung (RVG) ─────────────────────────────────────

/** Rechnungstyp */
export type RechnungsTyp = 'rvg' | 'vorschuss' | 'honorar';

/** Eine einzelne Gebührenposition in der RVG/Vorschuss-Rechnung */
export interface AbrechnungsPosition {
  id: string;
  vvNummer: string;           // z. B. "3100"
  bezeichnung: string;        // z. B. "Verfahrensgebühr Nr. 3100 VV RVG"
  faktor: number;             // z. B. 1.3
  gebuehrEinfach: number;     // 1,0-Gebühr aus Anlage 2 (gerundet)
  betrag: number;             // faktor × gebuehrEinfach
  anmerkung?: string;
}

/** Einheit einer Honorar-Position */
export type HonorarEinheit = 'stunden' | 'stueck' | 'pauschale';

/** Eine Leistungsposition in einer Honorarrechnung */
export interface HonorarPosition {
  id: string;
  beschreibung: string;
  einheit: HonorarEinheit;
  menge: number;
  einzelpreis: number;        // € pro Einheit (oder Pauschalbetrag)
  betrag: number;             // menge × einzelpreis
}

export type AbrechnungStatus = 'entwurf' | 'gestellt' | 'bezahlt' | 'storniert';

export interface Abrechnung {
  id: string;
  fallId: string;
  rechnungsNummer: string;
  datum: string;              // ISO date
  /** Typ der Rechnung (Default: 'rvg' für Altdaten) */
  rechnungsTyp: RechnungsTyp;
  // ── RVG / Vorschuss ──────────────────────────────────
  gegenstandswert: number;
  positionen: AbrechnungsPosition[];
  anrechnung?: number;        // § 15a RVG
  auslagenPauschale: number;
  // ── Honorar ──────────────────────────────────────────
  honorarPositionen?: HonorarPosition[];
  // ── Gemeinsam ─────────────────────────────────────────
  zwischensumme: number;
  mwstSatz: number;           // 0.19
  mwstBetrag: number;
  gesamtBetrag: number;
  status: AbrechnungStatus;
  notizen?: string;
  erstelltAm: string;
}

// ── Schadenskalkulation (Verkehrsrecht) ───────────────────

export interface SchadenskalkulationPosition {
  id: string;
  bezeichnung: string;
  betrag: number;
}

export interface Schadenskalkulation {
  id: string;
  fallId: string;
  erstelltAm: string;
  datum: string;              // ISO date
  // Schaden-Positionen (editierbar)
  positionen: SchadenskalkulationPosition[];
  // Vorberechnete Felder
  schadensumme: number;       // Summe der Positionen
  /** Anwaltsgebühr VV 2300 auf Schadenssumme (netto, ohne MwSt) */
  anwaltsGebuehrNetto: number;
  /** Auslagenpauschale VV 7002 */
  auslagenPauschale: number;
  /** 19% USt. auf Anwaltskosten netto */
  anwaltsGebuehrMwst: number;
  /** Gesamte Anwaltskosten brutto */
  anwaltsgebuehr: number;
  gesamtforderung: number;    // schadensumme + anwaltsgebuehr
  /** Fristdatum für Erledigung (optional) */
  erledigungDatum?: string;
  /** Vorbehalt weiterer Schadenspositionen */
  mitVorbehalt?: boolean;
  notizen?: string;
}

// ── API Response Typen ────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
