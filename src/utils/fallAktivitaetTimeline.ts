import type { Dokument, UploadedDatei } from '../store/dokumenteStore';
import type {
  Fall,
  FallAktivitaetTyp,
  FallStatus,
  Rechtsgebiet,
  Schriftverkehr,
  SchriftverkehrTyp,
} from '../types';

/** Zeile in der zusammengeführten Fallaktivitäts-Ansicht */
export interface FallaktivitaetZeile {
  id: string;
  zeitpunkt: string;
  quelle: 'gespeichert' | 'schriftverkehr' | 'upload' | 'pdf' | 'legacy_notiz';
  titel: string;
  beschreibung?: string;
  gespeichertTyp?: FallAktivitaetTyp;
  /** ID aus `fall.aktivitaeten` — nur bei Notizen/Anrufen (Bearbeiten/Löschen) */
  gespeichertAktivitaetId?: string;
}

const STATUS_LABEL: Record<FallStatus, string> = {
  aktiv: 'Aktiv',
  einigung: 'Einigung / Vergleich',
  klage: 'Klage erhoben',
  abgeschlossen: 'Abgeschlossen',
  frist_abgelaufen: 'Frist abgelaufen',
};

const SV_TYP_LABEL: Record<SchriftverkehrTyp, string> = {
  schadensanzeige: 'Schadensanzeige',
  gutachten_uebersandt: 'Gutachten übersandt',
  rechnung_uebersandt: 'Reparaturrechnung übersandt',
  nutzungsausfall: 'Nutzungsausfall / Mietwagen',
  kuerzungsschreiben_eingegangen: 'Kürzungsschreiben',
  stellungnahme: 'Stellungnahme',
  mahnschreiben: 'Mahnschreiben',
  anschreiben_gegenseite: 'Anschreiben Gegenseite',
  deckungsanfrage_rsv: 'Deckungsanfrage RSV',
  klageschrift: 'Klageschrift',
  sonstiges: 'Sonstiges',
};

const DATEI_KAT_LABEL: Record<UploadedDatei['kategorie'], string> = {
  gutachten: 'Gutachten',
  rechnung: 'Rechnung',
  rechnung_werkstatt: 'Werkstattrechnung',
  messwerk: 'Messwerk',
  foto: 'Foto',
  sonstiges: 'Sonstiges',
};

function parseZeit(s: string): number {
  return new Date(s).getTime();
}

export interface BuildFallaktivitaetTimelineParams {
  fall: Fall;
  schriftverkehr: Schriftverkehr[];
  uploads: UploadedDatei[];
  dokumentePdf: Dokument[];
  getPhaseLabel: (rg: Rechtsgebiet, nummer: number) => string;
}

/**
 * Vereinigt gespeicherte Aktivitäten, Schriftverkehr, Uploads und PDF-Akte zu einer Zeitachse (neueste oben).
 */
export function buildFallaktivitaetTimeline(p: BuildFallaktivitaetTimelineParams): FallaktivitaetZeile[] {
  const { fall, schriftverkehr, uploads, dokumentePdf, getPhaseLabel } = p;
  const rg = fall.rechtsgebiet;
  const zeilen: FallaktivitaetZeile[] = [];

  const hatNotizInAktivitaeten = (fall.aktivitaeten ?? []).some((a) => a.typ === 'notiz');
  if (fall.notizen?.trim() && !hatNotizInAktivitaeten) {
    zeilen.push({
      id: `legacy-notizen-${fall.id}`,
      zeitpunkt: fall.erstelltAm,
      quelle: 'legacy_notiz',
      titel: 'Notiz',
      beschreibung: fall.notizen.trim(),
    });
  }

  for (const a of fall.aktivitaeten ?? []) {
    let titel = a.titel;
    let beschreibung = a.beschreibung;
    if (a.typ === 'phase_geaendert' && a.meta && typeof a.meta.von === 'number' && typeof a.meta.nach === 'number') {
      const von = a.meta.von as number;
      const nach = a.meta.nach as number;
      titel = 'Phase geändert';
      beschreibung = `${getPhaseLabel(rg, von)} → ${getPhaseLabel(rg, nach)}`;
    } else if (a.typ === 'status_geaendert' && a.meta && typeof a.meta.alt === 'string' && typeof a.meta.neu === 'string') {
      titel = 'Status geändert';
      beschreibung = `${STATUS_LABEL[a.meta.alt as FallStatus] ?? a.meta.alt} → ${STATUS_LABEL[a.meta.neu as FallStatus] ?? a.meta.neu}`;
    } else if (a.typ === 'wiedervorlage' && a.meta && typeof a.meta.faelligAm === 'string') {
      titel = a.titel || 'Wiedervorlage angelegt';
      beschreibung = a.beschreibung ?? `Fällig ${new Date(a.meta.faelligAm as string).toLocaleDateString('de-DE')}`;
    }
    const bearbeitbar = a.typ === 'notiz' || a.typ === 'anruf';
    zeilen.push({
      id: `gespeichert-${a.id}`,
      zeitpunkt: a.zeitpunkt,
      quelle: 'gespeichert',
      titel,
      beschreibung,
      gespeichertTyp: a.typ,
      gespeichertAktivitaetId: bearbeitbar ? a.id : undefined,
    });
  }

  for (const sv of schriftverkehr) {
    const typLabel = SV_TYP_LABEL[sv.typ] ?? sv.typ;
    const richtung = sv.richtung === 'gesendet' ? 'Gesendet' : 'Empfangen';
    zeilen.push({
      id: `sv-${sv.id}`,
      zeitpunkt: sv.erstelltAm || sv.datum,
      quelle: 'schriftverkehr',
      titel: `Schriftverkehr — ${typLabel} (${richtung})`,
      beschreibung: sv.betreff,
    });
  }

  for (const u of uploads) {
    zeilen.push({
      id: `up-${u.id}`,
      zeitpunkt: u.hochgeladenAm,
      quelle: 'upload',
      titel: `Datei hochgeladen (${DATEI_KAT_LABEL[u.kategorie]})`,
      beschreibung: u.dateiname,
    });
  }

  for (const d of dokumentePdf) {
    zeilen.push({
      id: `pdf-${d.id}`,
      zeitpunkt: d.erstelltAm,
      quelle: 'pdf',
      titel: `PDF in der Akte — ${d.betreff}`,
      beschreibung: d.dateiname,
    });
  }

  zeilen.sort((a, b) => parseZeit(b.zeitpunkt) - parseZeit(a.zeitpunkt));
  return zeilen;
}

/** Für Dashboard-Karte / Kurztext: letzte Notiz (Betreff bevorzugt) oder Legacy-Feld */
export function fallNeuesteNotizText(fall: Fall): string | undefined {
  const notizen = (fall.aktivitaeten ?? []).filter(
    (a) => a.typ === 'notiz' && (a.beschreibung?.trim() || a.titel?.trim()),
  );
  if (notizen.length > 0) {
    const sorted = [...notizen].sort((a, b) => b.zeitpunkt.localeCompare(a.zeitpunkt));
    const n = sorted[0];
    const t = n.titel?.trim();
    if (t && t !== 'Notiz') return t;
    return n.beschreibung?.trim();
  }
  return fall.notizen?.trim() || undefined;
}

/** Volltextsuche über Aktenzeichen-Zusatz: Notizen + Aktivitätstexte */
export function fallAktivitaetSuchtext(fall: Fall): string {
  const teile = [
    fall.notizen ?? '',
    ...(fall.aktivitaeten ?? []).map((a) => `${a.titel} ${a.beschreibung ?? ''}`),
  ];
  return teile.join(' ').toLowerCase();
}
