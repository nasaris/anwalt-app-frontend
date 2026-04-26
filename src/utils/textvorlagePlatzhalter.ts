import type { Fall, Mandant, Partei } from '../types';
import type { KanzleiDaten } from '../store/kanzleiStore';
import type { Textbaustein } from '../store/vorlagenStore';

function formatDatumDe(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE');
}

function formatEur(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

/** Kontext für alle System- und Benutzer-Textvorlagen (Platzhalter in eckigen Klammern). */
export function buildTextvorlagePlatzhalterMap(params: {
  fall: Fall;
  mandant: Mandant | null;
  empfaenger: Partei | null;
  kanzlei: KanzleiDaten;
  /** Bereits formatiert, z. B. „27.04.2026“ */
  fristStr: string;
}): Record<string, string> {
  const { fall, mandant, empfaenger, kanzlei, fristStr } = params;
  const az = fall.aktenzeichen;
  const mName = mandant ? `${mandant.vorname} ${mandant.nachname}` : '[MANDANT]';
  const empfName = empfaenger?.name ?? '[Empfänger]';
  const kennzeichen = fall.verkehrsrecht?.fahrzeug?.kennzeichen ?? '[Kennzeichen]';
  const fv = fall.verkehrsrecht?.fahrzeug;
  const fahrzeugSuffix =
    fv?.typ && fv.baujahr != null ? ` — ${fv.typ} (${fv.baujahr})` : '';

  const kontoInfo = kanzlei.iban
    ? `${kanzlei.bankName ? `${kanzlei.bankName}\n` : ''}IBAN: ${kanzlei.iban}\nBIC: ${kanzlei.bic}`
    : '[Kontoverbindung — bitte in Einstellungen → Bankverbindung hinterlegen]';

  const schadenshoehe = fall.verkehrsrecht?.schadenshoehe
    ? formatEur(fall.verkehrsrecht.schadenshoehe)
    : null;
  const reparaturkosten = fall.verkehrsrecht?.reparaturkosten
    ? formatEur(fall.verkehrsrecht.reparaturkosten)
    : null;
  const nutzungsausfall = fall.verkehrsrecht?.nutzungsausfall
    ? formatEur(fall.verkehrsrecht.nutzungsausfall)
    : null;
  const lohnrueckstand = fall.arbeitsrecht?.lohnrueckstand
    ? formatEur(fall.arbeitsrecht.lohnrueckstand)
    : null;

  const arForderung = (() => {
    if (!fall.arbeitsrecht) return '[Forderung]';
    switch (fall.arbeitsrecht.falltyp) {
      case 'kuendigung':
        return 'die ausgesprochene Kündigung zurückzunehmen und das Arbeitsverhältnis fortzusetzen';
      case 'abmahnung':
        return 'die Abmahnung unverzüglich aus der Personalakte zu entfernen';
      case 'lohn':
        return lohnrueckstand
          ? `die ausstehenden Lohnzahlungen in Höhe von ${lohnrueckstand} zu begleichen`
          : 'die ausstehenden Lohnzahlungen zu begleichen';
      case 'aufhebung':
        return 'einen fairen Aufhebungsvertrag zu verhandeln und abzuschließen';
      case 'mobbing':
        return 'die Belästigungen und Benachteiligungen unverzüglich zu unterlassen';
      case 'versetzung':
        return 'die rechtswidrige Versetzung rückgängig zu machen';
      default:
        return '[Forderung]';
    }
  })();

  const kuendigungsdatum = fall.arbeitsrecht?.kuendigungsdatum
    ? formatDatumDe(fall.arbeitsrecht.kuendigungsdatum)
    : '[Datum der Kündigung]';

  const arSachverhalt =
    fall.arbeitsrecht?.falltyp === 'kuendigung'
      ? `Mit Schreiben vom ${kuendigungsdatum} haben Sie meinem Mandanten die Kündigung ausgesprochen. Diese Kündigung ist aus folgenden Gründen rechtswidrig:\n\n[Begründung — z.B. fehlende Sozialauswahl, kein wichtiger Grund, Verstoß gegen § 1 KSchG]`
      : '[Sachverhalt — Bitte ausfüllen]';

  const schadenshoeheZeile = schadenshoehe ? `Vorläufige Schadenshöhe: ${schadenshoehe}\n` : '';
  const gutachtenSchadensSatz = schadenshoehe
    ? `Der gutachterlich festgestellte Schaden beläuft sich auf ${schadenshoehe}.\n`
    : '';
  const reparaturZeile = reparaturkosten ? `Rechnungsbetrag: ${reparaturkosten}\n` : '';
  const nutzungsausfallBlock = nutzungsausfall
    ? `Geltend gemachter Nutzungsausfall: ${nutzungsausfall}\n\n`
    : 'Nutzungsausfalltabelle: [Fahrzeuggruppe] × [Anzahl Tage] = [Betrag] €\n\n';
  const stellungnahmeSchadensSatz = schadenshoehe
    ? `Der vollständige, uns zustehende Betrag beläuft sich auf ${schadenshoehe}.\n`
    : '';
  const kuendigungDatumZeile = fall.arbeitsrecht?.kuendigungsdatum
    ? `Kündigungsdatum: ${formatDatumDe(fall.arbeitsrecht.kuendigungsdatum)}\n`
    : '';

  const betragMahnung = schadenshoehe ?? lohnrueckstand ?? '[Betrag]';
  const streitwert = schadenshoehe ?? lohnrueckstand ?? '[Streitwert]';

  const today = new Date().toLocaleDateString('de-DE');

  return {
    '[MANDANT]': mName,
    '[AZ]': az,
    '[EMPFAENGER]': empfName,
    '[KENNZEICHEN]': kennzeichen,
    '[SCHADENSNUMMER]': empfaenger?.schadensnummer ?? '[Schadensnummer]',
    '[KANZ_NAME]': kanzlei.kanzleiName || kanzlei.anwaltName,
    '[DATUM]': today,
    '[FRIST]': fristStr,
    '[KONTO_INFO]': kontoInfo,
    '[FAHRZEUG_SUFFIX]': fahrzeugSuffix,
    '[SCHADENSHOEHE_ZEILE]': schadenshoeheZeile,
    '[GUTACHTEN_SCHADENS_SATZ]': gutachtenSchadensSatz,
    '[REPARATUR_ZEILE]': reparaturZeile,
    '[NUTZUNGSAUSFALL_BLOCK]': nutzungsausfallBlock,
    '[STELLUNGNAHME_SCHADENS_SATZ]': stellungnahmeSchadensSatz,
    '[AR_SACHVERHALT]': arSachverhalt,
    '[AR_FORDERUNG]': arForderung,
    '[KUENDIGUNGSDATUM]': kuendigungsdatum,
    '[RSV_NUMMER]': mandant?.rsvNummer ?? '[Nummer]',
    '[AR_FALLTYP]': fall.arbeitsrecht?.falltyp ?? '[Falltyp]',
    '[AR_KUENDIGUNGSDATUM_ZEILE]': kuendigungDatumZeile,
    '[BETRAG_MAHNUNG]': betragMahnung,
    '[STREITWERT]': streitwert,
  };
}

/**
 * Alle Schlüssel aus `buildTextvorlagePlatzhalterMap` — für UI (Kontextmenü, Hilfe).
 * Bei neuen Platzhaltern im Map zuerst hier und in `buildTextvorlagePlatzhalterMap` ergänzen.
 */
export type TextvorlagePlatzhalterKatalogEintrag = { token: string; beschreibung: string };

export const TEXTVORLAGE_PLATZHALTER_KATALOG: readonly TextvorlagePlatzhalterKatalogEintrag[] = [
  { token: '[MANDANT]', beschreibung: 'Mandant / Versicherungsnehmer (Name)' },
  { token: '[EMPFAENGER]', beschreibung: 'Empfänger / Gegenseite (Name)' },
  { token: '[AZ]', beschreibung: 'Aktenzeichen' },
  { token: '[KENNZEICHEN]', beschreibung: 'Amtliches Kennzeichen (Verkehrsrecht)' },
  { token: '[FAHRZEUG_SUFFIX]', beschreibung: 'Fahrzeugtyp und Baujahr (falls hinterlegt)' },
  { token: '[SCHADENSNUMMER]', beschreibung: 'Schadennummer der Versicherung' },
  { token: '[KANZ_NAME]', beschreibung: 'Kanzlei-Name' },
  { token: '[DATUM]', beschreibung: 'Heutiges Datum (deutsch)' },
  { token: '[FRIST]', beschreibung: 'Antwort-/Zahlungsfrist (aus Schreiben)' },
  { token: '[KONTO_INFO]', beschreibung: 'Bankverbindung der Kanzlei' },
  { token: '[SCHADENSHOEHE_ZEILE]', beschreibung: 'Zeile „Vorläufige Schadenshöhe …“ (VR)' },
  { token: '[GUTACHTEN_SCHADENS_SATZ]', beschreibung: 'Satz zum Gutachten-Schaden (VR)' },
  { token: '[REPARATUR_ZEILE]', beschreibung: 'Zeile Reparaturkosten (VR)' },
  { token: '[NUTZUNGSAUSFALL_BLOCK]', beschreibung: 'Block Nutzungsausfall / Tabelle (VR)' },
  { token: '[STELLUNGNAHME_SCHADENS_SATZ]', beschreibung: 'Satz Schadenshöhe Stellungnahme (VR)' },
  { token: '[AR_SACHVERHALT]', beschreibung: 'Arbeitsrecht: Sachverhaltstext' },
  { token: '[AR_FORDERUNG]', beschreibung: 'Arbeitsrecht: konkrete Forderung' },
  { token: '[KUENDIGUNGSDATUM]', beschreibung: 'Datum der Kündigung (AR)' },
  { token: '[RSV_NUMMER]', beschreibung: 'Rechtsschutz-Versicherungsnummer' },
  { token: '[AR_FALLTYP]', beschreibung: 'Arbeitsrecht-Falltyp' },
  { token: '[AR_KUENDIGUNGSDATUM_ZEILE]', beschreibung: 'Zeile Kündigungsdatum (AR)' },
  { token: '[BETRAG_MAHNUNG]', beschreibung: 'Betrag für Mahnung / Forderung' },
  { token: '[STREITWERT]', beschreibung: 'Streitwert (z. B. Klage)' },
];

export function ersetzeTextvorlagePlatzhalter(
  text: string,
  map: Record<string, string>,
): string {
  let out = text;
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    out = out.split(key).join(map[key] ?? '');
  }
  return out;
}

/** Reihenfolge: zuerst zugewiesene Bausteine (laut Vorlage), dann zusätzlich ausgewählte aus dem Pool */
export function aktiveBausteinReihenfolge(zugewieseneIds: string[], aktiveIds: string[]): string[] {
  const set = new Set(aktiveIds);
  const fromZu = zugewieseneIds.filter((id) => set.has(id));
  const extra = aktiveIds.filter((id) => !zugewieseneIds.includes(id));
  return [...fromZu, ...extra];
}

/** Brieftext = Vorlagen-Grundtext + gewählte Textbausteine (Platzhalter ersetzt) */
function composeInhaltMitBausteinen(
  basisPlain: string,
  aktivOrder: string[],
  textBausteine: Textbaustein[],
  platzhalterMap: Record<string, string>,
): string {
  const byId = new Map(textBausteine.map((b) => [b.id, b]));
  const parts: string[] = [basisPlain.trim()];
  for (const id of aktivOrder) {
    const b = byId.get(id);
    if (!b) continue;
    const t = ersetzeTextvorlagePlatzhalter(b.inhalt, platzhalterMap).trim();
    if (t) parts.push(t);
  }
  return parts.join('\n\n');
}

/** In Textvorlagen: markiert die Position, an der ein Textbaustein eingefügt wird, z. B. `[BAUSTEIN:sys-tb-bitte-az]`. */
export function hatBausteinPlatzhalter(text: string): boolean {
  return /\[BAUSTEIN:[^\]]+\]/.test(text);
}

/** Alle Baustein-IDs in Dokumentreihenfolge (ohne Duplikate). */
export function findBausteinPlatzhalterIds(text: string): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  let m: RegExpExecArray | null;
  const re = /\[BAUSTEIN:([^\]]+)\]/g;
  while ((m = re.exec(text)) !== null) {
    const id = m[1].trim();
    if (id && !seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  return order;
}

/** Ersetzt jeden `[BAUSTEIN:id]` durch den Baustein (Platzhalter ersetzt) oder leeren String, wenn `id` nicht aktiv. */
function applyBausteinPlatzhalter(
  text: string,
  aktiveIds: Set<string>,
  textBausteine: Textbaustein[],
  platzhalterMap: Record<string, string>,
): string {
  const byId = new Map(textBausteine.map((b) => [b.id, b]));
  return text.replace(/\[BAUSTEIN:([^\]]+)\]/g, (_match, raw: string) => {
    const id = String(raw).trim();
    if (!aktiveIds.has(id)) return '';
    const b = byId.get(id);
    if (!b) return '';
    return ersetzeTextvorlagePlatzhalter(b.inhalt, platzhalterMap).trim();
  });
}

/**
 * Brieftext-Komposition: entweder Platzhalter `[BAUSTEIN:id]` in der Vorlage — oder Legacy (Bausteine ans Ende anhängen).
 */
export function composeBriefInhaltMitBausteinen(params: {
  basisPlain: string;
  aktivOrder: string[];
  zugewieseneIds: string[];
  textBausteine: Textbaustein[];
  platzhalterMap: Record<string, string>;
}): string {
  const { basisPlain, aktivOrder, zugewieseneIds, textBausteine, platzhalterMap } = params;
  if (hatBausteinPlatzhalter(basisPlain)) {
    return applyBausteinPlatzhalter(basisPlain, new Set(aktivOrder), textBausteine, platzhalterMap);
  }
  const order = aktiveBausteinReihenfolge(zugewieseneIds, aktivOrder);
  return composeInhaltMitBausteinen(basisPlain, order, textBausteine, platzhalterMap);
}
