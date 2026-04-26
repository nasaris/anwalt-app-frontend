/**
 * Schadenskalkulation als PDF — Anlage zur Schadensanzeige an Versicherung
 *
 * Layout nach Referenzdokument:
 *  1–N. Nummerierte Schadenspositionen
 *  → "Beziffert werden daher" (Gesamtschaden, unterstrichen)
 *  3.  Anwaltskosten-Aufschlüsselung (GW + VV 2300 + VV 7002 + Netto + USt + Brutto)
 *  → Zahlungsaufforderung
 *  → Vorbehaltssatz (optional)
 *  → Erledigungshinweis (optional)
 */
import jsPDF from 'jspdf';
import type { KanzleiDaten } from '../store/kanzleiStore';
import type { Schadenskalkulation, Fall, Mandant, Partei } from '../types';
import { formatEuro } from './rvgBerechnung';
import { DIN5008 } from './briefDruck';

const MWST_LABEL = '19 % USt.';

function datum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/** Schreibt eine Zeile mit linksbündigem Text und rechtsbündigem Betrag */
function posZeile(
  doc: jsPDF,
  colL: number,
  colR: number,
  maxW: number,
  y: number,
  bezeichnung: string,
  betrag: string,
  bold = false,
  underlineBetrag = false,
): number {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  const lines = doc.splitTextToSize(bezeichnung, maxW - 40);
  doc.text(lines, colL, y);
  if (bold) doc.setFont('helvetica', 'bold');
  doc.text(betrag, colR, y, { align: 'right' });
  if (underlineBetrag) {
    const bW = doc.getTextWidth(betrag);
    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.line(colR - bW, y + 1, colR, y + 1);
  }
  return y + Math.max(lines.length * 5, 5) + 3;
}

export function druckeSchadenskalkulationAlsPdf(
  kalkulation: Schadenskalkulation,
  fall: Fall,
  mandant: Mandant,
  kanzlei: KanzleiDaten,
  versicherung?: Partei,
): void {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
  const { pageW, marginLeft: mL, marginRight: mR } = DIN5008;
  const rX = pageW - mR;
  const contentW = pageW - mL - mR;

  // ── Briefkopf ──────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  const absText = `${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`;
  doc.text(absText, mL, DIN5008.absenderFirstLineMm);
  doc.setLineWidth(0.15);
  doc.setDrawColor(180);
  doc.line(mL, DIN5008.absenderFirstLineMm + 1.5, rX, DIN5008.absenderFirstLineMm + 1.5);

  // Kanzlei-Sidebar rechts
  let yR: number = DIN5008.empfaengerFirstLineMm;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(kanzlei.anwaltName.replace(/^Rechtsanw[aä]lt(?:in)?\s+/i, '').trim(), rX, yR, { align: 'right' });
  yR += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80);
  doc.text(kanzlei.anwaltTitel, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(kanzlei.strasse, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(kanzlei.plzOrt, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(`Tel.: ${kanzlei.telefon}`, rX, yR, { align: 'right' });

  // Empfänger links (Versicherung oder Mandant)
  let yL: number = DIN5008.empfaengerFirstLineMm;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  if (versicherung) {
    doc.text(versicherung.name, mL, yL); yL += 5.5;
    doc.setFont('helvetica', 'normal');
    if (versicherung.adresse?.strasse) { doc.text(versicherung.adresse.strasse, mL, yL); yL += 5; }
    if (versicherung.adresse?.plz && versicherung.adresse.ort) {
      doc.text(`${versicherung.adresse.plz} ${versicherung.adresse.ort}`, mL, yL); yL += 5;
    }
    if (versicherung.schadensnummer) {
      yL += 2;
      doc.setFont('helvetica', 'bold');
      doc.text(`Schadennummer: ${versicherung.schadensnummer}`, mL, yL); yL += 5;
      doc.setFont('helvetica', 'normal');
    }
  } else {
    doc.text(`${mandant.vorname} ${mandant.nachname}`, mL, yL); yL += 5.5;
    doc.setFont('helvetica', 'normal');
    if (mandant.adresse?.strasse) { doc.text(mandant.adresse.strasse, mL, yL); yL += 5; }
    if (mandant.adresse?.plz && mandant.adresse.ort) {
      doc.text(`${mandant.adresse.plz} ${mandant.adresse.ort}`, mL, yL); yL += 5;
    }
  }

  // ── Datum + Aktenzeichen rechts ────────────────────────────
  yL = Math.max(yL + 8, 97);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(datum(kalkulation.datum), rX, yL, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Az.: ${fall.aktenzeichen}`, rX, yL + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // ── Betreff ────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Schadensaufstellung', mL, yL);
  yL += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const vr = fall.verkehrsrecht;
  if (vr?.fahrzeug?.kennzeichen) {
    doc.text(`Fahrzeug: ${vr.fahrzeug.kennzeichen}${vr.fahrzeug.typ ? ` (${vr.fahrzeug.typ})` : ''}`, mL, yL); yL += 5;
  }
  doc.text(`Unser Mandant: ${mandant.vorname} ${mandant.nachname}`, mL, yL); yL += 5;
  doc.text(
    `Abrechnungsart: ${vr?.abrechnungsart === 'fiktiv' ? 'Fiktive Abrechnung' : 'Konkrete Abrechnung'}`,
    mL, yL,
  );
  yL += 10;

  // ── Intro ──────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const introLines = doc.splitTextToSize(
    'Die Schadensersatzansprüche meiner Mandantschaft beziffere ich daher wie folgt:',
    contentW,
  );
  doc.text(introLines, mL, yL);
  // Unterstrich unter dem Intro-Satz
  doc.setLineWidth(0.4);
  doc.setDrawColor(0);
  const introH = introLines.length * 5;
  doc.line(mL, yL + introH - 1, rX, yL + introH - 1);
  yL += introH + 7;

  // ── Schadenspositionen (nummeriert) ────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const colPos = mL + 6;   // eingerückt für Nummerierung
  const numX  = mL;
  const maxBezW = contentW - 50;

  const aktivPositionen = kalkulation.positionen.filter((p) => p.betrag > 0);
  aktivPositionen.forEach((pos, idx) => {
    // Nummer
    doc.setFont('helvetica', 'normal');
    doc.text(`${idx + 1}.`, numX, yL);
    // Bezeichnung + Betrag
    const lines = doc.splitTextToSize(pos.bezeichnung, maxBezW);
    doc.text(lines, colPos, yL);
    doc.text(formatEuro(pos.betrag) + ' EUR', rX, yL, { align: 'right' });
    yL += Math.max(lines.length * 5, 5) + 5;
  });

  // ── "Beziffert werden daher" ───────────────────────────────
  yL += 3;
  doc.setFont('helvetica', 'bold');
  doc.text('Beziffert werden daher', mL, yL);
  const bezSum = formatEuro(kalkulation.schadensumme) + ' EUR';
  doc.text(bezSum, rX, yL, { align: 'right' });
  // Doppelt unterstreichen (wie im Referenzdokument)
  const bW = doc.getTextWidth(bezSum);
  doc.setLineWidth(0.4);
  doc.line(rX - bW, yL + 1.2, rX, yL + 1.2);
  doc.setLineWidth(0.2);
  doc.line(rX - bW, yL + 2.4, rX, yL + 2.4);
  yL += 14;

  // ── Anwaltskosten (Nr. 3) ──────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  // Einleitung
  const anwIntroText =
    `Die durch meine Inanspruchnahme entstandenen Rechtsanwaltskosten mit MwSt. beziffere ich wie folgt:\n` +
    `Gegenstandswert: ${formatEuro(kalkulation.schadensumme)} EUR.`;
  const anwIntroLines = doc.splitTextToSize(anwIntroText, contentW);
  doc.text(anwIntroLines, mL, yL);
  yL += anwIntroLines.length * 5 + 5;

  // Kostenaufstellung in zwei Spalten
  const colLabel = mL + 4;
  const colBetrag = rX;
  const anwColW = contentW - 10;

  const netto = kalkulation.anwaltsGebuehrNetto ?? 0;
  const auslagen = kalkulation.auslagenPauschale ?? 0;
  const summeNetto = netto + auslagen;
  const mwst = kalkulation.anwaltsGebuehrMwst ?? 0;
  const brutto = kalkulation.anwaltsgebuehr;

  // Geschäftsgebühr
  doc.setFont('helvetica', 'normal');
  doc.text('Geschäftsgebühr gem. Nr. 2300 VV RVG', colLabel, yL);
  doc.text(`${formatEuro(netto)} €`, colBetrag, yL, { align: 'right' });
  yL += 5.5;

  // Auslagenpauschale
  doc.text('Auslagenpauschale gem. Nr. 7002 VV RVG', colLabel, yL);
  doc.text(`${formatEuro(auslagen)} €`, colBetrag, yL, { align: 'right' });
  yL += 5.5;

  // Trennlinie vor Netto
  doc.setLineWidth(0.2);
  doc.setDrawColor(160);
  doc.line(colBetrag - 35, yL - 1, colBetrag, yL - 1);

  // Summe netto
  doc.text('Summe netto', colLabel, yL);
  doc.text(`${formatEuro(summeNetto)} €`, colBetrag, yL, { align: 'right' });
  yL += 5.5;

  // 19% USt.
  doc.text(MWST_LABEL, colLabel, yL);
  doc.text(`${formatEuro(mwst)} €`, colBetrag, yL, { align: 'right' });
  yL += 5.5;

  // Gesamtsumme brutto
  doc.setFont('helvetica', 'bold');
  doc.text('Gesamtsumme brutto', colLabel, yL);
  doc.text(`${formatEuro(brutto)} €`, colBetrag, yL, { align: 'right' });
  // Unterstrich
  const bruttoW = doc.getTextWidth(`${formatEuro(brutto)} €`);
  doc.setLineWidth(0.4);
  doc.setDrawColor(0);
  doc.line(colBetrag - bruttoW, yL + 1.2, colBetrag, yL + 1.2);
  yL += 14;

  // ── Zahlungsaufforderung ───────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Ich darf Sie bitten, den Gesamtbetrag von', mL, yL);
  yL += 6;

  // Gesamtbetrag prominent
  doc.setFontSize(12);
  doc.text(`${formatEuro(kalkulation.gesamtforderung)} EUR`, rX, yL, { align: 'right' });
  doc.setLineWidth(0.5);
  const gfW = doc.getTextWidth(`${formatEuro(kalkulation.gesamtforderung)} EUR`);
  doc.line(rX - gfW, yL + 1.3, rX, yL + 1.3);
  yL += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('auf mein, in der Fußzeile aufgeführtes Konto zu überweisen.', mL, yL);
  yL += 10;

  // ── Vorbehalt ─────────────────────────────────────────────
  if (kalkulation.mitVorbehalt !== false) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40);
    const vorbehaltText =
      'Die Geltendmachung weiterer Schadenspositionen, etwa die konkreten Reparaturkosten, ' +
      'der Anfall einer Mehrwertsteuer bei der Reparatur und ein Nutzungsausfall bleiben ' +
      'ausdrücklich vorbehalten.';
    const vLines = doc.splitTextToSize(vorbehaltText, contentW);
    doc.text(vLines, mL, yL);
    yL += vLines.length * 4.5 + 6;
  }

  // ── Erledigungshinweis ─────────────────────────────────────
  if (kalkulation.erledigungDatum) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0);
    const fristDatum = datum(kalkulation.erledigungDatum);
    // "Für die Erledigung habe ich mir den [DATUM] vorgemerkt."
    doc.text('Für die Erledigung habe ich mir den ', mL, yL);
    const prefixW = doc.getTextWidth('Für die Erledigung habe ich mir den ');
    doc.setFont('helvetica', 'bold');
    doc.text(fristDatum, mL + prefixW, yL);
    const dateW = doc.getTextWidth(fristDatum);
    // Unterstreichung des Datums
    doc.setLineWidth(0.3);
    doc.line(mL + prefixW, yL + 1, mL + prefixW + dateW, yL + 1);
    doc.setFont('helvetica', 'normal');
    doc.text(' vorgemerkt.', mL + prefixW + dateW, yL);
    yL += 10;
  }

  // ── Notizen ────────────────────────────────────────────────
  if (kalkulation.notizen) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(80);
    const nLines = doc.splitTextToSize(kalkulation.notizen, contentW);
    doc.text(nLines, mL, yL);
  }

  // ── Fußzeile ───────────────────────────────────────────────
  for (let p = 1; p <= doc.getNumberOfPages(); p++) {
    doc.setPage(p);
    const pageH = 297;
    const fY = pageH - 13;
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    doc.line(mL, fY - 2, rX, fY - 2);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90);
    doc.text(`${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`, mL, fY);
    const parts: string[] = [];
    if (kanzlei.iban) parts.push(`IBAN: ${kanzlei.iban}`);
    if (kanzlei.steuernummer) parts.push(`StNr.: ${kanzlei.steuernummer}`);
    if (parts.length) doc.text(parts.join(' · '), rX, fY, { align: 'right' });
  }

  doc.save(`Schadenskalkulation_${fall.aktenzeichen.replace(/[/\\:*?"<>|]/g, '-')}.pdf`);
}
