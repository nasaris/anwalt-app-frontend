/**
 * Rechnung als PDF (DIN 5008 Form B) — RVG-Rechnung
 * Verwendet jsPDF (wie briefDruck.ts)
 */
import jsPDF from 'jspdf';
import type { KanzleiDaten } from '../store/kanzleiStore';
import type { Abrechnung, Fall, Mandant } from '../types';
import { formatEuro } from './rvgBerechnung';
import { DIN5008 } from './briefDruck';

function kanzleiKurzname(name: string): string {
  return name.replace(/^Rechtsanwaltskanzlei\s+/i, '').trim() || name;
}

function datum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function druckeRechnungAlsPdf(
  abrechnung: Abrechnung,
  fall: Fall,
  mandant: Mandant,
  kanzlei: KanzleiDaten,
): void {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
  const { pageW, pageH, marginLeft: mL, marginRight: mR } = DIN5008;
  const rX = pageW - mR;
  const contentW = pageW - mL - mR;

  // ── Logo + Kanzleikopf ────────────────────────────────
  const kurzName = kanzleiKurzname(kanzlei.kanzleiName);
  const targetLogoH = 20;
  let logoW = targetLogoH;
  let logoH = targetLogoH;
  if (kanzlei.unterschriftBild) {
    try {
      const props = doc.getImageProperties(kanzlei.unterschriftBild);
      logoW = (targetLogoH * props.width) / props.height;
    } catch {/* ignore */}
  }
  const logoY = 10;
  void logoH; // nicht verwendet — nur für Seitenverhältnis-Berechnung
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const labelRA = 'Rechtsanwaltskanzlei';
  const labelRAw = doc.getTextWidth(labelRA);
  doc.setFontSize(20);
  const kurzW = doc.getTextWidth(kurzName);
  const textBlockW = Math.max(labelRAw, kurzW);
  const gap = 5;
  const totalW = logoW + gap + textBlockW;
  const logoX = (pageW - totalW) / 2;
  const textX = logoX + logoW + gap;
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(labelRA, textX, logoY + 8);
  doc.setFontSize(20);
  doc.text(kurzName, textX, logoY + 17);

  // ── Absenderzeile ─────────────────────────────────────
  const absY = DIN5008.absenderFirstLineMm;
  const absText = `${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(absText, mL, absY);
  doc.setLineWidth(0.15);
  doc.setDrawColor(180);
  doc.line(mL, absY + 1.5, rX, absY + 1.5);

  // ── Empfänger (Mandant) ───────────────────────────────
  let yL: number = DIN5008.empfaengerFirstLineMm;
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`${mandant.vorname} ${mandant.nachname}`, mL, yL);
  yL += 5.5;
  doc.setFont('helvetica', 'normal');
  if (mandant.adresse?.strasse) { doc.text(mandant.adresse.strasse, mL, yL); yL += 5; }
  if (mandant.adresse?.plz && mandant.adresse?.ort) {
    doc.text(`${mandant.adresse.plz} ${mandant.adresse.ort}`, mL, yL); yL += 5;
  }

  // ── Kanzlei-Sidebar rechts ────────────────────────────
  let yR: number = DIN5008.empfaengerFirstLineMm;
  const anwaltNurName = kanzlei.anwaltName.replace(/^Rechtsanw[aä]lt(?:in)?\s+/i, '').trim();
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text(anwaltNurName, rX, yR, { align: 'right' });
  yR += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(kanzlei.anwaltTitel, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(kanzlei.strasse, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(kanzlei.plzOrt, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(`Tel.: ${kanzlei.telefon}`, rX, yR, { align: 'right' }); yR += 3.5;
  doc.text(kanzlei.email, rX, yR, { align: 'right' });
  doc.setTextColor(0);

  // ── Bezugszeichen ─────────────────────────────────────
  yL = Math.max(yL + 8, 97);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(datum(abrechnung.datum), rX, yL, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Az.: ${fall.aktenzeichen}`, rX, yL + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');

  // Betreff
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Kostenrechnung', mL, yL);
  yL += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Rechnungsnummer: ${abrechnung.rechnungsNummer}`, mL, yL); yL += 5;
  doc.text(`Aktenzeichen: ${fall.aktenzeichen}`, mL, yL); yL += 5;
  doc.text(`Mandant: ${mandant.vorname} ${mandant.nachname}`, mL, yL); yL += 5;
  doc.text(
    `Gegenstandswert: ${formatEuro(abrechnung.gegenstandswert)}`,
    mL,
    yL,
  );
  yL += 10;

  doc.setTextColor(0);

  // ── Gebührenpositionen ────────────────────────────────
  const colVv = mL;
  const colBez = mL + 22;
  const colFaktor = rX - 48;
  const colEinfach = rX - 30;
  const colBetrag = rX;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 240, 240);
  doc.rect(mL, yL - 4, contentW, 6, 'F');
  doc.text('VV-Nr.', colVv, yL);
  doc.text('Bezeichnung', colBez, yL);
  doc.text('Faktor', colFaktor, yL, { align: 'right' });
  doc.text('1,0-Geb.', colEinfach, yL, { align: 'right' });
  doc.text('Betrag', colBetrag, yL, { align: 'right' });
  yL += 2;
  doc.setLineWidth(0.3);
  doc.setDrawColor(180);
  doc.line(mL, yL, rX, yL);
  yL += 5;

  doc.setFont('helvetica', 'normal');
  for (const pos of abrechnung.positionen) {
    if (yL > pageH - 60) {
      doc.addPage();
      yL = DIN5008.folgeseitenStartMm as number;
    }
    doc.text(pos.vvNummer, colVv, yL);
    const bezLines = doc.splitTextToSize(pos.bezeichnung, colFaktor - colBez - 4);
    doc.text(bezLines, colBez, yL);
    doc.text(pos.faktor.toFixed(1).replace('.', ','), colFaktor, yL, { align: 'right' });
    doc.text(formatEuro(pos.gebuehrEinfach), colEinfach, yL, { align: 'right' });
    doc.text(formatEuro(pos.betrag), colBetrag, yL, { align: 'right' });
    yL += Math.max(bezLines.length * 5, 5) + 2;
  }

  // VV 7002 Auslagen
  doc.text('7002', colVv, yL);
  doc.text('Pauschale Post/Telekommunikation Nr. 7002 VV RVG', colBez, yL);
  doc.text(formatEuro(abrechnung.auslagenPauschale), colBetrag, yL, { align: 'right' });
  yL += 7;

  // Anrechnung
  if ((abrechnung.anrechnung ?? 0) > 0) {
    doc.setTextColor(180, 0, 0);
    doc.text('./. Anrechnung Geschäftsgebühr § 15a RVG', colBez, yL);
    doc.text(`− ${formatEuro(abrechnung.anrechnung!)}`, colBetrag, yL, { align: 'right' });
    doc.setTextColor(0);
    yL += 7;
  }

  // Trennlinie
  doc.setLineWidth(0.3);
  doc.setDrawColor(160);
  doc.line(mL, yL, rX, yL);
  yL += 5;

  // Zwischensumme
  doc.setFont('helvetica', 'bold');
  doc.text('Zwischensumme (netto)', colBez, yL);
  doc.text(formatEuro(abrechnung.zwischensumme), colBetrag, yL, { align: 'right' });
  yL += 6;

  // MwSt
  doc.setFont('helvetica', 'normal');
  doc.text(
    `19 % Umsatzsteuer (§ 19 Nr. 14 VV RVG)`,
    colBez,
    yL,
  );
  doc.text(formatEuro(abrechnung.mwstBetrag), colBetrag, yL, { align: 'right' });
  yL += 2;
  doc.setLineWidth(0.5);
  doc.setDrawColor(0);
  doc.line(colBez, yL, rX, yL);
  yL += 6;

  // Gesamtbetrag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Gesamtbetrag', colBez, yL);
  doc.text(formatEuro(abrechnung.gesamtBetrag), colBetrag, yL, { align: 'right' });
  yL += 12;

  // ── Zahlungshinweis ───────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(
    'Bitte überweisen Sie den Gesamtbetrag unter Angabe der Rechnungsnummer innerhalb von 14 Tagen.',
    mL,
    yL,
    { maxWidth: contentW },
  );
  yL += 8;
  if (kanzlei.iban) {
    doc.text(`IBAN: ${kanzlei.iban}`, mL, yL);
    yL += 5;
  }
  if (kanzlei.bic) {
    doc.text(`BIC: ${kanzlei.bic}  · ${kanzlei.bankName ?? ''}`, mL, yL);
  }

  // ── Fußzeile ──────────────────────────────────────────
  for (let p = 1; p <= doc.getNumberOfPages(); p++) {
    doc.setPage(p);
    const fY = pageH - 13;
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    doc.line(mL, fY - 2, rX, fY - 2);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90);
    doc.text(`${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`, mL, fY);
    const footerParts: string[] = [];
    if (kanzlei.iban) footerParts.push(`IBAN: ${kanzlei.iban}`);
    if (kanzlei.steuernummer) footerParts.push(`StNr.: ${kanzlei.steuernummer}`);
    if (footerParts.length) doc.text(footerParts.join(' · '), rX, fY, { align: 'right' });
  }

  const safeName = abrechnung.rechnungsNummer.replace(/[/\\:*?"<>|]/g, '-');
  doc.save(`Rechnung_${safeName}.pdf`);
}
