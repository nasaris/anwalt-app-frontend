import { useEffect, useMemo, useRef, useState } from 'react';
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
  Box,
  FormLabel,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Menu,
  FormControlLabel,
  Checkbox,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleIcon from '@mui/icons-material/Article';
import type {
  Fall,
  Mandant,
  Partei,
  Rechtsgebiet,
  Schriftverkehr,
  SchriftverkehrRichtung,
  SchriftverkehrTyp,
  Wiedervorlage,
  WiedervorlageTyp,
} from '../../types';
import { schriftverkehrApi } from '../../api/schriftverkehr';
import { wiedervorlagenApi } from '../../api/parteien';
import { useKanzleiStore, type KanzleiDaten } from '../../store/kanzleiStore';
import { useDokumenteStore } from '../../store/dokumenteStore';
import { useVorlagenStore, type Textvorlage, type VorlagenRechtsgebiet } from '../../store/vorlagenStore';
import {
  buildTextvorlagePlatzhalterMap,
  ersetzeTextvorlagePlatzhalter,
  composeBriefInhaltMitBausteinen,
  aktiveBausteinReihenfolge,
  findBausteinPlatzhalterIds,
  hatBausteinPlatzhalter,
} from '../../utils/textvorlagePlatzhalter';
import { useAufgabenStore, type AufgabeRechtsgebiet } from '../../store/aufgabenStore';
import { DIN5008, erzeugeBriefPdfBlob } from '../../utils/briefDruck';
import { toEditorHtml, isEditorContentEmpty } from '../../utils/htmlToPlainText';
import SchriftverkehrEditor from '../SchriftverkehrEditor/SchriftverkehrEditor';

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

// ── Frist-Helfer ──────────────────────────────────────────

function addDays(days: number): string {
  const n = typeof days === 'number' && Number.isFinite(days) ? Math.trunc(days) : 14;
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function formatDatum(iso: string): string {
  const raw = iso?.trim() ?? '';
  if (!raw) return '';
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T12:00:00` : raw;
  const t = Date.parse(normalized);
  if (Number.isNaN(t)) return raw;
  return new Date(t).toLocaleDateString('de-DE');
}

/**
 * Briefkopf-Vorschau: DIN 5008:2020 (Form B, A4) — Maße wie PDF-Export (briefDruck).
 * @see https://www.din-5008-richtlinien.de/startseite/geschaeftsbriefbogen/
 */
const FONT_ARIAL = '"Arial", "Arial MT", "Helvetica Neue", Helvetica, sans-serif';
const FONT_CENTURY_GOTHIC =
  '"Century Gothic", "Century Gothic", "Futura", "Arial Narrow", "Helvetica Neue", sans-serif';

/** Logo unter public/branding */
const BRIEFKOPF_LOGO_SRC = `${import.meta.env.BASE_URL}branding/briefkopf-logo.png`;

/** Telefon wie im PDF: „Tel: 0176· 80025250“ (erstes Leerzeichen → Mittelpunkt). */
function formatTelPdf(telefon: string): string {
  const t = telefon.replace(/^Tel\.?:?\s*/i, '').trim();
  if (!t) return 'Tel: —';
  return `Tel: ${t.replace(/\s+/, '· ')}`;
}

function kanzleiKurzname(kanzleiName: string): string {
  const s = kanzleiName.replace(/^Rechtsanwaltskanzlei\s+/i, '').trim();
  return s || kanzleiName;
}

function FokusBriefkopfVorschau({
  kanzlei,
  rechtsgebiet,
  datumIso,
  aktenzeichen,
  betreff,
  dokumentTypLabel: _dokumentTypLabel,
  empfaengerName,
  empfaengerStrasse,
  empfaengerPlzOrt,
  empfaengerEmail,
  parteiRolle: _parteiRolle,
  antwortFristBis,
  schadensnummerAnzeige,
  mandantName,
  kennzeichenFahrzeug,
  streitwertFormatiert,
}: {
  kanzlei: KanzleiDaten;
  rechtsgebiet: Rechtsgebiet;
  datumIso: string;
  aktenzeichen: string;
  betreff: string;
  dokumentTypLabel: string;
  empfaengerName: string;
  empfaengerStrasse?: string;
  empfaengerPlzOrt?: string;
  empfaengerEmail?: string;
  parteiRolle: string;
  antwortFristBis?: string;
  /** Nur Verkehrsrecht: Partei Versicherung oder „unbekannt“ */
  schadensnummerAnzeige: string;
  /** Mandant (VR: „Versicherungsnehmer“, AR/ZR: „Mandant“) */
  mandantName: string;
  /** Nur Verkehrsrecht: amtliches Kennzeichen */
  kennzeichenFahrzeug?: string;
  /** Nur Zivilrecht: optional */
  streitwertFormatiert?: string;
}) {
  void _dokumentTypLabel;
  void _parteiRolle;
  void antwortFristBis;

  const datumFmt = new Date(datumIso).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const kurzzeile = `${kanzlei.kanzleiName} · ${kanzlei.strasse} · ${kanzlei.plzOrt}`;
  const kurzName = kanzleiKurzname(kanzlei.kanzleiName);
  const websiteKurz = kanzlei.website?.replace(/^https?:\/\//i, '') ?? '';
  const oepnvL = kanzlei.briefkopfOepnvLinien?.trim();
  const oepnvH = kanzlei.briefkopfOepnvHaltestelle?.trim();
  const anwaltNurName = kanzlei.anwaltName.replace(/^Rechtsanw[aä]lt(?:in)?\s+/i, '').trim();

  const textMuted = '#6b7280';

  const sxArial = { fontFamily: FONT_ARIAL, fontSize: '11pt' as const, lineHeight: 1.5 };
  const sxCg = { fontFamily: FONT_CENTURY_GOTHIC, fontSize: '8pt' as const, lineHeight: 1.4, color: textMuted };

  const { marginLeft, marginRight } = DIN5008;

  const absTop = `${DIN5008.absenderFirstLineMm}mm`;
  const empfTop = `${DIN5008.empfaengerFirstLineMm}mm`;

  return (
    <Box sx={{ position: 'relative', width: '210mm', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Logo + Kanzleiname zentriert (fixiert bei ~10 mm) */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={2.5}
        sx={{ position: 'absolute', top: '10mm', left: 0, right: 0, px: 1, pointerEvents: 'none' }}
      >
        <Box component="img" src={BRIEFKOPF_LOGO_SRC} alt="" sx={{ height: 'auto', width: 'auto', maxHeight: { xs: 56, sm: 72 }, objectFit: 'contain', flexShrink: 0 }} />
        <Stack spacing={0.5} sx={{ textAlign: 'left', justifyContent: 'center' }}>
          <Typography sx={{ fontFamily: FONT_CENTURY_GOTHIC, fontSize: { xs: '11pt', sm: '12pt' }, fontWeight: 400, color: textMuted, lineHeight: 1.15 }}>
            Rechtsanwaltskanzlei
          </Typography>
          <Typography sx={{ fontFamily: FONT_CENTURY_GOTHIC, fontSize: { xs: '18pt', sm: '20pt' }, fontWeight: 400, color: textMuted, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            {kurzName}
          </Typography>
        </Stack>
      </Stack>

      {/* Kurzzeile (Absenderzeile) — fixiert bei 45 mm */}
      <Box
        sx={{
          position: 'absolute',
          top: absTop,
          left: `${marginLeft}mm`,
          right: `${marginRight}mm`,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 0.75,
        }}
      >
        <Typography sx={{ fontFamily: FONT_CENTURY_GOTHIC, fontSize: '8pt', color: textMuted, letterSpacing: '0.02em', lineHeight: 1.25 }}>
          {kurzzeile}
        </Typography>
      </Box>

      {/* 50 mm: Empfänger links | Kanzlei-Sidebar rechts */}
      <Box sx={{ position: 'absolute', top: empfTop, left: `${marginLeft}mm`, right: `${marginRight}mm` }}>
        <Grid container columnSpacing={3} rowSpacing={0}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <Typography sx={{ ...sxArial, fontWeight: 700, color: 'text.primary' }}>{empfaengerName}</Typography>
            {empfaengerEmail ? (
              <Typography sx={{ ...sxArial, fontWeight: 700, mt: 1.25, color: 'text.primary' }}>Per E-Mail an: {empfaengerEmail}</Typography>
            ) : null}
            {empfaengerStrasse ? (
              <Typography sx={{ ...sxArial, fontWeight: 400, mt: empfaengerEmail ? 1.25 : 1, color: 'text.primary' }}>{empfaengerStrasse}</Typography>
            ) : null}
            {empfaengerPlzOrt ? (
              <Typography sx={{ ...sxArial, fontWeight: 400, color: 'text.primary' }}>{empfaengerPlzOrt}</Typography>
            ) : null}
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Stack spacing={0.45} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography sx={{ ...sxCg, fontWeight: 700, fontSize: '10pt' }}>{anwaltNurName}</Typography>
              <Typography sx={sxCg}>{kanzlei.anwaltTitel}</Typography>
              <Typography sx={sxCg}>{kanzlei.strasse}</Typography>
              <Typography sx={sxCg}>{kanzlei.plzOrt}</Typography>
              {oepnvL ? <Typography sx={{ ...sxCg, mt: 0.75 }}>{oepnvL}</Typography> : null}
              {oepnvH ? <Typography sx={sxCg}>{oepnvH}</Typography> : null}
              <Typography sx={{ ...sxCg, mt: oepnvL || oepnvH ? 0.5 : 0.75 }}>{formatTelPdf(kanzlei.telefon)}</Typography>
              {kanzlei.fax ? <Typography sx={sxCg}>Fax: {kanzlei.fax.replace(/^Fax:?\s*/i, '')}</Typography> : null}
              <Typography sx={{ ...sxCg, wordBreak: 'break-all' }}>{kanzlei.email}</Typography>
              {websiteKurz ? <Typography sx={sxCg}>{websiteKurz}</Typography> : null}
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* 97 mm: Meta/Betreff links | Datum/Az. rechts (DIN 5008: nach Anschriftfeld + 2 Leerzeilen) */}
      <Box sx={{ pt: '97mm', pl: `${marginLeft}mm`, pr: `${marginRight}mm`, pb: 2 }}>
        <Grid container columnSpacing={3} rowSpacing={0} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <Stack spacing={1.25}>
              {rechtsgebiet === 'verkehrsrecht' && (
                <>
                  <Typography sx={{ ...sxArial, color: 'text.primary' }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>Ihre Schadennummer:{' '}</Box>
                    {schadensnummerAnzeige}
                  </Typography>
                  {kennzeichenFahrzeug ? (
                    <Typography sx={{ ...sxArial, color: 'text.primary' }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>Kennzeichen des Fahrzeugs:{' '}</Box>
                      {kennzeichenFahrzeug}
                    </Typography>
                  ) : null}
                </>
              )}
              {rechtsgebiet === 'zivilrecht' && streitwertFormatiert ? (
                <Typography sx={{ ...sxArial, color: 'text.primary' }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>Streitwert:{' '}</Box>
                  {streitwertFormatiert}
                </Typography>
              ) : null}
              <Typography sx={{ ...sxArial, fontWeight: 700, color: 'text.primary' }}>{betreff || '—'}</Typography>
              <Typography sx={{ ...sxArial, color: 'text.primary' }}>
                <Box component="span" sx={{ fontWeight: 700 }}>{rechtsgebiet === 'verkehrsrecht' ? 'Ihr Versicherungsnehmer: ' : 'Mandant: '}</Box>
                {mandantName.trim() || '—'}
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Stack spacing={0.35} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography sx={{ ...sxArial, fontSize: '10pt', lineHeight: 1.4 }}>{datumFmt}</Typography>
              <Typography sx={{ ...sxArial, fontSize: '10pt', fontWeight: 700, lineHeight: 1.4 }}>Az.: {aktenzeichen}</Typography>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
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
  /** Optionaler Typ der beim Öffnen vorausgewählt wird (z.B. aus Aufgaben-Button) */
  initialTyp?: string;
  /** Optional: Standard-Textvorlage aus Aufgabe */
  initialTextvorlageId?: string;
  /** Wenn gesetzt: Bearbeiten-Modus — vorhandenes Schriftstück wird editiert (PATCH) */
  initialSv?: Schriftverkehr;
}

// ── Komponente ────────────────────────────────────────────

export default function SchriftverkehrDialog({
  open,
  fall,
  mandant,
  parteien,
  onClose,
  onSaved,
  onWiedervorlageCreated,
  initialTyp,
  initialTextvorlageId,
  initialSv,
}: Props) {
  const kanzlei = useKanzleiStore((s) => s.daten);
  const addDokument = useDokumenteStore((s) => s.addDokument);
  const getAlleTextvorlagen = useVorlagenStore((s) => s.getAlleTextvorlagen);
  const resolveInitialTextvorlage = useVorlagenStore((s) => s.resolveInitialTextvorlage);
  const getAlleTextBausteine = useVorlagenStore((s) => s.getAlleTextBausteine);
  const getTypenFuerPhase = useAufgabenStore((s) => s.getTypenFuerPhase);
  /** Leeres Array wenn alle Aufgaben ohne schriftverkehrTypId — sonst kracht addDays(typ[0]). */
  const typenFuerPhaseRaw = getTypenFuerPhase(fall.rechtsgebiet as AufgabeRechtsgebiet, fall.phase) as SchriftverkehrTyp[];
  const typenFuerPhase =
    typenFuerPhaseRaw.length > 0 ? typenFuerPhaseRaw : (['sonstiges'] as SchriftverkehrTyp[]);

  const [richtung, setRichtung] = useState<SchriftverkehrRichtung>('gesendet');
  const [typ, setTyp] = useState<SchriftverkehrTyp>(typenFuerPhase[0]);
  const [datum, setDatum] = useState(new Date().toISOString().split('T')[0]);
  const [frist, setFrist] = useState(() => addDays(FRISTEN_TAGE[typenFuerPhase[0]]));
  const [empfaengerId, setEmpfaengerId] = useState('');
  const [betreff, setBetreff] = useState('');
  const [inhalt, setInhalt] = useState(() => toEditorHtml(''));
  /** Grundlagentext der Textvorlage (ohne angehängte Bausteine), Platzhalter ersetzt */
  const [basisInhaltPlain, setBasisInhaltPlain] = useState('');
  /** Aus der Vorlage zugewiesene Baustein-IDs */
  const [zugewieseneBausteinIds, setZugewieseneBausteinIds] = useState<string[]>([]);
  /** Aktuell eingeschlossene Bausteine (zugewiesene + aus Pool), Reihenfolge */
  const [aktiveBausteinIds, setAktiveBausteinIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [pdfHinweis, setPdfHinweis] = useState(false);
  /** Vollbild-Editor nur für den Brieftext */
  const [fokusEditorOpen, setFokusEditorOpen] = useState(false);
  /** Nach Auswahl der Textbausteine: vollständige Schreibmaske mit Editor */
  const [schreibMaskeFreigegeben, setSchreibMaskeFreigegeben] = useState(true);
  /** Vorlage laden — Menü-Anker */
  const [vorlageMenuAnchor, setVorlageMenuAnchor] = useState<null | HTMLElement>(null);
  const vorlageMenuBtnRef = useRef<HTMLButtonElement>(null);
  /** Blob-URL für die Inline-PDF-Vorschau im Dialog */
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [logoBild, setLogoBild] = useState<string | undefined>();

  const empfaenger = parteien.find((p) => p.id === empfaengerId) ?? null;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      setLogoBild(c.toDataURL('image/png'));
    };
    img.crossOrigin = 'anonymous';
    img.src = `${import.meta.env.BASE_URL}branding/briefkopf-logo.png`;
  }, []);

  // Vorlage generieren (explizit, nicht per useEffect beim Tippen)
  const genVorlage = (
    newTyp: SchriftverkehrTyp,
    newEmpfaenger: Partei | null,
    newFrist: string,
    preferredVorlageId?: string | null,
  ) => {
    const frg = fall.rechtsgebiet as VorlagenRechtsgebiet;
    const v = resolveInitialTextvorlage({
      typId: newTyp,
      fallRechtsgebiet: frg,
      preferredVorlageId: preferredVorlageId?.trim() || undefined,
    });
    if (!v) return;
    const fristStr = newFrist ? formatDatum(newFrist) : '';
    const map = buildTextvorlagePlatzhalterMap({
      fall,
      mandant,
      empfaenger: newEmpfaenger,
      kanzlei,
      fristStr,
    });
    const basis = ersetzeTextvorlagePlatzhalter(v.inhalt, map);
    const alle = useVorlagenStore.getState().getAlleTextBausteine();
    const zug = (v.zugewieseneBausteinIds ?? []).filter((id) => alle.some((b) => b.id === id));
    const slotIds = findBausteinPlatzhalterIds(v.inhalt);
    const aktivInit = slotIds.length > 0 ? [...slotIds] : [...zug];
    setBasisInhaltPlain(basis);
    setZugewieseneBausteinIds(zug);
    setAktiveBausteinIds(aktivInit);
    setBetreff(ersetzeTextvorlagePlatzhalter(v.betreff, map));
    const poolCandidates = alle.filter(
      (b) =>
        (b.rechtsgebiet === 'alle' || b.rechtsgebiet === fall.rechtsgebiet) &&
        !zug.includes(b.id),
    );
    const needsBausteinSchritt = slotIds.length > 0 || zug.length > 0 || poolCandidates.length > 0;
    setSchreibMaskeFreigegeben(!needsBausteinSchritt);
  };

  // Platzhalter ersetzen und Vorlage laden (inkl. Baustein-Zuweisungen)
  const ladeVorlage = (v: Textvorlage) => {
    const fristStr = frist ? formatDatum(frist) : '';
    const map = buildTextvorlagePlatzhalterMap({
      fall,
      mandant,
      empfaenger,
      kanzlei,
      fristStr,
    });
    const alle = useVorlagenStore.getState().getAlleTextBausteine();
    const basis = ersetzeTextvorlagePlatzhalter(v.inhalt, map);
    const zug = (v.zugewieseneBausteinIds ?? []).filter((id) => alle.some((b) => b.id === id));
    const slotIds = findBausteinPlatzhalterIds(v.inhalt);
    const aktivInit = slotIds.length > 0 ? [...slotIds] : [...zug];
    setBasisInhaltPlain(basis);
    setZugewieseneBausteinIds(zug);
    setAktiveBausteinIds(aktivInit);
    setBetreff(ersetzeTextvorlagePlatzhalter(v.betreff, map));
    setVorlageMenuAnchor(null);
    const poolCandidates = alle.filter(
      (b) =>
        (b.rechtsgebiet === 'alle' || b.rechtsgebiet === fall.rechtsgebiet) &&
        !zug.includes(b.id),
    );
    const needsBausteinSchritt = slotIds.length > 0 || zug.length > 0 || poolCandidates.length > 0;
    setSchreibMaskeFreigegeben(!needsBausteinSchritt);
  };

  // Verfügbare Vorlagen für den aktuellen Typ
  const passendeVorlagen = getAlleTextvorlagen().filter(
    (v) =>
      v.typId === typ &&
      (v.rechtsgebiet === 'alle' || v.rechtsgebiet === fall.rechtsgebiet),
  );

  const alleTextBausteine = getAlleTextBausteine();
  const bausteinPool = alleTextBausteine.filter(
    (b) =>
      (b.rechtsgebiet === 'alle' || b.rechtsgebiet === fall.rechtsgebiet) &&
      !zugewieseneBausteinIds.includes(b.id),
  );
  const bausteinNachId = (id: string) => alleTextBausteine.find((b) => b.id === id);

  const nutztBausteinPlatzhalter = useMemo(
    () => hatBausteinPlatzhalter(basisInhaltPlain),
    [basisInhaltPlain],
  );

  const auswahlBausteinIds = useMemo(() => {
    if (nutztBausteinPlatzhalter) {
      return findBausteinPlatzhalterIds(basisInhaltPlain);
    }
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of zugewieseneBausteinIds) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
    for (const b of bausteinPool) {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        out.push(b.id);
      }
    }
    return out;
  }, [nutztBausteinPlatzhalter, basisInhaltPlain, zugewieseneBausteinIds, bausteinPool]);

  const hatTextbausteinAuswahl = auswahlBausteinIds.length > 0;

  const textBausteineZumEinfuegen = useMemo(() => {
    const fristStrLocal = frist ? formatDatum(frist) : '';
    const map = buildTextvorlagePlatzhalterMap({
      fall,
      mandant,
      empfaenger,
      kanzlei,
      fristStr: fristStrLocal,
    });
    return alleTextBausteine
      .filter((b) => b.rechtsgebiet === 'alle' || b.rechtsgebiet === fall.rechtsgebiet)
      .map((b) => ({
        id: b.id,
        label: b.name,
        getHtml: () => toEditorHtml(ersetzeTextvorlagePlatzhalter(b.inhalt, map)),
      }));
  }, [alleTextBausteine, fall, mandant, empfaenger, kanzlei, frist]);

  const toggleBaustein = (id: string, checked: boolean) => {
    setAktiveBausteinIds((prev) => {
      const next = checked
        ? (prev.includes(id) ? prev : [...prev, id])
        : prev.filter((x) => x !== id);
      if (hatBausteinPlatzhalter(basisInhaltPlain)) return next;
      return aktiveBausteinReihenfolge(zugewieseneBausteinIds, next);
    });
  };

  // Brieftext aus Grundvorlage + gewählten Bausteinen neu setzen (z. B. nach Checkbox)
  useEffect(() => {
    if (!open || !basisInhaltPlain) return;
    const fristStr = frist ? formatDatum(frist) : '';
    const map = buildTextvorlagePlatzhalterMap({
      fall,
      mandant,
      empfaenger,
      kanzlei,
      fristStr,
    });
    const alle = useVorlagenStore.getState().getAlleTextBausteine();
    setInhalt(
      toEditorHtml(
        composeBriefInhaltMitBausteinen({
          basisPlain: basisInhaltPlain,
          aktivOrder: aktiveBausteinIds,
          zugewieseneIds: zugewieseneBausteinIds,
          textBausteine: alle,
          platzhalterMap: map,
        }),
      ),
    );
  }, [
    open,
    basisInhaltPlain,
    aktiveBausteinIds,
    zugewieseneBausteinIds,
    empfaenger,
    fall,
    mandant,
    kanzlei,
    frist,
  ]);

  // Reset + initiale Vorlage wenn Dialog öffnet
  useEffect(() => {
    if (!open) return;
    if (initialSv) {
      // Bearbeiten-Modus: Felder aus vorhandenem Schriftstück vorbelegen
      const allTypes = Object.keys(TYP_LABELS) as SchriftverkehrTyp[];
      const svTyp = allTypes.includes(initialSv.typ as SchriftverkehrTyp)
        ? (initialSv.typ as SchriftverkehrTyp)
        : ('sonstiges' as SchriftverkehrTyp);
      setRichtung(initialSv.richtung);
      setTyp(svTyp);
      setDatum(initialSv.datum.split('T')[0]);
      setFrist('');
      setBetreff(initialSv.betreff);
      setInhalt(toEditorHtml(initialSv.inhalt));
      setBasisInhaltPlain(initialSv.inhalt);
      setZugewieseneBausteinIds([]);
      setAktiveBausteinIds([]);
      setSchreibMaskeFreigegeben(true);
      setPdfHinweis(false);
      // Empfänger anhand E-Mail matchen (best effort)
      const matchedPartei = parteien.find((p) => p.email === initialSv.empfaengerEmail);
      setEmpfaengerId(matchedPartei?.id ?? '');
      return;
    }
    const allTypes = Object.keys(TYP_LABELS) as SchriftverkehrTyp[];
    const defaultTyp = (
      initialTyp && allTypes.includes(initialTyp as SchriftverkehrTyp)
        ? initialTyp as SchriftverkehrTyp
        : typenFuerPhase[0] ?? allTypes[0]
    );
    const defaultFrist = addDays(FRISTEN_TAGE[defaultTyp] ?? 14);
    setRichtung('gesendet');
    setTyp(defaultTyp);
    setDatum(new Date().toISOString().split('T')[0]);
    setFrist(defaultFrist);
    setEmpfaengerId('');
    setPdfHinweis(false);
    genVorlage(defaultTyp, null, defaultFrist, initialTextvorlageId);
  }, [open, initialTyp, initialTextvorlageId, initialSv]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) setFokusEditorOpen(false);
  }, [open]);

  // Typ-Wechsel: Frist zurücksetzen + neue Vorlage
  const handleTypChange = (newTyp: SchriftverkehrTyp) => {
    const newFrist = addDays(FRISTEN_TAGE[newTyp]);
    setTyp(newTyp);
    setFrist(newFrist);
    genVorlage(newTyp, empfaenger, newFrist, undefined);
  };

  // Empfänger-Wechsel: Vorlage neu generieren
  const handleEmpfaengerChange = (newId: string) => {
    setEmpfaengerId(newId);
    const newEmpfaenger = parteien.find((p) => p.id === newId) ?? null;
    genVorlage(typ, newEmpfaenger, frist, undefined);
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
    if (!betreff || isEditorContentEmpty(inhalt)) return null;
    setSaving(true);
    let sv: Schriftverkehr;
    if (initialSv) {
      // Bearbeiten-Modus: PATCH
      sv = await schriftverkehrApi.update(initialSv.id, {
        typ,
        richtung,
        datum: new Date(datum).toISOString(),
        betreff,
        inhalt,
        empfaengerEmail: empfaenger?.email,
        empfaengerName: empfaenger?.name,
      });
    } else {
      // Neu anlegen: POST
      sv = await schriftverkehrApi.create({
        fallId: fall.id,
        typ,
        richtung,
        datum: new Date(datum).toISOString(),
        betreff,
        inhalt,
        empfaengerEmail: empfaenger?.email,
        empfaengerName: empfaenger?.name,
      });
      // Wiedervorlage automatisch erstellen (nur bei ausgehenden Schreiben, nicht im Edit-Modus)
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
    empfaengerEmail: empfaenger?.email,
    betreff,
    inhalt,
    rechtsgebiet: fall.rechtsgebiet,
    schadensnummerAnzeige: empfaenger?.schadensnummer?.trim() || 'unbekannt',
    kennzeichenFahrzeug: fall.verkehrsrecht?.fahrzeug?.kennzeichen,
    mandantName: mandant ? `${mandant.vorname} ${mandant.nachname}`.trim() : '',
    streitwertFormatiert:
      fall.zivilrecht?.streitwert != null
        ? fall.zivilrecht.streitwert.toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR',
          })
        : undefined,
    antwortFristBis:
      richtung === 'gesendet' && frist ? formatDatum(frist) : undefined,
    oepnvLinien: kanzlei.briefkopfOepnvLinien?.trim() || undefined,
    oepnvHaltestelle: kanzlei.briefkopfOepnvHaltestelle?.trim() || undefined,
    logoBild,
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

  const handlePdfVorschau = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    const { blob } = erzeugeBriefPdfBlob(buildBriefDaten(), kanzlei);
    const pdfBlob = new Blob([blob], { type: 'application/pdf' });
    setPdfPreviewUrl(URL.createObjectURL(pdfBlob));
  };

  const closePdfVorschau = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
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
    <>
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{initialSv ? 'Schriftverkehr bearbeiten' : 'Schriftverkehr erfassen'}</DialogTitle>
      <DialogContent dividers>
        {!schreibMaskeFreigegeben && hatTextbausteinAuswahl ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Textbausteine für dieses Schreiben
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {nutztBausteinPlatzhalter
                ? 'Die Vorlage enthält Platzhalter für Bausteine an festen Stellen. Wähle, welche davon in den Brieftext einfließen sollen. Die Vorschau unten aktualisiert sich sofort.'
                : 'Wähle, welche Bausteine an den Brieftext angehängt werden. Die Vorschau unten aktualisiert sich sofort.'}
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'jurist.surfaceContainerLow' }}>
              <Stack direction="row" flexWrap="wrap" useFlexGap gap={1}>
                {auswahlBausteinIds.map((id) => {
                  const b = bausteinNachId(id);
                  if (!b) return null;
                  return (
                    <FormControlLabel
                      key={id}
                      control={(
                        <Checkbox
                          size="small"
                          checked={aktiveBausteinIds.includes(id)}
                          onChange={(_, c) => toggleBaustein(id, c)}
                        />
                      )}
                      label={<Typography variant="body2">{b.name}</Typography>}
                    />
                  );
                })}
              </Stack>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
              Vorschau Brieftext
            </Typography>
            <Paper
              variant="outlined"
              component="div"
              sx={(theme) => ({
                p: 2,
                maxHeight: 480,
                overflow: 'auto',
                bgcolor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[100],
                borderRadius: 2,
                fontFamily: '"Segoe UI", "Calibri", "Helvetica Neue", Helvetica, Arial, sans-serif',
                fontSize: '11pt',
                lineHeight: 1.5,
                '& p': { mb: 1 },
                '& p:last-of-type': { mb: 0 },
              })}
              dangerouslySetInnerHTML={{ __html: inhalt }}
            />
          </Grid>
        </Grid>
        ) : (
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
            <Stack direction="row" alignItems="center" justifyContent="space-between" mt={2} mb={1}>
              <Typography variant="subtitle2" color="primary">Inhalt</Typography>
              {passendeVorlagen.length > 0 && (
                <Tooltip title="Textvorlage laden">
                  <Button
                    ref={vorlageMenuBtnRef}
                    size="small"
                    variant="outlined"
                    startIcon={<ArticleIcon />}
                    onClick={(e) => setVorlageMenuAnchor(e.currentTarget)}
                  >
                    Vorlage laden
                  </Button>
                </Tooltip>
              )}
            </Stack>
            <Menu
              anchorEl={vorlageMenuAnchor}
              open={Boolean(vorlageMenuAnchor)}
              onClose={() => setVorlageMenuAnchor(null)}
            >
              {passendeVorlagen.map((v) => (
                <MenuItem key={v.id} onClick={() => ladeVorlage(v)}>
                  {v.name}
                </MenuItem>
              ))}
            </Menu>
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
          {schreibMaskeFreigegeben && (
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }} gap={1} flexWrap="wrap">
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
                <FormLabel required sx={{ mb: 0 }}>
                  Inhalt / Brieftext
                </FormLabel>
                {hatTextbausteinAuswahl ? (
                  <Button size="small" variant="text" onClick={() => setSchreibMaskeFreigegeben(false)}>
                    Zurück zur Baustein-Auswahl
                  </Button>
                ) : null}
              </Stack>
              {!fokusEditorOpen && (
                <Tooltip title="Groß schreiben — Vollbild (Fokusmodus)">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FullscreenIcon />}
                    onClick={() => setFokusEditorOpen(true)}
                  >
                    Fokusmodus
                  </Button>
                </Tooltip>
              )}
            </Stack>
            {fokusEditorOpen ? (
              <Box
                sx={(theme) => ({
                  minHeight: 320,
                  borderRadius: 2,
                  bgcolor: theme.palette.mode === 'light' ? '#E7E6E6' : theme.palette.grey[900],
                  border: `1px solid ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.06)' : theme.palette.divider}`,
                  p: { xs: 1.5, sm: 2 },
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                })}
                aria-hidden
              >
                <Box
                  sx={(theme) => ({
                    width: '100%',
                    maxWidth: '210mm',
                    minHeight: 280,
                    bgcolor: theme.palette.mode === 'light' ? '#fff' : theme.palette.grey[100],
                    borderRadius: 1,
                    boxShadow:
                      theme.palette.mode === 'light'
                        ? '0 2px 8px rgba(0,0,0,0.08)'
                        : '0 2px 12px rgba(0,0,0,0.35)',
                  })}
                />
              </Box>
            ) : (
              <SchriftverkehrEditor
                value={inhalt}
                onChange={setInhalt}
                minHeight={320}
                placeholder="Brieftext eingeben…"
                textBausteineZumEinfuegen={textBausteineZumEinfuegen}
              />
            )}
          </Grid>
          )}
        </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        {!schreibMaskeFreigegeben && hatTextbausteinAuswahl ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setSchreibMaskeFreigegeben(true)}
          >
            Weiter zum Brieftext
          </Button>
        ) : (
        <Stack direction="row" spacing={1}>
          {richtung === 'gesendet' && (
            <Button
              variant="outlined"
              color="secondary"
              disabled={!betreff || isEditorContentEmpty(inhalt)}
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
              disabled={!betreff || isEditorContentEmpty(inhalt) || !empfaenger?.email}
              onClick={handlePdfUndVersenden}
              title={!empfaenger?.email ? 'Kein Empfänger mit E-Mail-Adresse gewählt' : 'PDF herunterladen + Mail-Programm öffnen'}
            >
              PDF + versenden
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={!betreff || isEditorContentEmpty(inhalt) || saving}
            onClick={handleSave}
          >
            {saving ? 'Speichert...' : 'Speichern'}
          </Button>
        </Stack>
        )}
      </DialogActions>
    </Dialog>

    <Dialog
      fullScreen
      open={fokusEditorOpen}
      onClose={() => setFokusEditorOpen(false)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            bgcolor: theme.palette.mode === 'light' ? '#E7E6E6' : theme.palette.grey[900],
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            // Nur DialogContent scrollen — sonst scrollt das Paper (MUI default overflowY: auto) und der Inhalt wirkt „fest“
            overflow: 'hidden',
          }),
        },
      }}
    >
      <AppBar position="sticky" color="default" elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Brieftext — Fokusmodus
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {betreff ? betreff.slice(0, 80) + (betreff.length > 80 ? '…' : '') : '—'}
          </Typography>
          <Tooltip title="PDF-Vorschau">
            <span>
              <IconButton
                color="inherit"
                onClick={handlePdfVorschau}
                disabled={!betreff || isEditorContentEmpty(inhalt)}
                aria-label="PDF-Vorschau"
              >
                <PictureAsPdfIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Fokusmodus beenden (Esc)">
            <IconButton edge="end" color="inherit" onClick={() => setFokusEditorOpen(false)} aria-label="Fokusmodus schließen">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <DialogContent
        sx={(theme) => ({
          pt: 2,
          pb: 3,
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          bgcolor: theme.palette.mode === 'light' ? '#E7E6E6' : theme.palette.grey[900],
        })}
      >
        <SchriftverkehrEditor
          value={inhalt}
          onChange={setInhalt}
          minHeight="calc(100vh - 380px)"
          placeholder="Brieftext eingeben…"
          textBausteineZumEinfuegen={textBausteineZumEinfuegen}
          briefkopf={
            <FokusBriefkopfVorschau
              kanzlei={kanzlei}
              rechtsgebiet={fall.rechtsgebiet}
              datumIso={datum}
              aktenzeichen={fall.aktenzeichen}
              betreff={betreff}
              dokumentTypLabel={TYP_LABELS[typ]}
              empfaengerName={empfaenger?.name ?? '[keine Partei gewählt]'}
              empfaengerStrasse={empfaenger?.adresse?.strasse}
              empfaengerPlzOrt={
                empfaenger?.adresse ? `${empfaenger.adresse.plz} ${empfaenger.adresse.ort}` : undefined
              }
              empfaengerEmail={empfaenger?.email}
              parteiRolle={richtung === 'gesendet' ? 'Empfänger' : 'Absender'}
              antwortFristBis={richtung === 'gesendet' && frist ? fristStr : undefined}
              schadensnummerAnzeige={empfaenger?.schadensnummer?.trim() || 'unbekannt'}
              mandantName={mandant ? `${mandant.vorname} ${mandant.nachname}`.trim() : ''}
              kennzeichenFahrzeug={fall.verkehrsrecht?.fahrzeug?.kennzeichen}
              streitwertFormatiert={
                fall.zivilrecht?.streitwert != null
                  ? fall.zivilrecht.streitwert.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: 'EUR',
                    })
                  : undefined
              }
            />
          }
        />
      </DialogContent>
    </Dialog>

    {/* PDF-Vorschau Dialog */}
    <Dialog
      open={!!pdfPreviewUrl}
      onClose={closePdfVorschau}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: { width: '60vw', height: '92vh', maxWidth: '900px', display: 'flex', flexDirection: 'column' },
        },
      }}
    >
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar variant="dense" sx={{ gap: 1, minHeight: 44 }}>
          <PictureAsPdfIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            PDF-Vorschau
          </Typography>
          <Tooltip title="Schließen">
            <IconButton size="small" onClick={closePdfVorschau} aria-label="Vorschau schließen">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box sx={{ flex: '1 1 auto', minHeight: 0, bgcolor: 'grey.200' }}>
        {pdfPreviewUrl && (
          <iframe
            src={pdfPreviewUrl}
            title="PDF-Vorschau"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </Box>
    </Dialog>

    </>
  );
}
