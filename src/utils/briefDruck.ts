import jsPDF from 'jspdf';
import type { KanzleiDaten } from '../store/kanzleiStore';

export interface BriefDaten {
  aktenzeichen: string;
  datum: string;       // ISO date string
  empfaengerName: string;
  empfaengerZusatz?: string;
  empfaengerStrasse?: string;
  empfaengerPlzOrt?: string;
  betreff: string;
  inhalt: string;      // Vollständiger Brieftext inkl. Anrede + Grußformel
}

// ── Interner Kern: erzeugt das jsPDF-Dokument ──────────────

function erstelleDoc(brief: BriefDaten, kanzlei: KanzleiDaten): { doc: jsPDF; dateiname: string } {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });

  const pageW = 210;
  const pageH = 297;
  const mL = 20;
  const mR = 20;
  const contentW = pageW - mL - mR;

  const datum = new Date(brief.datum).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  let y = 17;

  // ── Briefkopf ──────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(kanzlei.kanzleiName, mL, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50);
  doc.text(kanzlei.strasse, mL, y + 5);
  doc.text(kanzlei.plzOrt, mL, y + 9.5);

  const rX = pageW - mR;
  let ry = y;
  doc.text(`Tel.: ${kanzlei.telefon}`, rX, ry, { align: 'right' });
  ry += 4.5;
  if (kanzlei.fax) {
    doc.text(`Fax: ${kanzlei.fax}`, rX, ry, { align: 'right' });
    ry += 4.5;
  }
  doc.text(kanzlei.email, rX, ry, { align: 'right' });
  ry += 4.5;
  if (kanzlei.website) {
    doc.text(kanzlei.website, rX, ry, { align: 'right' });
  }

  y += 15;

  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(mL, y, pageW - mR, y);
  y += 7;

  // ── Absender-Kurzzeile ──────────────────────────────────────
  doc.setFontSize(7);
  doc.setTextColor(90);
  const absText = `${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`;
  doc.text(absText, mL, y);
  const absW = doc.getTextWidth(absText);
  doc.setLineWidth(0.1);
  doc.setDrawColor(90);
  doc.line(mL, y + 0.6, mL + absW, y + 0.6);
  y += 6;

  // ── Empfängeranschrift ──────────────────────────────────────
  doc.setFontSize(11);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'normal');
  const empfLines = [
    brief.empfaengerName,
    brief.empfaengerZusatz,
    brief.empfaengerStrasse,
    brief.empfaengerPlzOrt,
  ].filter((s): s is string => !!s);

  const empfStartY = y;
  for (const line of empfLines) {
    doc.text(line, mL, y);
    y += 5.5;
  }
  if (y < empfStartY + 27) y = empfStartY + 27;

  // ── Info-Block ──────────────────────────────────────────────
  const infoY = y + 4;
  const labelX = pageW - mR - 62;
  const valX = pageW - mR;

  doc.setFontSize(10);
  const infoRows: [string, string][] = [
    ['Datum:', datum],
    ['Unser Zeichen:', brief.aktenzeichen],
    ['Sachbearbeiter:', kanzlei.anwaltTitel],
  ];

  let iy = infoY;
  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70);
    doc.text(label, labelX, iy, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(value, valX, iy, { align: 'right' });
    iy += 5;
  }
  y = iy + 3;

  // ── Betreff ─────────────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  const betreffLines = doc.splitTextToSize(brief.betreff, contentW);
  doc.text(betreffLines, mL, y);
  y += betreffLines.length * 6 + 6;

  // ── Brieftext ───────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const para of brief.inhalt.split('\n')) {
    if (para.trim() === '') {
      y += 4;
    } else {
      for (const wLine of doc.splitTextToSize(para, contentW)) {
        if (y > pageH - 45) { doc.addPage(); y = 20; }
        doc.text(wLine, mL, y);
        y += 6.5;
      }
    }
  }

  // ── Unterschrift ────────────────────────────────────────────
  y += 6;
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

  // ── Fußzeile (auf jeder Seite) ──────────────────────────────
  for (let p = 1; p <= doc.getNumberOfPages(); p++) {
    doc.setPage(p);
    const fY = pageH - 13;
    doc.setDrawColor(170);
    doc.setLineWidth(0.2);
    doc.line(mL, fY - 2, pageW - mR, fY - 2);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90);
    doc.text(`${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`, mL, fY);
    if (kanzlei.iban) {
      doc.text(`IBAN: ${kanzlei.iban} · BIC: ${kanzlei.bic}`, pageW / 2, fY, { align: 'center' });
    }
    if (kanzlei.steuernummer) {
      doc.text(`StNr.: ${kanzlei.steuernummer}`, pageW - mR, fY, { align: 'right' });
    }
  }

  const safeName = brief.aktenzeichen.replace(/[/\\:*?"<>|]/g, '-');
  const dateStr = datum.replace(/\./g, '-');
  return { doc, dateiname: `Brief_${safeName}_${dateStr}.pdf` };
}

// ── Öffentliche API ────────────────────────────────────────

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
