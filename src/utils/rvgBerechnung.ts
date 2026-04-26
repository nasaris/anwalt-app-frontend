/**
 * RVG-Gebührenberechnung nach Rechtsanwaltsvergütungsgesetz
 *
 * Quellen:
 *  - Anlage 1 VV RVG (Vergütungsverzeichnis)
 *  - Anlage 2 RVG (Tabelle der 1,0-Gebühr nach § 13 Abs. 1 RVG)
 *    Stand: BGBl. 2025 I Nr. 109
 */

import type { AbrechnungsPosition, RvgTabelleEintrag } from '../types';
import { STANDARD_TABELLE_2025 } from '../store/rvgTabelleStore';

/**
 * Ermittelt die 1,0-Gebühr (einfache Gebühr) für den gegebenen Gegenstandswert
 * gemäß RVG Anlage 2 (§ 13 Abs. 1).
 *
 * @param tabelle  Optional: benutzerdefinierte Tabelle (z. B. neue Gesetzesversion).
 *                 Fällt auf STANDARD_TABELLE_2025 zurück, wenn nicht angegeben.
 *
 * Für Werte über 500.000 €: + 1.400 € je angefangene 500.000 €.
 */
export function getGebuehrEinfach(
  gegenstandswert: number,
  tabelle: RvgTabelleEintrag[] = STANDARD_TABELLE_2025,
): number {
  if (gegenstandswert <= 0) return 0;

  for (const { bis, gebuehr } of tabelle) {
    if (gegenstandswert <= bis) return gebuehr;
  }

  // Über letzter Tabellenstufe: lineare Fortsetzung + 1.400 € / 500.000 €
  const letzteGebuehr = tabelle[tabelle.length - 1]?.gebuehr ?? 3752;
  const letzterBis = tabelle[tabelle.length - 1]?.bis ?? 500000;
  const ueberschuss = gegenstandswert - letzterBis;
  const stufen = Math.ceil(ueberschuss / 500000);
  return letzteGebuehr + stufen * 1400;
}

/**
 * Rundet einen Gebührenbetrag kaufmännisch auf 2 Dezimalstellen.
 */
function runde(wert: number): number {
  return Math.round(wert * 100) / 100;
}

/**
 * Berechnet den Gebührenbetrag einer Position.
 * betrag = faktor × gebuehrEinfach (gerundet)
 */
export function berechnePosition(
  faktor: number,
  gebuehrEinfach: number,
): number {
  return runde(faktor * gebuehrEinfach);
}

// ── VV-Definitionen ───────────────────────────────────────

export interface VvDefinition {
  vvNummer: string;
  bezeichnung: string;
  /** Standard-Faktor */
  standardFaktor: number;
  /** Minimaler Faktor (wenn Rahmengebühr) */
  minFaktor?: number;
  /** Maximaler Faktor (wenn Rahmengebühr) */
  maxFaktor?: number;
  /** Kurze Erläuterung */
  hinweis?: string;
}

export const VV_POSITIONEN: Record<string, VvDefinition> = {
  // ── Außergerichtlich ──────────────────────────
  '2300': {
    vvNummer: '2300',
    bezeichnung: 'Geschäftsgebühr Nr. 2300 VV RVG',
    standardFaktor: 1.3,
    minFaktor: 0.5,
    maxFaktor: 2.5,
    hinweis: 'Außergerichtliche Tätigkeit; Regelgebühr 1,3; bei umfangreicher Tätigkeit bis 2,5',
  },
  // ── 1. Instanz ────────────────────────────────
  '3100': {
    vvNummer: '3100',
    bezeichnung: 'Verfahrensgebühr Nr. 3100 VV RVG',
    standardFaktor: 1.3,
    hinweis: '1. Instanz (Zivilsachen)',
  },
  '3104': {
    vvNummer: '3104',
    bezeichnung: 'Terminsgebühr Nr. 3104 VV RVG',
    standardFaktor: 1.2,
    hinweis: 'Mündliche Verhandlung 1. Instanz',
  },
  // ── 2. Instanz (Berufung) ─────────────────────
  '3200': {
    vvNummer: '3200',
    bezeichnung: 'Verfahrensgebühr Nr. 3200 VV RVG',
    standardFaktor: 1.6,
    hinweis: 'Berufungsinstanz',
  },
  '3202': {
    vvNummer: '3202',
    bezeichnung: 'Terminsgebühr Nr. 3202 VV RVG',
    standardFaktor: 1.2,
    hinweis: 'Mündliche Verhandlung Berufungsinstanz',
  },
  // ── 3. Instanz (Revision) ─────────────────────
  '3206': {
    vvNummer: '3206',
    bezeichnung: 'Verfahrensgebühr Nr. 3206 VV RVG',
    standardFaktor: 1.6,
    hinweis: 'Revisionsinstanz (allgemein)',
  },
  '3208': {
    vvNummer: '3208',
    bezeichnung: 'Verfahrensgebühr Nr. 3208 VV RVG (BGH)',
    standardFaktor: 2.3,
    hinweis: 'Revision mit Zulassungserfordernis (BGH)',
  },
  '3210': {
    vvNummer: '3210',
    bezeichnung: 'Terminsgebühr Nr. 3210 VV RVG',
    standardFaktor: 1.5,
    hinweis: 'Mündliche Verhandlung Revisionsinstanz',
  },
  // ── Einigungsgebühren ─────────────────────────
  '1000': {
    vvNummer: '1000',
    bezeichnung: 'Einigungsgebühr Nr. 1000 VV RVG',
    standardFaktor: 1.5,
    hinweis: 'Außergerichtliche Einigung (Streitbeendigung)',
  },
  '1003': {
    vvNummer: '1003',
    bezeichnung: 'Einigungsgebühr Nr. 1003 VV RVG',
    standardFaktor: 1.0,
    hinweis: 'Einigung im laufenden Verfahren 1. Instanz',
  },
  '1004': {
    vvNummer: '1004',
    bezeichnung: 'Einigungsgebühr Nr. 1004 VV RVG',
    standardFaktor: 1.3,
    hinweis: 'Einigung im laufenden Berufungs-/Revisionsverfahren',
  },
};

// ── Mehrvertretungszuschlag (§ 7 RVG / VV 1008) ──────────

/**
 * Berechnet den effektiven Faktor unter Berücksichtigung des
 * Mehrvertretungszuschlags (VV 1008 RVG).
 *
 * Für jeden weiteren Auftraggeber (Mandanten) über den ersten hinaus
 * erhöht sich der Faktor um 0,3 — maximal bis 2,0.
 *
 * @param basisFaktor  Standardfaktor der VV-Nummer (z. B. 1,3 für VV 3100)
 * @param anzahlMandanten  Gesamtanzahl Auftraggeber (mind. 1)
 */
export function berechneFaktorMitMehrvertretung(
  basisFaktor: number,
  anzahlMandanten: number,
): number {
  const additional = Math.max(0, anzahlMandanten - 1) * 0.3;
  return runde(Math.min(basisFaktor + additional, 2.0));
}

/** VV 7002 Auslagenpauschale: 20 % der Gebühren, max. 20 € */
export function berechneAuslagenPauschale(gebuehrenSumme: number): number {
  return runde(Math.min(gebuehrenSumme * 0.2, 20));
}

/**
 * Erzeugt eine neue Gebührenposition.
 *
 * @param tabelle  Optionale Anlage-2-Tabelle (Rechtsstand)
 */
export function erstellePosition(
  vvNummer: string,
  gegenstandswert: number,
  faktorOverride?: number,
  tabelle?: RvgTabelleEintrag[],
): AbrechnungsPosition {
  const def = VV_POSITIONEN[vvNummer];
  if (!def) throw new Error(`Unbekannte VV-Nummer: ${vvNummer}`);

  const gebuehrEinfach = getGebuehrEinfach(gegenstandswert, tabelle);
  const faktor = faktorOverride ?? def.standardFaktor;
  const betrag = berechnePosition(faktor, gebuehrEinfach);

  return {
    id: crypto.randomUUID(),
    vvNummer,
    bezeichnung: def.bezeichnung,
    faktor,
    gebuehrEinfach,
    betrag,
  };
}

/** Berechnet die Anrechnung der Geschäftsgebühr auf die Verfahrensgebühr (§ 15a RVG).
 *  Hälftige Anrechnung der 2300-Gebühr, maximal 0,75 × 1,0-Gebühr.
 */
export function berechneAnrechnung(
  gebuehr2300Betrag: number,
  gebuehrEinfach: number,
): number {
  const haelfte = gebuehr2300Betrag / 2;
  const max = runde(0.75 * gebuehrEinfach);
  return runde(Math.min(haelfte, max));
}

/** Abschlussberechnung einer Rechnung */
export interface AbrechnungsSummen {
  gebuehrenSumme: number;
  auslagenPauschale: number;
  anrechnung: number;
  zwischensumme: number;
  mwstBetrag: number;
  gesamtBetrag: number;
}

export function berechneAbrechnungsSummen(
  positionen: AbrechnungsPosition[],
  anrechnung = 0,
  mwstSatz = 0.19,
): AbrechnungsSummen {
  const gebuehrenSumme = runde(positionen.reduce((s, p) => s + p.betrag, 0));
  const auslagenPauschale = berechneAuslagenPauschale(gebuehrenSumme);
  const zwischensumme = runde(gebuehrenSumme + auslagenPauschale - anrechnung);
  const mwstBetrag = runde(zwischensumme * mwstSatz);
  const gesamtBetrag = runde(zwischensumme + mwstBetrag);
  return { gebuehrenSumme, auslagenPauschale, anrechnung, zwischensumme, mwstBetrag, gesamtBetrag };
}

/** Formatiert einen Euro-Betrag als "1.234,56 €" */
export function formatEuro(betrag: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(betrag);
}

/** Standard-VV-Positionen je Rechtsgebiet und Phase */
export function getStandardPositionen(
  rechtsgebiet: string,
  phase: number,
): string[] {
  if (rechtsgebiet === 'verkehrsrecht' || rechtsgebiet === 'arbeitsrecht') {
    if (phase <= 1) return ['2300'];
    if (phase === 2) return ['2300', '3100'];
    if (phase >= 3) return ['3100', '3104'];
  }
  if (rechtsgebiet === 'zivilrecht') {
    if (phase <= 1) return ['2300'];
    if (phase >= 2) return ['3100', '3104'];
  }
  return ['2300'];
}
