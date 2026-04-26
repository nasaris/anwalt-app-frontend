import jsPDF from 'jspdf';
import type { KanzleiDaten } from '../store/kanzleiStore';
import type { Rechtsgebiet } from '../types';
import { htmlToPlainText } from './htmlToPlainText';

export interface BriefDaten {
  aktenzeichen: string;
  datum: string;
  empfaengerName: string;
  empfaengerZusatz?: string;
  empfaengerStrasse?: string;
  empfaengerPlzOrt?: string;
  empfaengerEmail?: string;
  betreff: string;
  inhalt: string;
  rechtsgebiet?: Rechtsgebiet;
  schadensnummerAnzeige?: string;
  kennzeichenFahrzeug?: string;
  mandantName?: string;
  streitwertFormatiert?: string;
  antwortFristBis?: string;
  oepnvLinien?: string;
  oepnvHaltestelle?: string;
  /** base64 data-URL des Briefkopf-Logos (PNG) */
  logoBild?: string;
}

/**
 * Geschäftsbrief A4 – linker Rand einheitlich 25 mm.
 */
export const DIN5008 = {
  pageW: 210,
  pageH: 297,
  marginLeft: 25,
  marginRight: 20,
  marginTop: 16,
  anschriftWidth: 85,
  /** Form B: Rücksende-/Absenderzeile */
  absenderFirstLineMm: 45,
  /** Form B: Empfängeradresse */
  empfaengerFirstLineMm: 50,
  bezugszeichenWidth: 75,
  /** Form B: Betreff/Bezugszeichenzeile (nach Anschriftfeld + 2 Leerzeilen) */
  betreffStartMm: 97,
  /** Untere Grenze des Inhaltsbereichs pro Seite (Fußzeile + Unterschrift = 45 mm) */
  inhaltEndeMm: 252,
  /** Y-Start des Inhalts auf Folgeseiten */
  folgeseitenStartMm: 25,
  /** Form B Falzmarken */
  falzOben: 105,
  lochmarke: 148.5,
  falzUnten: 210,
} as const;

function kanzleiKurzname(kanzleiName: string): string {
  const s = kanzleiName.replace(/^Rechtsanwaltskanzlei\s+/i, '').trim();
  return s || kanzleiName;
}

function boldLabel(doc: jsPDF, label: string, value: string, x: number, y: number): void {
  doc.setFont('helvetica', 'bold');
  const lw = doc.getTextWidth(label);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'normal');
  doc.text(value, x + lw, y);
}

function erstelleDoc(brief: BriefDaten, kanzlei: KanzleiDaten): { doc: jsPDF; dateiname: string } {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });

  const { pageW, pageH, marginLeft: mL, marginRight: mR } = DIN5008;
  const contentW = pageW - mL - mR;
  const rX = pageW - mR;
  const metaMaxW = contentW * 0.58;

  const datum = new Date(brief.datum).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const rg: Rechtsgebiet = brief.rechtsgebiet ?? 'verkehrsrecht';

  // ── Logo + Kanzleiname zentriert ─────────────────────────
  const targetLogoH = 20;
  let logoW = targetLogoH;
  let logoH = targetLogoH;
  if (brief.logoBild) {
    try {
      const imgProps = doc.getImageProperties(brief.logoBild);
      const ratio = imgProps.width / imgProps.height;
      logoW = targetLogoH * ratio;
      logoH = targetLogoH;
    } catch { /* Fallback: Quadrat */ }
  }
  const kurzName = kanzleiKurzname(kanzlei.kanzleiName);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  const labelRA = 'Rechtsanwaltskanzlei';
  const labelRAw = doc.getTextWidth(labelRA);
  doc.setFontSize(20);
  const kurzW = doc.getTextWidth(kurzName);
  const textBlockW = Math.max(labelRAw, kurzW);
  const gap = 5;
  const totalW = logoW + gap + textBlockW;
  const logoX = (pageW - totalW) / 2;
  const textX = logoX + logoW + gap;
  const logoY = 10;

  if (brief.logoBild) {
    try { doc.addImage(brief.logoBild, 'PNG', logoX, logoY, logoW, logoH); } catch { /* optional */ }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(labelRA, textX, logoY + 8);
  doc.setFontSize(20);
  doc.text(kurzName, textX, logoY + 17);

  // ── Kurzzeile (Absenderzeile, Unterstrich) — fixiert auf 45 mm (DIN 5008 Form B)
  const absY = DIN5008.absenderFirstLineMm;
  const absText = `${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(absText, mL, absY);
  doc.setLineWidth(0.15);
  doc.setDrawColor(180);
  doc.line(mL, absY + 1.5, rX, absY + 1.5);

  // ── Spalte links: Empfänger — Spalte rechts: Kanzlei-Sidebar ──
  let yL: number = DIN5008.empfaengerFirstLineMm;
  const empfStart = yL;

  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(brief.empfaengerName, mL, yL);
  yL += 5.5;
  doc.setFont('helvetica', 'normal');
  if (brief.empfaengerEmail) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Per E-Mail an: ${brief.empfaengerEmail}`, mL, yL);
    doc.setFont('helvetica', 'normal');
    yL += 6;
  }
  if (brief.empfaengerStrasse) {
    doc.text(brief.empfaengerStrasse, mL, yL);
    yL += 5;
  }
  if (brief.empfaengerPlzOrt) {
    doc.text(brief.empfaengerPlzOrt, mL, yL);
    yL += 5;
  }

  const anwaltNurName = kanzlei.anwaltName.replace(/^Rechtsanw[aä]lt(?:in)?\s+/i, '').trim();
  let yR = empfStart;
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'bold');
  doc.text(anwaltNurName, rX, yR, { align: 'right' });
  yR += 3.8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(kanzlei.anwaltTitel, rX, yR, { align: 'right' });
  yR += 3.5;
  doc.text(kanzlei.strasse, rX, yR, { align: 'right' });
  yR += 3.5;
  doc.text(kanzlei.plzOrt, rX, yR, { align: 'right' });
  yR += 3.5;
  if (brief.oepnvLinien) {
    yR += 1;
    doc.text(brief.oepnvLinien, rX, yR, { align: 'right' });
    yR += 3.5;
  }
  if (brief.oepnvHaltestelle) {
    doc.text(brief.oepnvHaltestelle, rX, yR, { align: 'right' });
    yR += 3.5;
  }
  if (brief.oepnvLinien || brief.oepnvHaltestelle) yR += 0.5;
  doc.text(`Tel.: ${kanzlei.telefon}`, rX, yR, { align: 'right' });
  yR += 3.5;
  if (kanzlei.fax) {
    doc.text(`Fax: ${kanzlei.fax.replace(/^Fax:?\s*/i, '')}`, rX, yR, { align: 'right' });
    yR += 3.5;
  }
  doc.text(kanzlei.email, rX, yR, { align: 'right' });
  yR += 3.5;
  const websiteKurz = kanzlei.website?.replace(/^https?:\/\//i, '') ?? '';
  if (websiteKurz) {
    doc.text(websiteKurz, rX, yR, { align: 'right' });
    yR += 3.5;
  }

  doc.setTextColor(0);

  // Meta/Betreff: DIN 5008 — frühestens bei 97 mm (nach Anschriftfeld + 2 Leerzeilen)
  yL = Math.max(yL + 8, 97);

  // Datum + Az. rechts auf Höhe des Betreff-Bereichs
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(datum, rX, yL, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`Az.: ${brief.aktenzeichen}`, rX, yL + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  const refBottom = yL + 7;

  doc.setFontSize(11);
  if (rg === 'verkehrsrecht') {
    boldLabel(doc, 'Ihre Schadennummer: ', brief.schadensnummerAnzeige ?? 'unbekannt', mL, yL);
    yL += 5.5;
    if (brief.kennzeichenFahrzeug) {
      boldLabel(doc, 'Kennzeichen des Fahrzeugs: ', brief.kennzeichenFahrzeug, mL, yL);
      yL += 5.5;
    }
  }
  if (rg === 'zivilrecht' && brief.streitwertFormatiert) {
    boldLabel(doc, 'Streitwert: ', brief.streitwertFormatiert, mL, yL);
    yL += 5.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  const betreffLines = doc.splitTextToSize(brief.betreff, metaMaxW);
  doc.text(betreffLines, mL, yL);
  yL += betreffLines.length * 5.5 + 2;

  doc.setFontSize(11);
  const mandLabel = rg === 'verkehrsrecht' ? 'Ihr Versicherungsnehmer: ' : 'Mandant: ';
  boldLabel(doc, mandLabel, (brief.mandantName ?? '').trim() || '—', mL, yL);
  yL += 5.5;

  doc.setTextColor(0);
  doc.setFontSize(11);

  let y = Math.max(yL, refBottom) + 6;

  // ── Brieftext (kein Trennstrich — wie im Editor) ──────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const inhaltPlain = htmlToPlainText(brief.inhalt);
  const paragraphs = inhaltPlain.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      y += 3;
      continue;
    }
    for (const wLine of doc.splitTextToSize(trimmed, contentW)) {
      if (y > pageH - 45) {
        doc.addPage();
        y = DIN5008.marginTop + 9;
      }
      doc.text(wLine, mL, y);
      y += 6.5;
    }
    y += 3;
  }

  // ── Unterschrift ───────────────────────────────────────────
  // Prüfen ob Unterschrift + 20 mm Abstand zur Fußzeile passt
  const footerLineY = pageH - 15;
  const signaturBlockH = 36;
  if (y + signaturBlockH + 20 > footerLineY) {
    doc.addPage();
    y = DIN5008.folgeseitenStartMm;
  }

  y += 4;
  if (kanzlei.unterschriftBild) {
    try {
      doc.addImage(kanzlei.unterschriftBild, 'PNG', mL, y, 55, 18);
      y += 21;
    } catch {
      y += 18;
    }
  } else {
    y += 14;
    doc.setLineWidth(0.4);
    doc.setDrawColor(0);
    doc.line(mL, y, mL + 52, y);
    y += 4;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.text(kanzlei.anwaltName, mL, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(kanzlei.anwaltTitel, mL, y);
  y += 4.5;
  doc.text(kanzlei.kanzleiName, mL, y);

  // ── Fußzeile + Falzmarken (DIN 5008 Form B) ─────────────
  for (let p = 1; p <= doc.getNumberOfPages(); p++) {
    doc.setPage(p);

    // Falzmarken (linker Blattrand, 5 mm vom Rand, 4 mm lang)
    doc.setDrawColor(160);
    doc.setLineWidth(0.2);
    doc.line(3, DIN5008.falzOben, 7, DIN5008.falzOben);
    doc.line(3, DIN5008.lochmarke, 7, DIN5008.lochmarke);
    doc.line(3, DIN5008.falzUnten, 7, DIN5008.falzUnten);

    // Fußzeile
    const fY = pageH - 13;
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    doc.line(mL, fY - 2, pageW - mR, fY - 2);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90);
    doc.text(`${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`, mL, fY);
    const footerParts: string[] = [];
    if (kanzlei.iban) footerParts.push(`IBAN: ${kanzlei.iban}`);
    if (kanzlei.bic) footerParts.push(`BIC: ${kanzlei.bic}`);
    if (kanzlei.steuernummer) footerParts.push(`StNr.: ${kanzlei.steuernummer}`);
    if (footerParts.length) {
      doc.text(footerParts.join(' · '), rX, fY, { align: 'right' });
    }
  }

  const safeName = brief.aktenzeichen.replace(/[/\\:*?"<>|]/g, '-');
  const dateStr = datum.replace(/\./g, '-');
  return { doc, dateiname: `Brief_${safeName}_${dateStr}.pdf` };
}

/** PDF direkt herunterladen (browser download dialog). */
export function druckeBriefAlsPdf(brief: BriefDaten, kanzlei: KanzleiDaten): void {
  const { doc, dateiname } = erstelleDoc(brief, kanzlei);
  doc.save(dateiname);
}

/** PDF als Blob + Dateiname zurückgeben (für Web Share API). */
export function erzeugeBriefPdfBlob(
  brief: BriefDaten,
  kanzlei: KanzleiDaten,
): { blob: Blob; dateiname: string } {
  const { doc, dateiname } = erstelleDoc(brief, kanzlei);
  return { blob: doc.output('blob'), dateiname };
}
