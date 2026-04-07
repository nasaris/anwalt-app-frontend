import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Divider,
  Alert,
  Stack,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import type {
  Fall,
  Mandant,
  Partei,
  Schriftverkehr,
  SchriftverkehrRichtung,
  SchriftverkehrTyp,
  Wiedervorlage,
  WiedervorlageTyp,
} from '../../types';
import { schriftverkehrApi } from '../../api/schriftverkehr';
import { wiedervorlagenApi } from '../../api/parteien';
import { useKanzleiStore } from '../../store/kanzleiStore';
import type { KanzleiDaten } from '../../store/kanzleiStore';
import { useDokumenteStore } from '../../store/dokumenteStore';
import { erzeugeBriefPdfBlob } from '../../utils/briefDruck';

// ── Typ-Labels ────────────────────────────────────────────

const TYP_LABELS: Record<SchriftverkehrTyp, string> = {
  schadensanzeige: 'Schadensanzeige',
  gutachten_uebersandt: 'Gutachten übersandt',
  rechnung_uebersandt: 'Reparaturrechnung übersandt',
  nutzungsausfall: 'Nutzungsausfall / Mietwagen',
  kuerzungsschreiben_eingegangen: 'Kürzungsschreiben (eingegangen)',
  stellungnahme: 'Stellungnahme',
  mahnschreiben: 'Mahnschreiben',
  anschreiben_gegenseite: 'Anschreiben Gegenseite',
  deckungsanfrage_rsv: 'Deckungsanfrage RSV',
  klageschrift: 'Klageschrift',
  sonstiges: 'Sonstiges',
};

// Vordefinierte Fristen in Tagen je Schreibentyp
const FRISTEN_TAGE: Record<SchriftverkehrTyp, number> = {
  schadensanzeige: 14,
  gutachten_uebersandt: 14,
  rechnung_uebersandt: 21,
  nutzungsausfall: 14,
  kuerzungsschreiben_eingegangen: 7,   // Frist zur Stellungnahme-Vorbereitung
  stellungnahme: 14,
  mahnschreiben: 7,
  anschreiben_gegenseite: 14,
  deckungsanfrage_rsv: 14,
  klageschrift: 30,
  sonstiges: 14,
};

const FRISTEN_BESCHREIBUNG: Record<SchriftverkehrTyp, string> = {
  schadensanzeige: 'Antwort Versicherung auf Schadensanzeige',
  gutachten_uebersandt: 'Regulierung nach Gutachtenübersendung',
  rechnung_uebersandt: 'Zahlung der Reparaturrechnung',
  nutzungsausfall: 'Regulierung des Nutzungsausfalls',
  kuerzungsschreiben_eingegangen: 'Stellungnahme vorbereiten',
  stellungnahme: 'Zahlung nach Stellungnahme',
  mahnschreiben: 'Letzte Mahnfrist — danach Klage einleiten',
  anschreiben_gegenseite: 'Antwort Gegenseite',
  deckungsanfrage_rsv: 'Deckungszusage RSV einholen',
  klageschrift: 'Gerichtliche Folgemaßnahmen',
  sonstiges: 'Wiedervorlage',
};

const WV_TYP_MAP: Record<SchriftverkehrTyp, WiedervorlageTyp> = {
  schadensanzeige: 'frist_versicherung',
  gutachten_uebersandt: 'frist_versicherung',
  rechnung_uebersandt: 'frist_versicherung',
  nutzungsausfall: 'frist_versicherung',
  kuerzungsschreiben_eingegangen: 'allgemein',
  stellungnahme: 'frist_versicherung',
  mahnschreiben: 'allgemein',
  anschreiben_gegenseite: 'allgemein',
  deckungsanfrage_rsv: 'allgemein',
  klageschrift: 'allgemein',
  sonstiges: 'allgemein',
};

// VR-Typen nach Phase vorschlagen
const VR_TYPEN_PHASE: Record<number, SchriftverkehrTyp[]> = {
  1: ['schadensanzeige', 'sonstiges'],
  2: ['gutachten_uebersandt', 'rechnung_uebersandt', 'nutzungsausfall', 'sonstiges'],
  3: ['kuerzungsschreiben_eingegangen', 'stellungnahme', 'mahnschreiben', 'sonstiges'],
  4: ['klageschrift', 'mahnschreiben', 'sonstiges'],
};

const AR_TYPEN_PHASE: Record<number, SchriftverkehrTyp[]> = {
  1: ['deckungsanfrage_rsv', 'sonstiges'],
  2: ['anschreiben_gegenseite', 'stellungnahme', 'mahnschreiben', 'sonstiges'],
  3: ['klageschrift', 'sonstiges'],
};

// ── Vorlagen-Generator ────────────────────────────────────

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatDatum(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE');
}

function generiereVorlage(
  typ: SchriftverkehrTyp,
  fall: Fall,
  mandant: Mandant | null,
  empfaenger: Partei | null,
  kanzlei: KanzleiDaten,
  fristStr: string,        // formatiert: "26.03.2026"
): { betreff: string; inhalt: string } {
  const az = fall.aktenzeichen;
  const mName = mandant ? `${mandant.vorname} ${mandant.nachname}` : '[Mandant]';
  const empfName = empfaenger?.name ?? '[Empfänger]';
  const kennzeichen = fall.verkehrsrecht?.fahrzeug?.kennzeichen ?? '[Kennzeichen]';

  // Bankverbindung aus Kanzlei-Einstellungen
  const kontoInfo = kanzlei.iban
    ? `${kanzlei.bankName ? kanzlei.bankName + '\n' : ''}IBAN: ${kanzlei.iban}\nBIC: ${kanzlei.bic}`
    : '[Kontoverbindung — bitte in Einstellungen → Bankverbindung hinterlegen]';

  // Schadenshöhe / Beträge
  const schadenshoehe = fall.verkehrsrecht?.schadenshoehe
    ? fall.verkehrsrecht.schadenshoehe.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    : null;
  const reparaturkosten = fall.verkehrsrecht?.reparaturkosten
    ? fall.verkehrsrecht.reparaturkosten.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    : null;
  const nutzungsausfall = fall.verkehrsrecht?.nutzungsausfall
    ? fall.verkehrsrecht.nutzungsausfall.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    : null;
  const lohnrueckstand = fall.arbeitsrecht?.lohnrueckstand
    ? fall.arbeitsrecht.lohnrueckstand.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
    : null;

  // AR: Forderung je Falltyp
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

  switch (typ) {
    case 'schadensanzeige':
      return {
        betreff: `Schadensanzeige — Verkehrsunfall — ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

in der o.g. Angelegenheit zeigen wir an, dass wir ${mName} rechtlich vertreten.

Wir melden hiermit den Schaden aus dem Verkehrsunfall an und bitten um schnellstmögliche Bearbeitung.

Fahrzeug: ${kennzeichen}${fall.verkehrsrecht?.fahrzeug?.typ ? ` — ${fall.verkehrsrecht.fahrzeug.typ} (${fall.verkehrsrecht.fahrzeug.baujahr})` : ''}
${schadenshoehe ? `Vorläufige Schadenshöhe: ${schadenshoehe}` : ''}
Aktenzeichen: ${az}

Wir bitten um Bestätigung des Eingangs sowie Mitteilung Ihres Aktenzeichens bis zum ${fristStr}.

Mit freundlichen Grüßen`,
      };

    case 'gutachten_uebersandt':
      return {
        betreff: `Gutachtenübersendung — ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

anbei übersenden wir Ihnen das Sachverständigengutachten für das Fahrzeug mit dem Kennzeichen ${kennzeichen}.

${schadenshoehe ? `Der gutachterlich festgestellte Schaden beläuft sich auf ${schadenshoehe}.` : ''}

Wir bitten Sie, die geltend gemachten Schadenspositionen vollumfänglich zu regulieren. Die Zahlung erwarten wir bis zum ${fristStr}.

Zahlungsdaten:
${kontoInfo}

Aktenzeichen: ${az}

Mit freundlichen Grüßen`,
      };

    case 'rechnung_uebersandt':
      return {
        betreff: `Reparaturrechnung — ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

anbei erhalten Sie die Reparaturrechnung der ausführenden Werkstatt.

${reparaturkosten ? `Rechnungsbetrag: ${reparaturkosten}` : ''}

Wir bitten um Regulierung des ausgewiesenen Betrags bis zum ${fristStr} auf folgendes Konto:

${kontoInfo}

Aktenzeichen: ${az}

Mit freundlichen Grüßen`,
      };

    case 'nutzungsausfall':
      return {
        betreff: `Nutzungsausfall/Mietwagen — ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

für die unfallbedingte Reparaturdauer macht unser Mandant ${mName} Nutzungsausfallentschädigung geltend.

${nutzungsausfall
  ? `Geltend gemachter Nutzungsausfall: ${nutzungsausfall}`
  : 'Nutzungsausfalltabelle: [Fahrzeuggruppe] × [Anzahl Tage] = [Betrag] €'}

Wir bitten um Regulierung bis zum ${fristStr}.

${kontoInfo}

Aktenzeichen: ${az}

Mit freundlichen Grüßen`,
      };

    case 'kuerzungsschreiben_eingegangen':
      return {
        betreff: `Kürzungsschreiben erhalten — ${mName} — AZ: ${az}`,
        inhalt: `[Interner Vermerk — Kürzungsschreiben eingegangen]

Datum des Eingangs: [Datum eintragen]
Von: ${empfName}
Aktenzeichen Gegenseite: [AZ Gegenseite]

Gekürzter Betrag: [Betrag] €
Begründung der Kürzung: [Begründung]

Nächste Schritte:
- Gutachten und Kürzung prüfen
- Stellungnahme vorbereiten bis ${fristStr}
- Ggf. Mahnschreiben bei weiterer Ablehnung`,
      };

    case 'stellungnahme':
      return {
        betreff: `Stellungnahme zur Kürzung — ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

mit Schreiben vom [Datum Ihres Schreibens] haben Sie die geltend gemachten Schadensersatzansprüche teilweise abgelehnt bzw. gekürzt.

Hierzu nehmen wir wie folgt Stellung:

[Begründung zur Ablehnung/Kürzung — z.B. Gutachten widerlegt die Kürzung, weil ...]

${schadenshoehe ? `Der vollständige, uns zustehende Betrag beläuft sich auf ${schadenshoehe}.` : ''}

Wir fordern Sie auf, den vollständigen Schadensbetrag bis zum ${fristStr} zu begleichen. Anderenfalls behalten wir uns vor, die Angelegenheit gerichtlich geltend zu machen.

${kontoInfo}

Aktenzeichen: ${az}

Mit freundlichen Grüßen`,
      };

    case 'anschreiben_gegenseite': {
      const kuendigungsdatum = fall.arbeitsrecht?.kuendigungsdatum
        ? formatDatum(fall.arbeitsrecht.kuendigungsdatum)
        : '[Datum der Kündigung]';
      return {
        betreff: `Arbeitsrechtliche Angelegenheit ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

in der Angelegenheit unseres Mandanten ${mName} gegen ${empfName} zeigen wir an, dass wir die rechtliche Interessenvertretung übernommen haben.

${fall.arbeitsrecht?.falltyp === 'kuendigung'
  ? `Mit Schreiben vom ${kuendigungsdatum} haben Sie meinem Mandanten die Kündigung ausgesprochen. Diese Kündigung ist aus folgenden Gründen rechtswidrig:\n\n[Begründung — z.B. fehlende Sozialauswahl, kein wichtiger Grund, Verstoß gegen § 1 KSchG]`
  : '[Sachverhalt — Bitte ausfüllen]'}

Wir fordern Sie auf, ${arForderung} bis zum ${fristStr}.

Sollten Sie dieser Aufforderung nicht fristgerecht nachkommen, werden wir die Angelegenheit gerichtlich geltend machen.

Aktenzeichen: ${az}

Mit freundlichen Grüßen`,
      };
    }

    case 'deckungsanfrage_rsv':
      return {
        betreff: `Deckungsanfrage — ${mName} — Versicherungsnummer: ${mandant?.rsvNummer ?? '[Nummer]'}`,
        inhalt: `Sehr geehrte Damen und Herren,

wir vertreten Herrn/Frau ${mName}, Versicherungsnummer: ${mandant?.rsvNummer ?? '[Nummer]'}.

Wir bitten um Erteilung einer Deckungszusage für die rechtliche Vertretung in folgender Angelegenheit:

Falltyp: ${fall.arbeitsrecht?.falltyp ?? '[Falltyp]'}
${fall.arbeitsrecht?.kuendigungsdatum ? `Kündigungsdatum: ${formatDatum(fall.arbeitsrecht.kuendigungsdatum)}` : ''}
Aktenzeichen: ${az}
Gegner: ${empfName}

Bitte bestätigen Sie die Deckung bis zum ${fristStr}.

Mit freundlichen Grüßen`,
      };

    case 'mahnschreiben': {
      const betragInfo = schadenshoehe ?? lohnrueckstand ?? '[Betrag]';
      return {
        betreff: `Letzte Mahnung — ${mName} — AZ: ${az} — Frist: ${fristStr}`,
        inhalt: `Sehr geehrte Damen und Herren,

trotz unserer bisherigen Korrespondenz haben Sie den fälligen Betrag in Höhe von ${betragInfo} bis heute nicht beglichen.

Wir setzen Ihnen hiermit eine letzte Frist bis zum ${fristStr}.

Nach Fristablauf werden wir ohne weitere Ankündigung gerichtliche Schritte einleiten und alle dadurch entstehenden Kosten zu Ihren Lasten geltend machen.

Aktenzeichen: ${az}

Mit freundlichen Grüßen`,
      };
    }

    case 'klageschrift': {
      const streitwert = schadenshoehe ?? lohnrueckstand ?? '[Streitwert]';
      return {
        betreff: `Klage — ${mName} ./. ${empfName} — AZ: ${az}`,
        inhalt: `[Klageschrift — bitte vor Einreichung vollständig überarbeiten]

An das ${empfName}

Kläger: ${mName}
Beklagter: ${empfName}
Aktenzeichen: ${az}

Streitwert: ${streitwert}

I. Klageanträge

[Klageanträge formulieren]

II. Sachverhalt

[Sachverhalt ausführlich darstellen]

III. Rechtliche Begründung

[Rechtliche Begründung — z.B. § 7 StVG, § 115 VVG / § 4 KSchG etc.]

IV. Beweisangebote

[Beweismittel benennen]`,
      };
    }

    default:
      return {
        betreff: `[Betreff] — ${mName} — AZ: ${az}`,
        inhalt: `Sehr geehrte Damen und Herren,

[Inhalt]

Mit freundlichen Grüßen`,
      };
  }
}

// ── Props ─────────────────────────────────────────────────

interface Props {
  open: boolean;
  fall: Fall;
  mandant: Mandant | null;
  parteien: Partei[];
  onClose: () => void;
  onSaved: (sv: Schriftverkehr) => void;
  onWiedervorlageCreated?: (wv: Wiedervorlage) => void;
}

// ── Komponente ────────────────────────────────────────────

export default function SchriftverkehrDialog({
  open, fall, mandant, parteien, onClose, onSaved, onWiedervorlageCreated,
}: Props) {
  const kanzlei = useKanzleiStore((s) => s.daten);
  const addDokument = useDokumenteStore((s) => s.addDokument);
  const isVR = fall.rechtsgebiet === 'verkehrsrecht';
  const typenFuerPhase = isVR
    ? (VR_TYPEN_PHASE[fall.phase] ?? Object.keys(TYP_LABELS) as SchriftverkehrTyp[])
    : (AR_TYPEN_PHASE[fall.phase] ?? Object.keys(TYP_LABELS) as SchriftverkehrTyp[]);

  const [richtung, setRichtung] = useState<SchriftverkehrRichtung>('gesendet');
  const [typ, setTyp] = useState<SchriftverkehrTyp>(typenFuerPhase[0]);
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [frist, setFrist] = useState(() => addDays(FRISTEN_TAGE[typenFuerPhase[0]]));
  const [empfaengerId, setEmpfaengerId] = useState('');
  const [betreff, setBetreff] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [saving, setSaving] = useState(false);
  const [pdfHinweis, setPdfHinweis] = useState(false);

  const empfaenger = parteien.find((p) => p.id === empfaengerId) ?? null;

  // Vorlage generieren (explizit, nicht per useEffect beim Tippen)
  const genVorlage = (
    newTyp: SchriftverkehrTyp,
    newEmpfaenger: Partei | null,
    newFrist: string,
  ) => {
    const fristStr = newFrist ? formatDatum(newFrist) : '';
    const v = generiereVorlage(newTyp, fall, mandant, newEmpfaenger, kanzlei, fristStr);
    setBetreff(v.betreff);
    setInhalt(v.inhalt);
  };

  // Reset + initiale Vorlage wenn Dialog öffnet
  useEffect(() => {
    if (!open) return;
    const defaultTyp = typenFuerPhase[0];
    const defaultFrist = addDays(FRISTEN_TAGE[defaultTyp]);
    setRichtung('gesendet');
    setTyp(defaultTyp);
    setDatum(new Date().toISOString().split('T')[0]);
    setFrist(defaultFrist);
    setEmpfaengerId('');
    setPdfHinweis(false);
    genVorlage(defaultTyp, null, defaultFrist);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Typ-Wechsel: Frist zurücksetzen + neue Vorlage
  const handleTypChange = (newTyp: SchriftverkehrTyp) => {
    const newFrist = addDays(FRISTEN_TAGE[newTyp]);
    setTyp(newTyp);
    setFrist(newFrist);
    genVorlage(newTyp, empfaenger, newFrist);
  };

  // Empfänger-Wechsel: Vorlage neu generieren
  const handleEmpfaengerChange = (newId: string) => {
    setEmpfaengerId(newId);
    const newEmpfaenger = parteien.find((p) => p.id === newId) ?? null;
    genVorlage(typ, newEmpfaenger, frist);
  };

  // Frist-Wechsel: Datum im Text ersetzen (ohne Vorlage zu überschreiben)
  const handleFristChange = (newFrist: string) => {
    if (frist && newFrist) {
      const oldStr = formatDatum(frist);
      const newStr = formatDatum(newFrist);
      setBetreff((prev) => prev.split(oldStr).join(newStr));
      setInhalt((prev) => prev.split(oldStr).join(newStr));
    }
    setFrist(newFrist);
  };

  // Kern-Speicherlogik — wird von handleSave UND handlePdfUndVersenden genutzt
  // WICHTIG: muss VOR jedem mailto-Link aufgerufen werden, damit MSW aktiv bleibt
  const saveCore = async (): Promise<Schriftverkehr | null> => {
    if (!betreff || !inhalt) return null;
    setSaving(true);
    const sv = await schriftverkehrApi.create({
      fallId: fall.id,
      typ,
      richtung,
      datum: new Date(datum).toISOString(),
      betreff,
      inhalt,
      empfaengerEmail: empfaenger?.email,
      empfaengerName: empfaenger?.name,
    });
    // Wiedervorlage automatisch erstellen (nur bei ausgehenden Schreiben)
    if (richtung === 'gesendet' && frist) {
      try {
        const wv = await wiedervorlagenApi.create({
          fallId: fall.id,
          typ: WV_TYP_MAP[typ],
          beschreibung: `${FRISTEN_BESCHREIBUNG[typ]} — ${betreff}`,
          faelligAm: new Date(frist).toISOString(),
          erledigt: false,
        });
        onWiedervorlageCreated?.(wv);
      } catch { /* Wiedervorlage optional */ }
    }
    setSaving(false);
    return sv;
  };

  const handleSave = async () => {
    const sv = await saveCore();
    if (sv) { onSaved(sv); onClose(); }
  };

  const buildBriefDaten = () => ({
    aktenzeichen: fall.aktenzeichen,
    datum,
    empfaengerName: empfaenger?.name ?? '[Empfänger]',
    empfaengerStrasse: empfaenger?.adresse?.strasse,
    empfaengerPlzOrt: empfaenger?.adresse
      ? `${empfaenger.adresse.plz} ${empfaenger.adresse.ort}`
      : undefined,
    betreff,
    inhalt,
  });

  const buildDateiname = () => {
    const d = new Date(datum).toLocaleDateString('de-DE').replace(/\./g, '-');
    const az = fall.aktenzeichen.replace(/[/\\:*?"<>|]/g, '-');
    return `Brief_${az}_${d}.pdf`;
  };

  const saveDokumentToAkte = () => {
    addDokument({
      fallId: fall.id,
      dateiname: buildDateiname(),
      betreff,
      datum: new Date(datum).toISOString(),
      empfaengerName: empfaenger?.name,
      empfaengerEmail: empfaenger?.email,
      briefDaten: buildBriefDaten(),
    });
  };

  const downloadPdfBlob = (blob: Blob, dateiname: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = dateiname;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfErstellen = () => {
    const { blob, dateiname } = erzeugeBriefPdfBlob(buildBriefDaten(), kanzlei);
    downloadPdfBlob(blob, dateiname);
    saveDokumentToAkte();
  };

  const handlePdfUndVersenden = async () => {
    if (!empfaenger?.email) return;

    // ZUERST alle API-Calls erledigen, DANN erst mailto öffnen
    // (mailto-Link deaktiviert MSW kurz — API-Calls müssen daher vorher sein)
    const sv = await saveCore();
    if (!sv) return;
    onSaved(sv);

    const { blob, dateiname } = erzeugeBriefPdfBlob(buildBriefDaten(), kanzlei);
    downloadPdfBlob(blob, dateiname);
    saveDokumentToAkte();

    const datumFormatiert = new Date(datum).toLocaleDateString('de-DE');
    const mailBody =
      `Sehr geehrte Damen und Herren,\n\n` +
      `anbei erhalten Sie unser Schreiben vom ${datumFormatiert} in der Angelegenheit:\n` +
      `${betreff}\n\n` +
      `Bitte beachten Sie den beigefügten PDF-Anhang.\n\n` +
      `Mit freundlichen Grüßen\n` +
      `${kanzlei.anwaltName}\n` +
      `${kanzlei.anwaltTitel}\n` +
      `${kanzlei.kanzleiName}\n` +
      `Tel.: ${kanzlei.telefon}\n` +
      `E-Mail: ${kanzlei.email}`;

    const mailLink = document.createElement('a');
    mailLink.href = `mailto:${empfaenger.email}?subject=${encodeURIComponent(betreff)}&body=${encodeURIComponent(mailBody)}`;
    mailLink.click();

    onClose();
  };

  const fristStr = frist ? formatDatum(frist) : '';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Schriftverkehr erfassen</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {/* Richtung */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>Art des Schreibens</Typography>
            <ToggleButtonGroup
              value={richtung}
              exclusive
              onChange={(_, v) => v && setRichtung(v)}
              size="small"
            >
              <ToggleButton value="gesendet">Gesendet (ausgehend)</ToggleButton>
              <ToggleButton value="empfangen">Empfangen (eingehend)</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* Typ */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Dokumententyp</InputLabel>
              <Select
                value={typ}
                onChange={(e) => handleTypChange(e.target.value as SchriftverkehrTyp)}
                label="Dokumententyp"
              >
                {typenFuerPhase.map((t) => (
                  <MenuItem key={t} value={t}>{TYP_LABELS[t]}</MenuItem>
                ))}
                <Divider />
                {(Object.keys(TYP_LABELS) as SchriftverkehrTyp[])
                  .filter((t) => !typenFuerPhase.includes(t))
                  .map((t) => (
                    <MenuItem key={t} value={t}><em>{TYP_LABELS[t]}</em></MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Datum */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Datum"
              type="date"
              fullWidth
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Empfänger */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth>
              <InputLabel>{richtung === 'gesendet' ? 'Empfänger' : 'Absender'}</InputLabel>
              <Select
                value={empfaengerId}
                onChange={(e) => handleEmpfaengerChange(e.target.value)}
                label={richtung === 'gesendet' ? 'Empfänger' : 'Absender'}
              >
                <MenuItem value=""><em>Keine Partei</em></MenuItem>
                {parteien.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Antwortfrist (nur ausgehend) */}
          {richtung === 'gesendet' && (
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Antwort-/Zahlungsfrist bis"
                type="date"
                fullWidth
                value={frist}
                onChange={(e) => handleFristChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                helperText={`Standard: ${FRISTEN_TAGE[typ]} Tage ab heute`}
              />
            </Grid>
          )}

          {/* Wiedervorlagen-Hinweis */}
          {richtung === 'gesendet' && frist && (
            <Grid size={{ xs: 12, sm: 8 }}>
              <Alert severity="info" sx={{ height: '100%', alignItems: 'center' }}>
                Beim Speichern wird automatisch eine Wiedervorlage bis zum <strong>{fristStr}</strong> erstellt: „{FRISTEN_BESCHREIBUNG[typ]}".
              </Alert>
            </Grid>
          )}

          {/* PDF-Download-Hinweis */}
          {richtung === 'gesendet' && pdfHinweis && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="success" onClose={() => setPdfHinweis(false)}>
                PDF wurde heruntergeladen und das Mail-Programm wurde geöffnet. Bitte das PDF aus dem Download-Ordner als Anhang in die E-Mail ziehen.
              </Alert>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Divider />
            <Typography variant="subtitle2" color="primary" mt={2} mb={1}>Inhalt</Typography>
          </Grid>

          {/* Betreff */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Betreff"
              fullWidth
              value={betreff}
              onChange={(e) => setBetreff(e.target.value)}
              required
            />
          </Grid>

          {/* Inhalt */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Inhalt / Brieftext"
              fullWidth
              multiline
              rows={14}
              value={inhalt}
              onChange={(e) => setInhalt(e.target.value)}
              required
              slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: 13 } } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Stack direction="row" spacing={1}>
          {richtung === 'gesendet' && (
            <Button
              variant="outlined"
              color="secondary"
              disabled={!betreff || !inhalt}
              onClick={handlePdfErstellen}
              title="PDF herunterladen und in Fallakte speichern"
            >
              PDF erstellen
            </Button>
          )}
          {richtung === 'gesendet' && (
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              disabled={!betreff || !inhalt || !empfaenger?.email}
              onClick={handlePdfUndVersenden}
              title={!empfaenger?.email ? 'Kein Empfänger mit E-Mail-Adresse gewählt' : 'PDF herunterladen + Mail-Programm öffnen'}
            >
              PDF + versenden
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!betreff || !inhalt || saving}
            onClick={handleSave}
          >
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
