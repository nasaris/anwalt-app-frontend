import { useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
  Skeleton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputAdornment,
  InputLabel,
  Avatar,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WorkIcon from '@mui/icons-material/Work';
import BalanceIcon from '@mui/icons-material/Balance';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import DeleteIcon from '@mui/icons-material/Delete';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import InboxIcon from '@mui/icons-material/Inbox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import { parteienApi, wiedervorlagenApi } from '../../api/parteien';
import { schriftverkehrApi } from '../../api/schriftverkehr';
import type {
  ArbeitsrechtDaten,
  Fall,
  FallParteiEintrag,
  Mandant,
  Partei,
  ParteienTyp,
  Schriftverkehr,
  VerkehrsrechtDaten,
  Wiedervorlage,
  WiedervorlageTyp,
} from '../../types';
import { buildFallaktivitaetTimeline, type FallaktivitaetZeile } from '../../utils/fallAktivitaetTimeline';
import PhaseTimeline from '../../components/PhaseTimeline/PhaseTimeline';
import FristBadge from '../../components/FristBadge/FristBadge';
import SchriftverkehrDialog from '../../components/SchriftverkehrDialog/SchriftverkehrDialog';
import MandantDialog from '../../components/MandantDialog/MandantDialog';
import ParteiDialog from '../../components/ParteiDialog/ParteiDialog';
import { useDokumenteStore, type DateiKategorie } from '../../store/dokumenteStore';
import type { UploadErwartung } from '../../store/aufgabenStore';
import { druckeBriefAlsPdf, erzeugeBriefPdfBlob } from '../../utils/briefDruck';
import { useKanzleiStore } from '../../store/kanzleiStore';
import { useAufgabenStore, type AufgabeRechtsgebiet } from '../../store/aufgabenStore';
import KennzeichenSchild from '../../components/KennzeichenSchild/KennzeichenSchild';
import { htmlToPlainText } from '../../utils/htmlToPlainText';
import { VR_ROLLE_LABEL, sammleVerkehrsParteiIds } from '../../utils/verkehrsParteienHelpers';

const FALLTYP_LABELS: Record<string, string> = {
  kuendigung: 'Kündigung',
  abmahnung: 'Abmahnung',
  aufhebung: 'Aufhebungsvertrag',
  lohn: 'Lohn-/Gehaltsforderung',
  mobbing: 'Mobbing / Versetzung',
  versetzung: 'Versetzung',
};

const STATUS_OPTIONEN = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'einigung', label: 'Einigung / Vergleich' },
  { value: 'klage', label: 'Klage erhoben' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
];


function uploadErwartungToDateiKategorie(u?: UploadErwartung): DateiKategorie {
  if (!u) return 'sonstiges';
  return u as DateiKategorie;
}


const AR_PARTEI_SLOT_DEFS = [
  { key: 'gegenseite', label: 'Gegenseite', typ: 'gegenseite' as const, idField: 'gegenseiteId' as const },
  { key: 'gericht', label: 'Gericht', typ: 'gericht' as const, idField: 'gerichtId' as const },
] as const;

/** Verkehrsrecht: nur diese Partei-Typen aus dem Stammdaten-Verzeichnis */
const VR_STAMM_PARTEI_TYPEN = ['versicherung', 'gutachter', 'werkstatt'] as const;
type VrStammParteiTyp = (typeof VR_STAMM_PARTEI_TYPEN)[number];
type VrStammParteiFilter = 'alle' | VrStammParteiTyp;
type FallAktivitaetFilter = 'alle' | 'notiz' | 'anruf' | 'phase_status' | 'wiedervorlage' | 'schriftverkehr' | 'upload' | 'pdf';

const FALL_AKTIVITAET_FILTER_LABEL: Record<FallAktivitaetFilter, string> = {
  alle: 'Alle',
  notiz: 'Notizen',
  anruf: 'Anrufe',
  phase_status: 'Phase/Status',
  wiedervorlage: 'Wiedervorlagen',
  schriftverkehr: 'Schriftverkehr',
  upload: 'Uploads',
  pdf: 'Dokumente',
};

function istVrStammParteiTyp(typ: ParteienTyp): typ is VrStammParteiTyp {
  return (VR_STAMM_PARTEI_TYPEN as readonly ParteienTyp[]).includes(typ);
}

function filterVonFallAktivitaet(z: FallaktivitaetZeile): FallAktivitaetFilter {
  if (z.quelle === 'schriftverkehr') return 'schriftverkehr';
  if (z.quelle === 'upload') return 'upload';
  if (z.quelle === 'pdf') return 'pdf';
  if (z.quelle === 'legacy_notiz') return 'notiz';
  if (z.gespeichertTyp === 'notiz') return 'notiz';
  if (z.gespeichertTyp === 'anruf') return 'anruf';
  if (z.gespeichertTyp === 'wiedervorlage') return 'wiedervorlage';
  if (z.gespeichertTyp === 'phase_geaendert' || z.gespeichertTyp === 'status_geaendert') return 'phase_status';
  return 'alle';
}

type VrParteiAustauschZiel =
  | { scope: 'vr-eintrag'; eintragId: string; label: string; aktuelleId: string; typ: ParteienTyp }
  | { scope: 'vr-neu'; rolle: ParteienTyp; label: string; typ: ParteienTyp; aktuelleId: '' }
  | { scope: 'ar'; key: string; label: string; aktuelleId: string; typ: ParteienTyp }
  | { scope: 'zr'; key: string; label: string; aktuelleId: string; typ: ParteienTyp };

function FallaktivitaetListenZeile({
  zeile: z,
  onVolltext,
  onBearbeiten,
  onLoeschen,
}: {
  zeile: FallaktivitaetZeile;
  onVolltext?: (zeile: FallaktivitaetZeile) => void;
  onBearbeiten?: (zeile: FallaktivitaetZeile) => void;
  onLoeschen?: (zeile: FallaktivitaetZeile) => void;
}) {
  let icon: ReactElement = <EditNoteIcon fontSize="small" />;
  if (z.quelle === 'schriftverkehr') icon = <MailOutlineIcon fontSize="small" />;
  else if (z.quelle === 'upload') icon = <FileUploadIcon fontSize="small" />;
  else if (z.quelle === 'pdf') icon = <PictureAsPdfIcon fontSize="small" />;
  else if (z.quelle === 'legacy_notiz') icon = <EditNoteIcon fontSize="small" />;
  else if (z.quelle === 'gespeichert') {
    switch (z.gespeichertTyp) {
      case 'anruf':
        icon = <PhoneIcon fontSize="small" />;
        break;
      case 'phase_geaendert':
        icon = <SwapHorizIcon fontSize="small" />;
        break;
      case 'status_geaendert':
        icon = <PublishedWithChangesIcon fontSize="small" />;
        break;
      case 'wiedervorlage':
        icon = <EventAvailableIcon fontSize="small" />;
        break;
      case 'notiz':
        icon = <EditNoteIcon fontSize="small" />;
        break;
      default:
        icon = <EditNoteIcon fontSize="small" />;
    }
  }

  const textNurImDialog =
    z.quelle === 'legacy_notiz' ||
    (z.quelle === 'gespeichert' && (z.gespeichertTyp === 'notiz' || z.gespeichertTyp === 'anruf'));
  const klickbar = Boolean(textNurImDialog && z.beschreibung?.trim() && onVolltext);

  const bearbeitenLoeschen =
    z.gespeichertAktivitaetId && onBearbeiten && onLoeschen ?
      (
        <Stack direction="row" alignItems="center" component="span">
          <Tooltip title="Bearbeiten">
            <IconButton
              edge="end"
              size="small"
              aria-label="Bearbeiten"
              onClick={(e) => {
                e.stopPropagation();
                onBearbeiten(z);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Löschen">
            <IconButton
              edge="end"
              size="small"
              aria-label="Löschen"
              onClick={(e) => {
                e.stopPropagation();
                onLoeschen(z);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    : undefined;

  const vorschauNotizAnrufSx = {
    pt: 0.25,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    wordBreak: 'break-word' as const,
  };

  const textSecondary = (
    <Stack component="span" spacing={0.5}>
      <Typography variant="caption" color="text.secondary" component="span">
        {new Date(z.zeitpunkt).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}
      </Typography>
      {!textNurImDialog && z.beschreibung ? (
        <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap', pt: 0.25 }} component="span">
          {z.beschreibung}
        </Typography>
      ) : null}
      {textNurImDialog && z.beschreibung?.trim() ? (
        <Typography variant="body2" color="text.secondary" component="span" sx={vorschauNotizAnrufSx}>
          {z.beschreibung.trim()}
        </Typography>
      ) : null}
    </Stack>
  );

  const body = (
    <>
      <Box sx={{ mr: 1.5, mt: 0.25, color: 'text.secondary' }}>{icon}</Box>
      <ListItemText
        primary={<Typography variant="body2" fontWeight={600}>{z.titel}</Typography>}
        secondary={textSecondary}
      />
    </>
  );

  if (klickbar) {
    return (
      <ListItem
        disablePadding
        secondaryAction={bearbeitenLoeschen}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <ListItemButton alignItems="flex-start" sx={{ py: 1.25 }} onClick={() => onVolltext?.(z)}>
          {body}
        </ListItemButton>
      </ListItem>
    );
  }

  return (
    <ListItem
      alignItems="flex-start"
      sx={{ py: 1.25, borderBottom: 1, borderColor: 'divider' }}
      secondaryAction={bearbeitenLoeschen}
    >
      {body}
    </ListItem>
  );
}

export default function FallDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const kanzlei = useKanzleiStore((s) => s.daten);
  const markiereBySchriftverkehrTyp = useAufgabenStore((s) => s.markiereBySchriftverkehrTyp);
  const addUploadedDateien = useDokumenteStore((s) => s.addUploadedDateien);
  const { getDokumenteByFall, deleteDokument, getUploadedDateienByFall, deleteUploadedDatei } = useDokumenteStore();
  /** Roh-Arrays aus dem Store — kein .filter() im Selector (sonst neue Referenz pro Snapshot → infinite loop mit useSyncExternalStore). */
  const uploadedDateienAll = useDokumenteStore((s) => s.uploadedDateien);
  const dokumenteAll = useDokumenteStore((s) => s.dokumente);
  const uploadsForFall = useMemo(
    () => (id ? uploadedDateienAll.filter((u) => u.fallId === id) : []),
    [id, uploadedDateienAll],
  );
  const dokumentePdfForFall = useMemo(
    () => (id ? dokumenteAll.filter((d) => d.fallId === id) : []),
    [id, dokumenteAll],
  );
  const [fall, setFall] = useState<Fall | null>(null);
  const [mandant, setMandant] = useState<Mandant | null>(null);
  const [weitereMandanten, setWeitereMandanten] = useState<Mandant[]>([]);
  const [wiedervorlagen, setWiedervorlagen] = useState<Wiedervorlage[]>([]);
  const [parteienMap, setParteienMap] = useState<Record<string, Partei>>({});
  const [alleParteien, setAlleParteien] = useState<Partei[]>([]);
  const [schriftverkehr, setSchriftverkehr] = useState<Schriftverkehr[]>([]);
  const [loading, setLoading] = useState(true);
  const getPhaseLabelStore = useAufgabenStore((s) => s.getPhaseLabel);
  const [aktivitaetDialog, setAktivitaetDialog] = useState<'notiz' | 'anruf' | null>(null);
  const [aktivitaetBetreff, setAktivitaetBetreff] = useState('');
  const [aktivitaetDraft, setAktivitaetDraft] = useState('');
  /** Nach Speichern einer Notiz aus der Phasen-Timeline: diese Aufgabe automatisch erledigen */
  const [timelineNotizErledigtAufgabeId, setTimelineNotizErledigtAufgabeId] = useState<string | null>(null);
  const [aktivitaetBearbeitenId, setAktivitaetBearbeitenId] = useState<string | null>(null);
  const [aktivitaetLoeschenDialog, setAktivitaetLoeschenDialog] = useState<{ id: string; titel: string } | null>(
    null,
  );
  const [aktivitaetLesen, setAktivitaetLesen] = useState<{ titel: string; text: string } | null>(null);
  const [fallAktivitaetSuche, setFallAktivitaetSuche] = useState('');
  const [fallAktivitaetFilter, setFallAktivitaetFilter] = useState<FallAktivitaetFilter>('alle');

  const phasenNummernFall = useAufgabenStore((s) =>
    fall?.rechtsgebiet ? s.phasenNummern[fall.rechtsgebiet as AufgabeRechtsgebiet] : undefined,
  );
  const phasenLabelFall = useAufgabenStore((s) =>
    fall?.rechtsgebiet ? s.phaseLabelOverrides[fall.rechtsgebiet as AufgabeRechtsgebiet] : undefined,
  );
  const maxPhaseNummer = useMemo(() => {
    const rg = fall?.rechtsgebiet as AufgabeRechtsgebiet | undefined;
    if (!rg) return 4;
    const nums = useAufgabenStore.getState().getPhasenNummern(rg);
    return nums[nums.length - 1] ?? 1;
  }, [fall?.rechtsgebiet, phasenNummernFall, phasenLabelFall]);

  // Dialog-States
  const [wvDialogOpen, setWvDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [svDialogOpen, setSvDialogOpen] = useState(false);
  const [svInitialTyp, setSvInitialTyp] = useState<string | undefined>();
  const [svInitialVorlageId, setSvInitialVorlageId] = useState<string | undefined>();
  const uploadKategorieRef = useRef<DateiKategorie>('sonstiges');
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [neuerStatus, setNeuerStatus] = useState('');
  const [mandantEditOpen, setMandantEditOpen] = useState(false);
  const [fallInfoDialogOpen, setFallInfoDialogOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<'akte' | 'uploads'>('uploads');
  const [mandantSidebarOpen, setMandantSidebarOpen] = useState(false);
  /** Pro Partei-ID: nur bei explizit `true` ausgeklappt */
  const [parteiBlockOpen, setParteiBlockOpen] = useState<Record<string, boolean>>({});
  const [parteiZumEditieren, setParteiZumEditieren] = useState<Partei | null>(null);
  const [parteiZumAustauschen, setParteiZumAustauschen] = useState<VrParteiAustauschZiel | null>(null);
  const [parteiAustauschNeu, setParteiAustauschNeu] = useState<string>('');
  const [parteiAustauschSuche, setParteiAustauschSuche] = useState<string>('');
  /** Neue Partei anlegen und direkt dieser Rolle am Fall zuweisen */
  const [neueParteiSlot, setNeueParteiSlot] = useState<
    | { context: 'vr'; rolle: ParteienTyp }
    | { context: 'ar'; key: string; typ: ParteienTyp }
    | null
  >(null);
  const [weitererMandantDialogOpen, setWeitererMandantDialogOpen] = useState(false);
  const [mandantenWeiterePicker, setMandantenWeiterePicker] = useState<Mandant[]>([]);
  const [weitererMandantSuche, setWeitererMandantSuche] = useState('');
  const [vrParteiHinzufuegenOpen, setVrParteiHinzufuegenOpen] = useState(false);
  const [vrParteiHinzufuegenSuche, setVrParteiHinzufuegenSuche] = useState('');
  const [vrParteiStammFilter, setVrParteiStammFilter] = useState<VrStammParteiFilter>('alle');

  useEffect(() => {
    if (!id) return;
    faelleApi.getById(id).then(async (f) => {
      setFall(f);
      setNeuerStatus(f.status);
      const [m, w] = await Promise.all([
        mandantenApi.getById(f.mandantId),
        wiedervorlagenApi.getAll({ fallId: f.id, nurOffene: true }),
      ]);
      setMandant(m);
      setWiedervorlagen(w);

      // Parteien laden
      const ids = [
        ...sammleVerkehrsParteiIds(f.verkehrsrecht),
        f.arbeitsrecht?.gegenseiteId,
        f.arbeitsrecht?.gerichtId,
      ].filter(Boolean) as string[];
      const [allParteien, sv] = await Promise.all([
        parteienApi.getAll(),
        schriftverkehrApi.getByFall(f.id),
      ]);
      setAlleParteien(allParteien);
      setSchriftverkehr(sv);
      if (ids.length > 0) {
        const map: Record<string, Partei> = {};
        allParteien.filter((p) => ids.includes(p.id)).forEach((p) => { map[p.id] = p; });
        setParteienMap(map);
      }

      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    const ids = fall?.weitereMandantenIds;
    if (!ids?.length) {
      setWeitereMandanten([]);
      return;
    }
    let cancel = false;
    Promise.all(ids.map((mid) => mandantenApi.getById(mid)))
      .then((list) => {
        if (!cancel) setWeitereMandanten(list);
      })
      .catch(() => {
        if (!cancel) setWeitereMandanten([]);
      });
    return () => {
      cancel = true;
    };
  }, [fall?.weitereMandantenIds]);

  const fallAktivitaetZeilen = useMemo(() => {
    if (!fall) return [];
    return buildFallaktivitaetTimeline({
      fall,
      schriftverkehr,
      uploads: uploadsForFall,
      dokumentePdf: dokumentePdfForFall,
      getPhaseLabel: (rg, nummer) => getPhaseLabelStore(rg as AufgabeRechtsgebiet, nummer),
    });
  }, [fall, schriftverkehr, uploadsForFall, dokumentePdfForFall, getPhaseLabelStore]);

  const fallAktivitaetZeilenGefiltert = useMemo(() => {
    const listByTyp = fallAktivitaetFilter === 'alle'
      ? fallAktivitaetZeilen
      : fallAktivitaetZeilen.filter((z) => filterVonFallAktivitaet(z) === fallAktivitaetFilter);
    const q = fallAktivitaetSuche.trim().toLowerCase();
    if (!q) return listByTyp;
    return listByTyp.filter((z) => {
      const datumStr = new Date(z.zeitpunkt)
        .toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
        .toLowerCase();
      const haystack = `${z.titel} ${z.beschreibung ?? ''} ${datumStr}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [fallAktivitaetZeilen, fallAktivitaetSuche, fallAktivitaetFilter]);

  const beteiligteAmFall = useMemo(() => {
    if (!fall) return [] as { key: string; label: string; partei: Partei }[];
    const rows: { key: string; label: string; partei: Partei }[] = [];
    const vr = fall.verkehrsrecht;
    const ar = fall.arbeitsrecht;
    if (vr?.beteiligteParteien?.length) {
      for (const e of vr.beteiligteParteien as FallParteiEintrag[]) {
        const p = parteienMap[e.parteiId];
        if (p) {
          const rl = e.rolle;
          rows.push({
            key: e.eintragId,
            label: VR_ROLLE_LABEL[rl] ?? rl,
            partei: p,
          });
        }
      }
    } else if (vr) {
      if (vr.versicherungId && parteienMap[vr.versicherungId]) {
      rows.push({ key: 'versicherung', label: 'Versicherung', partei: parteienMap[vr.versicherungId] });
    }
      if (vr.gutachterId && parteienMap[vr.gutachterId]) {
      rows.push({ key: 'gutachter', label: 'Gutachter / Sachverständiger', partei: parteienMap[vr.gutachterId] });
    }
      if (vr.werkstattId && parteienMap[vr.werkstattId]) {
      rows.push({ key: 'werkstatt', label: 'Werkstatt', partei: parteienMap[vr.werkstattId] });
      }
    }
    if (ar?.gegenseiteId && parteienMap[ar.gegenseiteId]) {
      rows.push({ key: 'gegenseite', label: 'Gegenseite', partei: parteienMap[ar.gegenseiteId] });
    }
    if (ar?.gerichtId && parteienMap[ar.gerichtId]) {
      rows.push({ key: 'gericht', label: 'Gericht', partei: parteienMap[ar.gerichtId] });
    }
    return rows;
  }, [fall, parteienMap]);

  const vrBeteiligteZeilen = useMemo(() => {
    if (!fall || fall.rechtsgebiet !== 'verkehrsrecht') return [];
    const vr = fall.verkehrsrecht;
    if (!vr) return [];
    const entries = vr.beteiligteParteien ?? [];
    return entries.map((e: FallParteiEintrag) => {
      const rl = e.rolle;
      return {
      eintragId: e.eintragId,
      rolle: rl,
      label: VR_ROLLE_LABEL[rl] ?? rl,
      partei: parteienMap[e.parteiId] ?? null,
      rawId: e.parteiId,
    };
    });
  }, [fall, parteienMap]);

  /** Gleiche Rolle (z. B. zwei Gutachter) unter einem gemeinsamen Bereichstitel */
  const vrBeteiligteNachRolle = useMemo(() => {
    type Zeile = (typeof vrBeteiligteZeilen)[number];
    const reihenfolge: ParteienTyp[] = [];
    const gruppen = new Map<ParteienTyp, Zeile[]>();
    for (const row of vrBeteiligteZeilen) {
      const r = row.rolle;
      if (!gruppen.has(r)) {
        reihenfolge.push(r);
        gruppen.set(r, []);
      }
      gruppen.get(r)!.push(row);
    }
    return reihenfolge.map((rolle) => ({
      rolle,
      sectionLabel: VR_ROLLE_LABEL[rolle] ?? rolle,
      zeilen: gruppen.get(rolle)!,
    }));
  }, [vrBeteiligteZeilen]);

  const arbeitsParteiSlots = useMemo(() => {
    if (!fall || fall.rechtsgebiet !== 'arbeitsrecht') return [];
    const ar: Partial<ArbeitsrechtDaten> = fall.arbeitsrecht ?? {};
    return AR_PARTEI_SLOT_DEFS.map((def) => {
      const rawId = ar[def.idField] as string | undefined;
      const partei = rawId ? parteienMap[rawId] ?? null : null;
      return { ...def, rawId, partei };
    });
  }, [fall, parteienMap]);

  const handleNeueParteiGespeichert = async (p: Partei) => {
    const meta = neueParteiSlot;
    setNeueParteiSlot(null);
    setAlleParteien((prev) =>
      prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p],
    );
    setParteienMap((prev) => ({ ...prev, [p.id]: p }));
    if (!fall || !meta) return;
    try {
      if (meta.context === 'vr') {
        if (!fall.verkehrsrecht) return;
        const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
        const bp = [...(vr.beteiligteParteien ?? [])];
        bp.push({
          eintragId: crypto.randomUUID(),
          rolle: meta.rolle,
          parteiId: p.id,
        });
        vr.beteiligteParteien = bp;
        const updated = await faelleApi.update(fall.id, { verkehrsrecht: vr });
        setFall(updated);
      } else {
        if (!fall.arbeitsrecht) return;
        const ar: ArbeitsrechtDaten = { ...fall.arbeitsrecht };
        if (meta.key === 'gegenseite') ar.gegenseiteId = p.id;
        else ar.gerichtId = p.id;
        const updated = await faelleApi.update(fall.id, { arbeitsrecht: ar });
        setFall(updated);
      }
    } catch {
      /* bleibt ohne Zuweisung */
    }
  };

  const handleParteiAustauschen = async () => {
    if (!fall || !parteiZumAustauschen || !parteiAustauschNeu) return;
    const t = parteiZumAustauschen;
    let updatePayload: Partial<Fall>;
    if (t.scope === 'vr-eintrag') {
      if (!fall.verkehrsrecht) return;
      const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
      const bp = [...(vr.beteiligteParteien ?? [])];
      const i = bp.findIndex((e) => e.eintragId === t.eintragId);
      if (i < 0) return;
      bp[i] = { ...bp[i], parteiId: parteiAustauschNeu };
      vr.beteiligteParteien = bp;
      updatePayload = { verkehrsrecht: vr };
    } else if (t.scope === 'vr-neu') {
      if (!fall.verkehrsrecht) return;
      const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
      const bp = [...(vr.beteiligteParteien ?? [])];
      bp.push({
        eintragId: crypto.randomUUID(),
        rolle: t.rolle,
        parteiId: parteiAustauschNeu,
      });
      vr.beteiligteParteien = bp;
      updatePayload = { verkehrsrecht: vr };
    } else if (t.scope === 'ar') {
      if (!fall.arbeitsrecht) return;
      const base = { ...fall.arbeitsrecht };
      if (t.key === 'gegenseite') {
        updatePayload = { arbeitsrecht: { ...base, gegenseiteId: parteiAustauschNeu } };
      } else if (t.key === 'gericht') {
        updatePayload = { arbeitsrecht: { ...base, gerichtId: parteiAustauschNeu } };
      } else return;
    } else if (t.scope === 'zr') {
      if (!fall.zivilrecht) return;
      const base = { ...fall.zivilrecht };
      if (t.key === 'gegenseite') {
        updatePayload = { zivilrecht: { ...base, gegenseiteId: parteiAustauschNeu } };
      } else if (t.key === 'gericht') {
        updatePayload = { zivilrecht: { ...base, gerichtId: parteiAustauschNeu } };
      } else return;
    } else return;
    const updated = await faelleApi.update(fall.id, updatePayload);
    setFall(updated);
    const neuePartei = alleParteien.find((p) => p.id === parteiAustauschNeu);
    if (neuePartei) {
      setParteienMap((prev) => ({ ...prev, [neuePartei.id]: neuePartei }));
    }
    setParteiZumAustauschen(null);
    setParteiAustauschNeu('');
    setParteiAustauschSuche('');
  };

  const handleVrEintragEntfernen = async (eintragId: string) => {
    if (!fall?.verkehrsrecht) return;
    const vr = { ...fall.verkehrsrecht };
    vr.beteiligteParteien = (vr.beteiligteParteien ?? []).filter((e) => e.eintragId !== eintragId);
    const updated = await faelleApi.update(fall.id, { verkehrsrecht: vr });
    setFall(updated);
  };

  const handleWeiterenMandantHinzufuegen = async (mandantId: string) => {
    if (!fall) return;
    const cur = [...(fall.weitereMandantenIds ?? [])];
    if (cur.includes(mandantId) || mandantId === fall.mandantId) return;
    const updated = await faelleApi.update(fall.id, { weitereMandantenIds: [...cur, mandantId] });
    setFall(updated);
    setWeitererMandantDialogOpen(false);
  };

  const handleWeiterenMandantEntfernen = async (mandantId: string) => {
    if (!fall) return;
    const updated = await faelleApi.update(fall.id, {
      weitereMandantenIds: (fall.weitereMandantenIds ?? []).filter((x) => x !== mandantId),
    });
    setFall(updated);
  };

  const openWeitererMandantDialog = async () => {
    setWeitererMandantDialogOpen(true);
    setWeitererMandantSuche('');
    try {
      setMandantenWeiterePicker(await mandantenApi.getAll());
    } catch {
      setMandantenWeiterePicker([]);
    }
  };

  const vrStammParteienGezeigt = useMemo(() => {
    const q = vrParteiHinzufuegenSuche.trim().toLowerCase();
    return alleParteien.filter((p) => {
      if (!istVrStammParteiTyp(p.typ)) return false;
      if (vrParteiStammFilter !== 'alle' && p.typ !== vrParteiStammFilter) return false;
      if (!q) return true;
      const ort = p.adresse ? `${p.adresse.plz} ${p.adresse.ort}` : '';
      return (
        p.name.toLowerCase().includes(q) ||
        (p.email ?? '').toLowerCase().includes(q) ||
        ort.toLowerCase().includes(q)
      );
    });
  }, [alleParteien, vrParteiStammFilter, vrParteiHinzufuegenSuche]);

  const handleVrParteiAusStammZuordnen = async (partei: Partei) => {
    if (!fall?.verkehrsrecht || !istVrStammParteiTyp(partei.typ)) return;
    const rolle: VrStammParteiTyp =
      vrParteiStammFilter === 'alle' ? partei.typ : vrParteiStammFilter;

    const vr: VerkehrsrechtDaten = { ...fall.verkehrsrecht };
    const bp = [...(vr.beteiligteParteien ?? [])];
    bp.push({
      eintragId: crypto.randomUUID(),
      rolle,
      parteiId: partei.id,
    });
    vr.beteiligteParteien = bp;
    try {
      const updated = await faelleApi.update(fall.id, { verkehrsrecht: vr });
      setFall(updated);
      setParteienMap((prev) => ({ ...prev, [partei.id]: partei }));
      setVrParteiHinzufuegenOpen(false);
      setVrParteiHinzufuegenSuche('');
      setVrParteiStammFilter('alle');
    } catch {
      /* keine Zuweisung */
    }
  };

  const handlePhaseVor = async () => {
    if (!fall) return;
    const nums = useAufgabenStore.getState().getPhasenNummern(fall.rechtsgebiet as AufgabeRechtsgebiet);
    const maxP = nums[nums.length - 1] ?? 1;
    if (fall.phase >= maxP) return;
    const von = fall.phase;
    const updated = await faelleApi.update(fall.id, { phase: (fall.phase + 1) as Fall['phase'] });
    const withAct = await faelleApi.addAktivitaet(updated.id, {
      typ: 'phase_geaendert',
      titel: 'Phase geändert',
      meta: { von, nach: updated.phase },
    });
    setFall(withAct);
  };

  const handlePhaseZurueck = async () => {
    if (!fall || fall.phase <= 1) return;
    const von = fall.phase;
    const updated = await faelleApi.update(fall.id, { phase: (fall.phase - 1) as Fall['phase'] });
    const withAct = await faelleApi.addAktivitaet(updated.id, {
      typ: 'phase_geaendert',
      titel: 'Phase geändert',
      meta: { von, nach: updated.phase },
    });
    setFall(withAct);
  };

  const handleStatusAendern = async () => {
    if (!fall || !neuerStatus) return;
    const alt = fall.status;
    const updated = await faelleApi.update(fall.id, { status: neuerStatus as Fall['status'] });
    const withAct = await faelleApi.addAktivitaet(updated.id, {
      typ: 'status_geaendert',
      titel: 'Status geändert',
      meta: { alt, neu: neuerStatus },
    });
    setFall(withAct);
    setStatusDialogOpen(false);
  };

  const handleWvErledigen = async (wvId: string) => {
    await wiedervorlagenApi.erledigen(wvId);
    setWiedervorlagen((prev) => prev.filter((w) => w.id !== wvId));
  };

  const handleSvDelete = async (svId: string) => {
    await schriftverkehrApi.delete(svId);
    setSchriftverkehr((prev) => prev.filter((s) => s.id !== svId));
  };

  const handleAktivitaetSpeichern = async () => {
    if (!fall || !aktivitaetDialog || !aktivitaetBetreff.trim() || !aktivitaetDraft.trim()) return;

    if (aktivitaetBearbeitenId) {
      const updated = await faelleApi.updateAktivitaet(fall.id, aktivitaetBearbeitenId, {
        titel: aktivitaetBetreff.trim(),
        beschreibung: aktivitaetDraft.trim(),
      });
    setFall(updated);
      setAktivitaetDraft('');
      setAktivitaetBetreff('');
      setAktivitaetDialog(null);
      setAktivitaetBearbeitenId(null);
      setTimelineNotizErledigtAufgabeId(null);
      return;
    }

    const pendingTimelineAufgabeId = timelineNotizErledigtAufgabeId;
    const updated = await faelleApi.addAktivitaet(fall.id, {
      typ: aktivitaetDialog === 'anruf' ? 'anruf' : 'notiz',
      titel: aktivitaetBetreff.trim(),
      beschreibung: aktivitaetDraft.trim(),
    });
    setFall(updated);
    setAktivitaetDraft('');
    setAktivitaetBetreff('');
    setAktivitaetDialog(null);
    setTimelineNotizErledigtAufgabeId(null);
    if (pendingTimelineAufgabeId && aktivitaetDialog === 'notiz') {
      useAufgabenStore.getState().markiereAufgabeErledigt(fall.id, pendingTimelineAufgabeId);
    }
  };

  const handleAktivitaetBearbeitenAusListe = (z: FallaktivitaetZeile) => {
    if (!fall || !z.gespeichertAktivitaetId) return;
    const a = fall.aktivitaeten?.find((x) => x.id === z.gespeichertAktivitaetId);
    if (!a || (a.typ !== 'notiz' && a.typ !== 'anruf')) return;
    setTimelineNotizErledigtAufgabeId(null);
    setAktivitaetBearbeitenId(a.id);
    setAktivitaetBetreff(a.titel);
    setAktivitaetDraft(a.beschreibung ?? '');
    setAktivitaetDialog(a.typ === 'anruf' ? 'anruf' : 'notiz');
  };

  const handleAktivitaetLoeschenAusListe = (z: FallaktivitaetZeile) => {
    if (!z.gespeichertAktivitaetId) return;
    setAktivitaetLoeschenDialog({ id: z.gespeichertAktivitaetId, titel: z.titel });
  };

  const handleAktivitaetLoeschenBestaetigt = async () => {
    if (!fall || !aktivitaetLoeschenDialog) return;
    try {
      const updated = await faelleApi.deleteAktivitaet(fall.id, aktivitaetLoeschenDialog.id);
      setFall(updated);
    } finally {
      setAktivitaetLoeschenDialog(null);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (!fall) return <Alert severity="error">Fall nicht gefunden.</Alert>;

  const isVR = fall.rechtsgebiet === 'verkehrsrecht';

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/faelle')}>
          Fälle
        </Link>
        <Typography variant="body2" color="text.primary">{fall.aktenzeichen}</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            {isVR ? <DirectionsCarIcon color="info" /> : <WorkIcon color="secondary" />}
            <Typography variant="h5" fontWeight={700}>{fall.aktenzeichen}</Typography>
            <Chip label={isVR ? 'Verkehrsrecht' : 'Arbeitsrecht'} color={isVR ? 'info' : 'secondary'} size="small" />
            <Chip label={fall.status} color={fall.status === 'aktiv' ? 'primary' : 'default'} size="small" variant="outlined" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Angelegt am {new Date(fall.erstelltAm).toLocaleDateString('de-DE')}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={() => setStatusDialogOpen(true)}>
            Status ändern
          </Button>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/faelle')} variant="outlined">
            Zurück
          </Button>
        </Stack>
      </Stack>

      {/* KSchG-Warnung */}
      {fall.arbeitsrecht?.fristEnde && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>§ 4 KSchG — Klagefrist:</strong>{' '}
          <FristBadge fristEnde={fall.arbeitsrecht.fristEnde} />
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Phasen-Timeline + Weiterschalten */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <PhaseTimeline rechtsgebiet={fall.rechtsgebiet} aktuellePhase={fall.phase} vertikal={false} />
          </Paper>
        </Grid>

        {/* Combined: Fallinformationen + Wiedervorlagen */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={3}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoOutlinedIcon fontSize="small" color="action" />
                <Typography variant="h6" fontWeight={600}>Fallinformationen</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Alle Details anzeigen">
                  <IconButton size="small" onClick={() => setFallInfoDialogOpen(true)}>
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setStatusDialogOpen(true)}>
                  Bearbeiten
                </Button>
              </Stack>
            </Stack>

            <Box sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' }, pr: { xs: 0, md: 0.5 } }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Aktenzeichen
                </Typography>
                <Typography variant="body1" fontWeight={700} mt={0.5}>{fall.aktenzeichen}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Rechtsgebiet
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} mt={0.5}>
                  {fall.rechtsgebiet === 'verkehrsrecht'
                    ? <DirectionsCarIcon fontSize="small" color="info" />
                    : fall.rechtsgebiet === 'arbeitsrecht'
                      ? <WorkIcon fontSize="small" color="secondary" />
                      : <BalanceIcon fontSize="small" color="success" />}
                  <Typography variant="body1" fontWeight={700}>
                    {fall.rechtsgebiet === 'verkehrsrecht' ? 'Verkehrsrecht' : fall.rechtsgebiet === 'arbeitsrecht' ? 'Arbeitsrecht' : 'Zivilrecht'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Datum Eröffnung
                </Typography>
                <Typography variant="body1" fontWeight={700} mt={0.5}>
                  {new Date(fall.erstelltAm).toLocaleDateString('de-DE')}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" fontWeight={700} sx={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}>
                  Wiedervorlagen &amp; Fristen
                </Typography>
              </Stack>
              <Tooltip title="Wiedervorlage hinzufügen">
                <IconButton size="small" onClick={() => setWvDialogOpen(true)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            {wiedervorlagen.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Keine offenen Wiedervorlagen</Typography>
            ) : (
              <Stack spacing={1}>
                {wiedervorlagen.map((w) => {
                  const daysLeft = Math.ceil((new Date(w.faelligAm).getTime() - Date.now()) / 86400000);
                  const chipColor = w.erledigt ? 'success' : daysLeft < 0 ? 'error' : daysLeft <= 3 ? 'warning' : 'info';
                  const chipLabel = w.erledigt ? 'ERLEDIGT' : daysLeft < 0 ? `${Math.abs(daysLeft)} TAGE ÜBERFÄLLIG` : `NOCH ${daysLeft} TAGE`;
                  return (
                    <Stack
                      key={w.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ py: 0.75, px: 1.5, borderRadius: '12px', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        {w.erledigt
                          ? <CheckCircleIcon fontSize="small" color="success" />
                          : <ScheduleIcon fontSize="small" color={daysLeft < 0 ? 'error' : daysLeft <= 3 ? 'warning' : 'action'} />}
                        <Box>
                          <Typography variant="body2" fontWeight={500}>{w.beschreibung}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Fällig: {new Date(w.faelligAm).toLocaleDateString('de-DE')}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Chip
                          label={chipLabel}
                          color={chipColor as any}
                          size="small"
                          sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em' }}
                        />
                        {!w.erledigt && (
                          <Tooltip title="Als erledigt markieren">
                            <IconButton size="small" color="success" onClick={() => handleWvErledigen(w.id)}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            )}
            </Box>
          </Paper>

        {/* Dokumente + Hochgeladene Unterlagen — kombiniert */}
        {(() => {
          const docs = getDokumenteByFall(fall.id);
          const uploads = getUploadedDateienByFall(fall.id);
          const formatBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
          const formatDate = (d: string) =>
            new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

          return (
              <Paper elevation={1} sx={{ p: 2.5, maxHeight: { xs: 'none', md: 280 }, display: 'flex', flexDirection: 'column' }}>
                {/* Tab-Leiste */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
                  <Box sx={{ display: 'inline-flex', bgcolor: 'action.hover', borderRadius: '999px', p: 0.5 }}>
                    <Button
                      onClick={() => setDocsTab('uploads')}
                      size="small"
                      sx={{
                        borderRadius: '999px',
                        bgcolor: docsTab === 'uploads' ? 'background.paper' : 'transparent',
                        color: docsTab === 'uploads' ? 'text.primary' : 'text.secondary',
                        fontWeight: docsTab === 'uploads' ? 700 : 500,
                        boxShadow: docsTab === 'uploads' ? 1 : 0,
                        px: 2, py: 0.75, minHeight: 'auto',
                        '&:hover': { bgcolor: docsTab === 'uploads' ? 'background.paper' : 'action.selected' },
                      }}
                    >
                      Hochgeladene Unterlagen
                    </Button>
                    <Button
                      onClick={() => setDocsTab('akte')}
                      size="small"
                      sx={{
                        borderRadius: '999px',
                        bgcolor: docsTab === 'akte' ? 'background.paper' : 'transparent',
                        color: docsTab === 'akte' ? 'text.primary' : 'text.secondary',
                        fontWeight: docsTab === 'akte' ? 700 : 500,
                        boxShadow: docsTab === 'akte' ? 1 : 0,
                        px: 2, py: 0.75, minHeight: 'auto',
                        '&:hover': { bgcolor: docsTab === 'akte' ? 'background.paper' : 'action.selected' },
                      }}
                    >
                      Dokumente (Akte)
                    </Button>
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Suchen">
                      <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <SearchIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Datei hochladen">
                      <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <FileUploadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                <Box sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' }, pr: { xs: 0, md: 0.5 } }}>
                {/* Tab: Dokumente (Akte) */}
                {docsTab === 'akte' && (
                  docs.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Noch keine Dokumente erstellt. PDF über „Schreiben erfassen → PDF erstellen" erzeugen.
                    </Typography>
                  ) : (
                    <Stack divider={<Divider />}>
                      {docs.map((dok) => (
                        <Stack
                          key={dok.id}
                          direction="row"
                          alignItems="center"
                          spacing={2}
                          sx={{ py: 1.5, '&:hover .doc-actions': { opacity: 1 } }}
                        >
                          <PictureAsPdfIcon sx={{ color: '#C62828', fontSize: 28, flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={700} sx={{ flex: 1, wordBreak: 'break-word' }}>
                            {dok.dateiname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: 'right', flexShrink: 0 }}>
                            PDF
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right', flexShrink: 0 }}>
                            {formatDate(dok.datum)}
                          </Typography>
                          <Stack direction="row" spacing={0.25} className="doc-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                            <Tooltip title="PDF herunterladen">
                              <IconButton size="small" onClick={() => druckeBriefAlsPdf(dok.briefDaten, kanzlei)}>
                                <PictureAsPdfIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {dok.empfaengerEmail && (
                              <Tooltip title={`E-Mail an ${dok.empfaengerEmail}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const { blob, dateiname } = erzeugeBriefPdfBlob(dok.briefDaten, kanzlei);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url; a.download = dateiname; a.click();
                                    URL.revokeObjectURL(url);
                                    const mailBody = `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser Schreiben vom ${new Date(dok.datum).toLocaleDateString('de-DE')} in der Angelegenheit:\n${dok.betreff}\n\nBitte beachten Sie den beigefügten PDF-Anhang.\n\nMit freundlichen Grüßen\n${kanzlei.anwaltName}\n${kanzlei.kanzleiName}`;
                                    window.location.href = `mailto:${dok.empfaengerEmail}?subject=${encodeURIComponent(dok.betreff)}&body=${encodeURIComponent(mailBody)}`;
                                  }}
                                >
                                  <MailOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Aus Akte entfernen">
                              <IconButton size="small" color="error" onClick={() => deleteDokument(dok.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  )
                )}

                {/* Tab: Hochgeladene Unterlagen */}
                {docsTab === 'uploads' && (
                  uploads.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Keine hochgeladenen Dateien vorhanden.
                    </Typography>
                  ) : (
                    <Stack divider={<Divider />}>
                      {uploads.map((u) => {
                        const isPdf = u.dateiname.toLowerCase().endsWith('.pdf') || u.dateityp === 'application/pdf';
                        return (
                          <Stack
                            key={u.id}
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{ py: 1.5, '&:hover .doc-actions': { opacity: 1 } }}
                          >
                            {isPdf
                              ? <PictureAsPdfIcon sx={{ color: '#C62828', fontSize: 28, flexShrink: 0 }} />
                              : <InsertDriveFileIcon sx={{ color: 'text.secondary', fontSize: 28, flexShrink: 0 }} />}
                            <Typography variant="body2" fontWeight={700} sx={{ flex: 1, wordBreak: 'break-word' }}>
                              {u.dateiname}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: 'right', flexShrink: 0 }}>
                              {formatBytes(u.groesse)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, textAlign: 'right', flexShrink: 0 }}>
                              {formatDate(u.hochgeladenAm)}
                            </Typography>
                            <Stack direction="row" spacing={0.25} className="doc-actions" sx={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                              <Tooltip title="Entfernen">
                                <IconButton size="small" color="error" onClick={() => deleteUploadedDatei(u.id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )
                )}
                </Box>
              </Paper>
            );
        })()}

          </Stack>
        </Grid>

        {/* Rechte Spalte: Mandant + Beteiligte Parteien */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={1} sx={{ p: 2.5, maxHeight: { xs: 'none', md: 460 }, overflowY: { xs: 'visible', md: 'auto' } }}>
            {/* MANDANT */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Typography variant="overline" display="block">
                Mandant
              </Typography>
              {mandant && (
                <Tooltip title={mandantSidebarOpen ? 'Einklappen' : 'Ausklappen'}>
                  <IconButton
                    size="small"
                    onClick={() => setMandantSidebarOpen((o) => !o)}
                    aria-expanded={mandantSidebarOpen}
                    aria-label={mandantSidebarOpen ? 'Mandant einklappen' : 'Mandant ausklappen'}
                  >
                    {mandantSidebarOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Stack>

            {mandant ? (
              <>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: mandantSidebarOpen ? 2 : 0 }}>
                  <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}>
                    {mandant.vorname[0]}{mandant.nachname[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                      {mandant.kategorie === 'unternehmen' ? mandant.nachname : `${mandant.vorname} ${mandant.nachname}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mandant.kategorie === 'unternehmen' ? 'Unternehmen' : 'Privatperson'}
                    </Typography>
                  </Box>
                </Stack>

                <Collapse in={mandantSidebarOpen}>
                  <Stack spacing={1.25} mb={2}>
                    {mandant.telefon && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{mandant.telefon}</Typography>
                      </Stack>
                    )}
                    {mandant.email && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2">{mandant.email}</Typography>
                      </Stack>
                    )}
                    {mandant.adresse && (
                      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                        <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                        <Typography variant="body2">
                          {mandant.adresse.strasse}, {mandant.adresse.plz} {mandant.adresse.ort}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => setMandantEditOpen(true)}>
                      Bearbeiten
                    </Button>
                    <Button size="small" onClick={() => navigate(`/mandanten/${mandant.id}`)}>
                      Details
                    </Button>
                  </Stack>
                </Collapse>
              </>
            ) : (
              <Typography color="text.secondary">Mandant nicht gefunden</Typography>
            )}

            {mandant && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: weitereMandanten.length ? 2 : 0 }}>
                  <Typography variant="overline" display="block">
                    Weitere Mandanten
                  </Typography>
                  <Tooltip title="Weiteren Mandanten zuordnen">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="Weiteren Mandanten zuordnen"
                      onClick={() => void openWeitererMandantDialog()}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack spacing={2} sx={{ mb: 2.5 }}>
                  {weitereMandanten.map((wm) => (
                    <Stack key={wm.id} direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                        <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}>
                          {(wm.vorname?.[0] ?? '').toUpperCase()}
                          {(wm.nachname?.[0] ?? '').toUpperCase()}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                            {wm.kategorie === 'unternehmen' ? wm.nachname : `${wm.vorname} ${wm.nachname}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {wm.kategorie === 'unternehmen' ? 'Unternehmen' : 'Privatperson'}
                          </Typography>
                        </Box>
                      </Stack>
                      <Tooltip title="Zuordnung zum Fall entfernen">
                        <IconButton
                          size="small"
                          aria-label="Weiteren Mandanten vom Fall lösen"
                          onClick={() => void handleWeiterenMandantEntfernen(wm.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}

            {/* BETEILIGTE PARTEIEN — Verkehrsrecht (mehrere Einträge pro Rolle möglich) */}
            {isVR && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="overline" display="block" mb={2}>
                  Beteiligte Parteien
                </Typography>
                <Stack spacing={3}>
                  {vrBeteiligteNachRolle.map((gruppe) => (
                    <Box key={gruppe.rolle}>
                      <Typography variant="overline" display="block" sx={{ mb: 1.25, letterSpacing: '0.12em' }}>
                        {gruppe.sectionLabel}
                      </Typography>
                      <Stack spacing={2}>
                        {gruppe.zeilen.map((row) => {
                          const { eintragId, label, partei, rawId, rolle } = row;
                          const blockId = partei?.id ?? `bp-${eintragId}`;
                          const expanded = parteiBlockOpen[blockId] === true;
                          if (partei) {
                            return (
                              <Box key={`vr-${eintragId}-${partei.id}`}>
                                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: expanded ? 1 : 0 }}>
                                  <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                                    <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}>
                                      {parteiInitialen(partei)}
                                    </Avatar>
                                    <Box minWidth={0}>
                                      <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                                        {partei.name}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Stack direction="row" alignItems="center">
                                    <Tooltip title={expanded ? 'Einklappen' : 'Ausklappen'}>
                                      <IconButton
                                        size="small"
                                        onClick={() => {
                                          setParteiBlockOpen((prev) => {
                                            const cur = prev[blockId] === true;
                                            return { ...prev, [blockId]: !cur };
                                          });
                                        }}
                                        aria-expanded={expanded}
                                        aria-label={
                                          expanded ?
                                            `${gruppe.sectionLabel}: ${partei.name} einklappen`
                                          : `${gruppe.sectionLabel}: ${partei.name} ausklappen`
                                        }
                                      >
                                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Aus Fall entfernen">
                                      <IconButton
                                        size="small"
                                        aria-label={`${partei.name} aus diesem Fall entfernen`}
                                        onClick={() => void handleVrEintragEntfernen(eintragId)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Stack>
                                <Collapse in={expanded}>
                                  <Stack spacing={1.25} mb={2}>
                                    {partei.schadensnummer && (
                                      <Typography variant="body2" color="text.secondary">
                                        Ref: {partei.schadensnummer}
                                      </Typography>
                                    )}
                                    {partei.gutachterNr && (
                                      <Typography variant="body2" color="text.secondary">
                                        Nr: {partei.gutachterNr}
                                      </Typography>
                                    )}
                                    {partei.telefon && (
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <PhoneIcon fontSize="small" color="action" />
                                        <Typography variant="body2">{partei.telefon}</Typography>
                                      </Stack>
                                    )}
                                    {partei.email && (
                                      <Stack direction="row" alignItems="center" spacing={1.5}>
                                        <EmailIcon fontSize="small" color="action" />
                                        <Typography variant="body2">{partei.email}</Typography>
                                      </Stack>
                                    )}
                                    {partei.adresse && (
                                      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                        <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                                        <Typography variant="body2">
                                          {partei.adresse.strasse}, {partei.adresse.plz} {partei.adresse.ort}
                                        </Typography>
                                      </Stack>
                                    )}
                                  </Stack>
                                  <Stack direction="row" spacing={1} flexWrap="wrap">
                                    <Button size="small" startIcon={<EditIcon />} onClick={() => setParteiZumEditieren(partei)}>
                                      Bearbeiten
                                    </Button>
                                    <Button
                                      size="small"
                                      startIcon={<SwapHorizIcon />}
                                      onClick={() => {
                                        setParteiAustauschNeu('');
                                        setParteiZumAustauschen({
                                          scope: 'vr-eintrag',
                                          eintragId,
                                          label,
                                          aktuelleId: partei.id,
                                          typ: rolle,
                                        });
                                      }}
                                    >
                                      Austauschen
                                    </Button>
                                    <Button size="small" onClick={() => navigate(`/parteien/${partei.id}`)}>
                                      Details
                                    </Button>
                                  </Stack>
                                </Collapse>
                              </Box>
                            );
                          }
                          return (
                            <Box key={`vr-broken-${eintragId}`}>
                              <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                                Gespeicherte Verknüpfung ({rawId}) nicht in den Stammdaten — bitte neu zuweisen oder entfernen.
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                <Button
                                  size="small"
                                  startIcon={<SwapHorizIcon />}
                                  onClick={() => {
                                    setParteiAustauschNeu('');
                                    setParteiZumAustauschen({
                                      scope: 'vr-eintrag',
                                      eintragId,
                                      label,
                                      aktuelleId: '',
                                      typ: rolle,
                                    });
                                  }}
                                >
                                  Zuweisen
                                </Button>
                                <Button size="small" variant="outlined" onClick={() => void handleVrEintragEntfernen(eintragId)}>
                                  Entfernen
                                </Button>
                              </Stack>
                            </Box>
                          );
                        })}
                      </Stack>
                    </Box>
                  ))}
                </Stack>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Partei hinzufügen (beliebig oft pro Rolle)
                  </Typography>
                  <Tooltip title="Partei hinzufügen">
                    <IconButton
                      size="small"
                      color="primary"
                      aria-label="Partei hinzufügen"
                      onClick={() => {
                        setVrParteiHinzufuegenSuche('');
                        setVrParteiStammFilter('alle');
                        setVrParteiHinzufuegenOpen(true);
                      }}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </>
            )}

            {/* Arbeitsrecht: Gegenseite & Gericht mit gleicher Logik */}
            {fall.rechtsgebiet === 'arbeitsrecht' && arbeitsParteiSlots.length > 0 && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="overline" display="block" mb={2}>
                  Beteiligte Parteien
                </Typography>
                <Stack spacing={0}>
                  {arbeitsParteiSlots.map((slot) => {
                    const { key, label, partei, rawId } = slot;
                    const blockId = partei?.id ?? `slot-ar-${key}`;
                    const expanded = parteiBlockOpen[blockId] === true;
                    if (partei) {
                      return (
                        <Box key={`ar-${key}-${partei.id}`} sx={{ mb: 2.5, '&:last-of-type': { mb: 0 } }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Typography variant="overline" display="block">
                              {label}
                            </Typography>
                            <Tooltip title={expanded ? 'Einklappen' : 'Ausklappen'}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setParteiBlockOpen((prev) => {
                                    const cur = prev[blockId] === true;
                                    return { ...prev, [blockId]: !cur };
                                  });
                                }}
                                aria-expanded={expanded}
                                aria-label={expanded ? `${label} einklappen` : `${label} ausklappen`}
                              >
                                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: expanded ? 2 : 0 }}>
                            <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}>
                              {parteiInitialen(partei)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                                {partei.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {label}
                              </Typography>
                            </Box>
                          </Stack>
                          <Collapse in={expanded}>
                            <Stack spacing={1.25} mb={2}>
                              {partei.schadensnummer && (
                                <Typography variant="body2" color="text.secondary">
                                  Ref: {partei.schadensnummer}
                                </Typography>
                              )}
                              {partei.gutachterNr && (
                                <Typography variant="body2" color="text.secondary">
                                  Nr: {partei.gutachterNr}
                                </Typography>
                              )}
                              {partei.telefon && (
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <PhoneIcon fontSize="small" color="action" />
                                  <Typography variant="body2">{partei.telefon}</Typography>
                                </Stack>
                              )}
                              {partei.email && (
                                <Stack direction="row" alignItems="center" spacing={1.5}>
                                  <EmailIcon fontSize="small" color="action" />
                                  <Typography variant="body2">{partei.email}</Typography>
                                </Stack>
                              )}
                              {partei.adresse && (
                                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                  <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                                  <Typography variant="body2">
                                    {partei.adresse.strasse}, {partei.adresse.plz} {partei.adresse.ort}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Button size="small" startIcon={<EditIcon />} onClick={() => setParteiZumEditieren(partei)}>
                                Bearbeiten
                              </Button>
                              <Button
                                size="small"
                                startIcon={<SwapHorizIcon />}
                                onClick={() => {
                                  setParteiAustauschNeu('');
                                  setParteiZumAustauschen({
                                    scope: 'ar',
                                    key,
                                    label,
                                    aktuelleId: partei.id,
                                    typ: partei.typ,
                                  });
                                }}
                              >
                                Austauschen
                              </Button>
                              <Button size="small" onClick={() => navigate(`/parteien/${partei.id}`)}>
                                Details
                              </Button>
                            </Stack>
                          </Collapse>
                        </Box>
                      );
                    }
                    return (
                      <Box key={`ar-empty-${key}`} sx={{ mb: 2.5, '&:last-of-type': { mb: 0 } }}>
                        <Typography variant="overline" display="block" mb={1}>
                          {label}
                        </Typography>
                        {rawId && (
                          <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                            Gespeicherte Verknüpfung ({rawId}) nicht in den Stammdaten — bitte neu zuweisen.
                          </Typography>
                        )}
                        {!rawId && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            Noch keine Partei für diese Rolle zugewiesen.
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button
                            size="small"
                            startIcon={<SwapHorizIcon />}
                            onClick={() => {
                              setParteiAustauschNeu('');
                              setParteiZumAustauschen({
                                scope: 'ar',
                                key,
                                label,
                                aktuelleId: rawId ?? '',
                                typ: slot.typ,
                              });
                            }}
                          >
                            {rawId ? 'Neu zuweisen' : 'Zuweisen'}
                          </Button>
                          <Button
                            size="small"
                            startIcon={<PersonAddIcon />}
                            variant="outlined"
                            onClick={() => setNeueParteiSlot({ context: 'ar', key, typ: slot.typ })}
                          >
                            Neu anlegen
                          </Button>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}

            {/* Sonstige Rechtsgebiete / Fallback */}
            {!isVR && fall.rechtsgebiet !== 'arbeitsrecht' && beteiligteAmFall.length > 0 && (
              <>
                <Divider sx={{ my: 2.5 }} />
                <Typography variant="overline" display="block" mb={2}>
                  Beteiligte Parteien
                </Typography>
                <Stack spacing={0}>
                  {beteiligteAmFall.map(({ key, label, partei }) => {
                    const expanded = parteiBlockOpen[partei.id] === true;
                    return (
                      <Box key={`${key}-${partei.id}`} sx={{ mb: 2.5, '&:last-of-type': { mb: 0 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                          <Typography variant="overline" display="block">
                            {label}
                          </Typography>
                          <Tooltip title={expanded ? 'Einklappen' : 'Ausklappen'}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setParteiBlockOpen((prev) => {
                                  const cur = prev[partei.id] === true;
                                  return { ...prev, [partei.id]: !cur };
                                });
                              }}
                              aria-expanded={expanded}
                              aria-label={expanded ? `${label} einklappen` : `${label} ausklappen`}
                            >
                              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: expanded ? 2 : 0 }}>
                          <Avatar sx={{ width: 52, height: 52, bgcolor: 'primary.main', fontSize: '1.1rem', fontWeight: 700 }}>
                            {parteiInitialen(partei)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
                              {partei.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {label}
                            </Typography>
                          </Box>
                        </Stack>
                        <Collapse in={expanded}>
                          <Stack spacing={1.25} mb={2}>
                            {partei.schadensnummer && (
                              <Typography variant="body2" color="text.secondary">
                                Ref: {partei.schadensnummer}
                              </Typography>
                            )}
                            {partei.gutachterNr && (
                              <Typography variant="body2" color="text.secondary">
                                Nr: {partei.gutachterNr}
                              </Typography>
                            )}
                            {partei.telefon && (
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <PhoneIcon fontSize="small" color="action" />
                                <Typography variant="body2">{partei.telefon}</Typography>
                              </Stack>
                            )}
                            {partei.email && (
                              <Stack direction="row" alignItems="center" spacing={1.5}>
                                <EmailIcon fontSize="small" color="action" />
                                <Typography variant="body2">{partei.email}</Typography>
                              </Stack>
                            )}
                            {partei.adresse && (
                              <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                                <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                                <Typography variant="body2">
                                  {partei.adresse.strasse}, {partei.adresse.plz} {partei.adresse.ort}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Button size="small" startIcon={<EditIcon />} onClick={() => setParteiZumEditieren(partei)}>
                              Bearbeiten
                            </Button>
                            <Button
                              size="small"
                              startIcon={<SwapHorizIcon />}
                              onClick={() => {
                                setParteiAustauschNeu('');
                                setParteiZumAustauschen({
                                  scope: 'zr',
                                  key,
                                  label,
                                  aktuelleId: partei.id,
                                  typ: partei.typ,
                                });
                              }}
                            >
                              Austauschen
                            </Button>
                            <Button size="small" onClick={() => navigate(`/parteien/${partei.id}`)}>
                              Details
                            </Button>
                          </Stack>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Stack>
              </>
            )}
          </Paper>
        </Grid>



        {/* Schriftverkehr */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2, maxHeight: { xs: 'none', md: 180 }, display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Schriftverkehr</Typography>
              <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setSvDialogOpen(true)}>
                Schreiben erfassen
              </Button>
            </Stack>
            <Box sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' }, pr: { xs: 0, md: 0.5 } }}>
            {schriftverkehr.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Noch kein Schriftverkehr erfasst.</Typography>
            ) : (
              <List dense disablePadding>
                {schriftverkehr.map((sv) => (
                  <ListItem
                    key={sv.id}
                    disablePadding
                    sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: '12px', px: 1.5, py: 0.5 }}
                    secondaryAction={
                      <Stack direction="row" spacing={0.5}>
                        {sv.richtung === 'gesendet' && sv.empfaengerEmail && (
                          <Tooltip title={`E-Mail an ${sv.empfaengerEmail}`}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                const url = `mailto:${sv.empfaengerEmail}?subject=${encodeURIComponent(sv.betreff)}&body=${encodeURIComponent(htmlToPlainText(sv.inhalt))}`;
                                window.open(url, '_blank');
                              }}
                            >
                              <MailOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Löschen">
                          <IconButton size="small" color="error" onClick={() => handleSvDelete(sv.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    }
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          {sv.richtung === 'gesendet'
                            ? <MailOutlineIcon fontSize="small" color="primary" />
                            : <InboxIcon fontSize="small" color="action" />}
                          <Typography variant="body2" fontWeight={500}>{sv.betreff}</Typography>
                          <Chip
                            label={sv.richtung === 'gesendet' ? 'Gesendet' : 'Empfangen'}
                            size="small"
                            color={sv.richtung === 'gesendet' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {new Date(sv.datum).toLocaleDateString('de-DE')}
                          {sv.empfaengerName ? ` — ${sv.empfaengerName}` : ''}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            </Box>
          </Paper>
        </Grid>



        {/* Fallaktivität */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack spacing={2} sx={{ mb: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>Fallaktivität</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chronik aus Notizen, Anrufen, Phase/Status, Schriftverkehr, Uploads und Dokumenten in der Akte.
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditNoteIcon />}
                    onClick={() => {
                      setTimelineNotizErledigtAufgabeId(null);
                      setAktivitaetBearbeitenId(null);
                      setAktivitaetBetreff('');
                      setAktivitaetDraft('');
                      setAktivitaetDialog('notiz');
                    }}
                  >
                    Notiz
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PhoneIcon />}
                    onClick={() => {
                      setTimelineNotizErledigtAufgabeId(null);
                      setAktivitaetBearbeitenId(null);
                      setAktivitaetBetreff('');
                      setAktivitaetDraft('');
                      setAktivitaetDialog('anruf');
                    }}
                  >
                    Anruf
                  </Button>
                </Stack>
            </Stack>
              <TextField
                size="small"
                fullWidth
                placeholder="Fallaktivität durchsuchen …"
                value={fallAktivitaetSuche}
                onChange={(e) => setFallAktivitaetSuche(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
                aria-label="Fallaktivität durchsuchen"
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {(Object.keys(FALL_AKTIVITAET_FILTER_LABEL) as FallAktivitaetFilter[]).map((key) => {
                  const count = key === 'alle'
                    ? fallAktivitaetZeilen.length
                    : fallAktivitaetZeilen.filter((z) => filterVonFallAktivitaet(z) === key).length;
                  return (
                    <Chip
                      key={key}
                      label={`${FALL_AKTIVITAET_FILTER_LABEL[key]} (${count})`}
                      clickable
                      color={fallAktivitaetFilter === key ? 'primary' : 'default'}
                      variant={fallAktivitaetFilter === key ? 'filled' : 'outlined'}
                      onClick={() => setFallAktivitaetFilter(key)}
                    />
                  );
                })}
              </Stack>
            </Stack>

            {fallAktivitaetZeilen.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Noch keine Aktivitäten — legen Sie eine Notiz oder einen Anruf an, oder dokumentieren Sie Schriftverkehr und Dateien weiter unten.
              </Typography>
            ) : fallAktivitaetZeilenGefiltert.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Keine Treffer für den gewählten Filter{fallAktivitaetSuche.trim() ? ` und „${fallAktivitaetSuche.trim()}“` : ''}.
              </Typography>
            ) : (
              <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                <List dense disablePadding>
                  {fallAktivitaetZeilenGefiltert.map((z) => (
                    <FallaktivitaetListenZeile
                      key={z.id}
                      zeile={z}
                      onVolltext={(zeile) =>
                        setAktivitaetLesen({ titel: zeile.titel, text: zeile.beschreibung ?? '' })
                      }
                      onBearbeiten={handleAktivitaetBearbeitenAusListe}
                      onLoeschen={handleAktivitaetLoeschenAusListe}
                    />
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Phasendetails Stepper */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Phasendetails</Typography>
              <Stack direction="row" spacing={1}>
                {fall.phase > 1 && (
                  <Tooltip title={`Zurück zu Phase ${fall.phase - 1}`}>
                    <span>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ArrowBackIcon />}
                        disabled={fall.status !== 'aktiv'}
                        onClick={handlePhaseZurueck}
                      >
                        Phase {fall.phase - 1}
                      </Button>
                    </span>
                  </Tooltip>
                )}
                <Tooltip title={fall.phase >= maxPhaseNummer ? 'Letzte Phase erreicht' : `Weiter zu Phase ${fall.phase + 1}`}>
                  <span>
                    <Button
                      variant="contained"
                      size="small"
                      endIcon={<ArrowForwardIcon />}
                      disabled={fall.phase >= maxPhaseNummer || fall.status !== 'aktiv'}
                      onClick={handlePhaseVor}
                    >
                      Phase {fall.phase + 1}
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
            <input
              type="file"
              ref={uploadInputRef}
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file || !fall) return;
                addUploadedDateien([
                  {
                    fallId: fall.id,
                    dateiname: file.name,
                    dateityp: file.type || 'application/octet-stream',
                    groesse: file.size,
                    kategorie: uploadKategorieRef.current,
                  },
                ]);
              }}
            />
            <PhaseTimeline
                rechtsgebiet={fall.rechtsgebiet}
                aktuellePhase={fall.phase}
                vertikal={true}
                fallId={fall.id}
                onSchriftverkehrErstellen={({ typId, standardTextvorlageId }) => {
                  setSvInitialTyp(typId);
                  setSvInitialVorlageId(standardTextvorlageId);
                  setSvDialogOpen(true);
                }}
                onUploadErstellen={({ uploadErwartung }) => {
                  uploadKategorieRef.current = uploadErwartungToDateiKategorie(uploadErwartung);
                  uploadInputRef.current?.click();
                }}
                onAufgabeAnrufDokumentieren={({ aufgabenText }) => {
                  setAktivitaetBearbeitenId(null);
                  setTimelineNotizErledigtAufgabeId(null);
                  setAktivitaetBetreff(aufgabenText);
                  setAktivitaetDraft('');
                  setAktivitaetDialog('anruf');
                }}
                onAufgabeNotiz={({ aufgabeId, aufgabenText }) => {
                  setAktivitaetBearbeitenId(null);
                  setTimelineNotizErledigtAufgabeId(aufgabeId);
                  setAktivitaetBetreff(aufgabenText);
                  setAktivitaetDraft('');
                  setAktivitaetDialog('notiz');
                }}
              />
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={aktivitaetDialog !== null}
        onClose={() => {
          setAktivitaetDialog(null);
          setAktivitaetBetreff('');
          setAktivitaetDraft('');
          setTimelineNotizErledigtAufgabeId(null);
          setAktivitaetBearbeitenId(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {aktivitaetBearbeitenId ?
            aktivitaetDialog === 'anruf' ?
              'Anruf bearbeiten'
            : 'Notiz bearbeiten'
          : aktivitaetDialog === 'anruf' ?
            'Anruf dokumentieren'
          : 'Notiz hinzufügen'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              label="Betreff"
              fullWidth
              required
              value={aktivitaetBetreff}
              onChange={(e) => setAktivitaetBetreff(e.target.value)}
              placeholder={aktivitaetDialog === 'anruf' ? 'z. B. Rückruf Versicherung' : 'Kurz zum Thema'}
            />
            <TextField
              label={aktivitaetDialog === 'anruf' ? 'Gespräch / Ergebnis' : 'Notiz'}
              multiline
              minRows={4}
              fullWidth
              required
              value={aktivitaetDraft}
              onChange={(e) => setAktivitaetDraft(e.target.value)}
              placeholder={
                aktivitaetDialog === 'anruf'
                  ? 'Wer, wann, was besprochen, nächste Schritte …'
                  : 'Ausführlicher Text …'
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAktivitaetDialog(null);
              setAktivitaetBetreff('');
              setAktivitaetDraft('');
              setTimelineNotizErledigtAufgabeId(null);
              setAktivitaetBearbeitenId(null);
            }}
          >
            Abbrechen
          </Button>
          <Button
            variant="contained"
            onClick={handleAktivitaetSpeichern}
            disabled={!aktivitaetBetreff.trim() || !aktivitaetDraft.trim()}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={aktivitaetLesen !== null} onClose={() => setAktivitaetLesen(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{aktivitaetLesen?.titel}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pt: 0.5 }}>
            {aktivitaetLesen?.text}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAktivitaetLesen(null)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={aktivitaetLoeschenDialog !== null}
        onClose={() => setAktivitaetLoeschenDialog(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Eintrag löschen?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            „{aktivitaetLoeschenDialog?.titel}“ wird aus der Fallaktivität entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAktivitaetLoeschenDialog(null)}>Abbrechen</Button>
          <Button color="error" variant="contained" onClick={() => void handleAktivitaetLoeschenBestaetigt()}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Schriftverkehr */}
      <SchriftverkehrDialog
        open={svDialogOpen}
        fall={fall}
        mandant={mandant}
        parteien={alleParteien}
        initialTyp={svInitialTyp}
        initialTextvorlageId={svInitialVorlageId}
        onClose={() => {
          setSvDialogOpen(false);
          setSvInitialTyp(undefined);
          setSvInitialVorlageId(undefined);
        }}
        onSaved={(sv) => {
          setSchriftverkehr((prev) => [sv, ...prev]);
          // Passende Aufgabe automatisch als erledigt markieren
          markiereBySchriftverkehrTyp(
            fall.id,
            fall.rechtsgebiet as import('../../store/aufgabenStore').AufgabeRechtsgebiet,
            fall.phase,
            sv.typ,
          );
        }}
        onWiedervorlageCreated={async (wv) => {
          setWiedervorlagen((prev) => [...prev, wv]);
          if (!fall) return;
          const u = await faelleApi.addAktivitaet(fall.id, {
            typ: 'wiedervorlage',
            titel: 'Wiedervorlage angelegt',
            beschreibung: wv.beschreibung,
            meta: { faelligAm: wv.faelligAm, wvId: wv.id },
          });
          setFall(u);
        }}
      />

      {/* Dialog: Mandant bearbeiten */}
      {mandant && (
        <MandantDialog
          open={mandantEditOpen}
          mandant={mandant}
          onClose={() => setMandantEditOpen(false)}
          onSaved={(updated) => {
            setMandant(updated);
            setMandantEditOpen(false);
          }}
        />
      )}

      <ParteiDialog
        open={parteiZumEditieren !== null}
        partei={parteiZumEditieren ?? undefined}
        onClose={() => setParteiZumEditieren(null)}
        onSaved={(updated) => {
          setParteienMap((prev) => ({ ...prev, [updated.id]: updated }));
          setAlleParteien((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          setParteiZumEditieren(null);
        }}
      />

      <ParteiDialog
        open={neueParteiSlot !== null}
        defaultTyp={
          neueParteiSlot?.context === 'vr' ? neueParteiSlot.rolle : (neueParteiSlot?.typ ?? 'versicherung')
        }
        onClose={() => setNeueParteiSlot(null)}
        onSaved={handleNeueParteiGespeichert}
      />

      {/* Dialog: Partei austauschen */}
      <Dialog
        open={parteiZumAustauschen !== null}
        onClose={() => { setParteiZumAustauschen(null); setParteiAustauschSuche(''); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              {parteiZumAustauschen?.aktuelleId
                ? `${parteiZumAustauschen.label} austauschen`
                : `${parteiZumAustauschen?.label ?? ''} zuweisen`}
            </Typography>
            <IconButton size="small" onClick={() => { setParteiZumAustauschen(null); setParteiAustauschSuche(''); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Suchen…"
            value={parteiAustauschSuche}
            onChange={(e) => setParteiAustauschSuche(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
            sx={{ mb: 2 }}
            autoFocus
          />
          {(() => {
            const kandidaten = alleParteien.filter(
              (p) =>
                p.typ === parteiZumAustauschen?.typ &&
                p.id !== (parteiZumAustauschen?.aktuelleId || '') &&
                p.name.toLowerCase().includes(parteiAustauschSuche.toLowerCase()),
            );
            if (kandidaten.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  Keine Treffer
                </Typography>
              );
            }
            return (
              <Stack spacing={1}>
                {kandidaten.map((p) => {
                  const selected = parteiAustauschNeu === p.id;
                  return (
                    <Box
                      key={p.id}
                      onClick={() => setParteiAustauschNeu(p.id)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: selected ? 'primary.main' : 'divider',
                        bgcolor: selected ? 'primary.50' : 'background.paper',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background-color 0.15s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: selected ? 'primary.50' : 'action.hover' },
                      }}
                    >
                      <Avatar sx={{ bgcolor: selected ? 'primary.main' : 'grey.400', width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700, flexShrink: 0 }}>
                        {parteiInitialen(p)}
                      </Avatar>
                      <Box flex={1} minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {p.adresse ? `${p.adresse.plz} ${p.adresse.ort}` : parteiZumAustauschen?.label}
                        </Typography>
                      </Box>
                      {selected && <CheckCircleIcon color="primary" />}
                    </Box>
                  );
                })}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setParteiZumAustauschen(null); setParteiAustauschSuche(''); }}>Abbrechen</Button>
          <Button
            variant="contained"
            disabled={!parteiAustauschNeu}
            onClick={handleParteiAustauschen}
          >
            Übernehmen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Verkehrsrecht — Partei aus Stammdaten + Neu */}
      <Dialog
        open={vrParteiHinzufuegenOpen}
        onClose={() => {
          setVrParteiHinzufuegenOpen(false);
          setVrParteiHinzufuegenSuche('');
          setVrParteiStammFilter('alle');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Partei hinzufügen
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setVrParteiHinzufuegenOpen(false);
                setVrParteiHinzufuegenSuche('');
                setVrParteiStammFilter('alle');
              }}
              aria-label="Schließen"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
            Typ filtern
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={vrParteiStammFilter}
            onChange={(_, v: VrStammParteiFilter | null) => {
              if (v != null) setVrParteiStammFilter(v);
            }}
            sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
          >
            <ToggleButton value="alle">Alle</ToggleButton>
            <ToggleButton value="versicherung">Versicherung</ToggleButton>
            <ToggleButton value="gutachter">Gutachter</ToggleButton>
            <ToggleButton value="werkstatt">Werkstatt</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            fullWidth
            size="small"
            placeholder="Nach Name, E-Mail oder Ort suchen …"
            value={vrParteiHinzufuegenSuche}
            onChange={(e) => setVrParteiHinzufuegenSuche(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            autoFocus
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Stammdaten
            </Typography>
            <Tooltip
              title={
                vrParteiStammFilter === 'alle'
                  ? 'Neue Partei anlegen (Typ Versicherung; im Formular änderbar)'
                  : `Neue Partei als ${VR_ROLLE_LABEL[vrParteiStammFilter]} anlegen`
              }
            >
              <IconButton
                size="small"
                color="primary"
                aria-label="Neue Partei anlegen"
                onClick={() => {
                  const rolle: VrStammParteiTyp =
                    vrParteiStammFilter === 'alle' ? 'versicherung' : vrParteiStammFilter;
                  setNeueParteiSlot({ context: 'vr', rolle });
                  setVrParteiHinzufuegenOpen(false);
                  setVrParteiHinzufuegenSuche('');
                  setVrParteiStammFilter('alle');
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Stack>
          {vrStammParteienGezeigt.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
              Keine Treffer — Toggle oder Suchbegriff anpassen.
            </Typography>
          ) : (
            <List dense disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
              {vrStammParteienGezeigt.map((p) => (
                <ListItem key={p.id} disablePadding sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <ListItemButton
                    alignItems="flex-start"
                    sx={{ py: 1.25 }}
                    onClick={() => void handleVrParteiAusStammZuordnen(p)}
                  >
                    <Avatar
                      sx={{
                        mr: 1.5,
                        mt: 0.25,
                        bgcolor: 'primary.main',
                        width: 44,
                        height: 44,
                        fontSize: '0.95rem',
                        fontWeight: 700,
                      }}
                    >
                      {parteiInitialen(p)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600} component="span">
                          {p.name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {VR_ROLLE_LABEL[p.typ] ?? p.typ}
                            {p.adresse ?
                              ` · ${p.adresse.plz} ${p.adresse.ort}`
                            : ''}
                          </Typography>
                          {p.email ?
                            <Typography variant="caption" color="text.secondary" component="span" display="block">
                              {p.email}
                            </Typography>
                          : null}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setVrParteiHinzufuegenOpen(false);
              setVrParteiHinzufuegenSuche('');
              setVrParteiStammFilter('alle');
            }}
          >
            Abbrechen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: weiteren Mandanten zuordnen */}
      <Dialog
        open={weitererMandantDialogOpen}
        onClose={() => {
          setWeitererMandantDialogOpen(false);
          setWeitererMandantSuche('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Weiteren Mandanten zuordnen
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setWeitererMandantDialogOpen(false);
                setWeitererMandantSuche('');
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Suchen…"
            value={weitererMandantSuche}
            onChange={(e) => setWeitererMandantSuche(e.target.value)}
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
            sx={{ mb: 2 }}
            autoFocus
          />
          {(() => {
            const q = weitererMandantSuche.trim().toLowerCase();
            const forbidden = new Set<string>([...(fall ? [fall.mandantId] : []), ...(fall?.weitereMandantenIds ?? [])]);
            const kandidaten = mandantenWeiterePicker.filter((m) => {
              if (forbidden.has(m.id)) return false;
              const name = `${m.vorname} ${m.nachname}`.toLowerCase();
              const email = (m.email ?? '').toLowerCase();
              return !q || name.includes(q) || email.includes(q);
            });
            if (kandidaten.length === 0) {
              return (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
                  Keine Treffer
                </Typography>
              );
            }
            return (
              <Stack spacing={1}>
                {kandidaten.map((m) => (
                  <Box
                    key={m.id}
                    onClick={() => void handleWeiterenMandantHinzufuegen(m.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                    }}
                  >
                    <Avatar sx={{ bgcolor: 'grey.400', width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700 }}>
                      {m.vorname[0]}
                      {m.nachname[0]}
                    </Avatar>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {m.kategorie === 'unternehmen' ? m.nachname : `${m.vorname} ${m.nachname}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {m.email}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setWeitererMandantDialogOpen(false);
              setWeitererMandantSuche('');
            }}
          >
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Fallinformationen (Vollansicht) */}
      <Dialog open={fallInfoDialogOpen} onClose={() => setFallInfoDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>Fallinformationen — Details</Typography>
            <IconButton size="small" onClick={() => setFallInfoDialogOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <InfoRow label="Aktenzeichen" value={fall.aktenzeichen} />
            <InfoRow
              label="Rechtsgebiet"
              value={fall.rechtsgebiet === 'verkehrsrecht' ? 'Verkehrsrecht' : fall.rechtsgebiet === 'arbeitsrecht' ? 'Arbeitsrecht' : 'Zivilrecht'}
            />
            <InfoRow label="Phase" value={`Phase ${fall.phase} von ${maxPhaseNummer}`} />
            <InfoRow label="Status" value={fall.status} />
            <InfoRow label="Angelegt am" value={new Date(fall.erstelltAm).toLocaleDateString('de-DE')} />

            {fall.verkehrsrecht && (
              <>
                <Divider />
                <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Verkehrsrecht
                </Typography>
                <InfoRow
                  label="Abrechnungsart"
                  value={fall.verkehrsrecht.abrechnungsart === 'fiktiv' ? 'Fiktiv (Gutachtenwert netto)' : 'Konkret (Reparaturrechnung)'}
                />
                <InfoRow
                  label="Anspruchsinhaber"
                  value={{ mandant: 'Mandant / Eigentümer', leasing: 'Leasinggeber', bank: 'Finanzierende Bank' }[fall.verkehrsrecht.anspruchsinhaber]}
                />
                {fall.verkehrsrecht.schadenshoehe && (
                  <InfoRow label="Schadenshöhe" value={fall.verkehrsrecht.schadenshoehe.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                )}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 0.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Fahrzeug:</Typography>
                  <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1}>
                    <KennzeichenSchild kennzeichen={fall.verkehrsrecht.fahrzeug.kennzeichen} />
                    <Typography variant="body2">{fall.verkehrsrecht.fahrzeug.typ} ({fall.verkehrsrecht.fahrzeug.baujahr})</Typography>
                  </Stack>
                </Stack>
                {fall.verkehrsrecht.fahrzeug.erstzulassung && (
                  <InfoRow label="Erstzulassung" value={new Date(fall.verkehrsrecht.fahrzeug.erstzulassung).toLocaleDateString('de-DE')} />
                )}
              </>
            )}

            {fall.arbeitsrecht && (
              <>
                <Divider />
                <Typography variant="caption" color="secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Arbeitsrecht
                </Typography>
                <InfoRow label="Falltyp" value={FALLTYP_LABELS[fall.arbeitsrecht.falltyp] ?? fall.arbeitsrecht.falltyp} />
                {fall.arbeitsrecht.kuendigungsdatum && (
                  <InfoRow label="Kündigungsdatum" value={new Date(fall.arbeitsrecht.kuendigungsdatum).toLocaleDateString('de-DE')} />
                )}
                {fall.arbeitsrecht.fristEnde && (
                  <InfoRow label="KSchG-Fristende" value={new Date(fall.arbeitsrecht.fristEnde).toLocaleDateString('de-DE')} />
                )}
                {fall.arbeitsrecht.lohnrueckstand && (
                  <InfoRow label="Lohnrückstand" value={fall.arbeitsrecht.lohnrueckstand.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                )}
              </>
            )}

            {fall.zivilrecht && (
              <>
                <Divider />
                <Typography variant="caption" color="success.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Zivilrecht
                </Typography>
                <InfoRow label="Falltyp" value={fall.zivilrecht.falltyp} />
                {fall.zivilrecht.gegenseite && <InfoRow label="Gegenseite" value={fall.zivilrecht.gegenseite} />}
                {fall.zivilrecht.forderungsbetrag && (
                  <InfoRow label="Forderungsbetrag" value={fall.zivilrecht.forderungsbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                )}
                {fall.zivilrecht.streitwert && (
                  <InfoRow label="Streitwert" value={fall.zivilrecht.streitwert.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
                )}
                {fall.zivilrecht.mahnfristEnde && (
                  <InfoRow label="Mahnfrist bis" value={new Date(fall.zivilrecht.mahnfristEnde).toLocaleDateString('de-DE')} />
                )}
                {fall.zivilrecht.klageEingereichtAm && (
                  <InfoRow label="Klage eingereicht" value={new Date(fall.zivilrecht.klageEingereichtAm).toLocaleDateString('de-DE')} />
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFallInfoDialogOpen(false)}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Wiedervorlage hinzufügen */}
      <WiedervorlageDialog
        open={wvDialogOpen}
        fallId={fall.id}
        onClose={() => setWvDialogOpen(false)}
        onSaved={(wv) => {
          setWiedervorlagen((prev) => [...prev, wv]);
          setWvDialogOpen(false);
        }}
      />

      {/* Dialog: Status ändern */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Status ändern</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Neuer Status</InputLabel>
            <Select value={neuerStatus} onChange={(e) => setNeuerStatus(e.target.value)} label="Neuer Status">
              {STATUS_OPTIONEN.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleStatusAendern}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Wiedervorlage-Dialog ──────────────────────────────────

const WV_TYPEN: { value: WiedervorlageTyp; label: string }[] = [
  { value: 'allgemein', label: 'Allgemein' },
  { value: 'frist_versicherung', label: 'Frist Versicherung' },
  { value: 'kschg_frist', label: 'KSchG-Frist' },
  { value: 'lag_berufung', label: 'LAG-Berufungsfrist' },
  { value: 'kuendigung_frist', label: 'Kündigungsfrist' },
];

function WiedervorlageDialog({
  open,
  fallId,
  onClose,
  onSaved,
}: {
  open: boolean;
  fallId: string;
  onClose: () => void;
  onSaved: (wv: Wiedervorlage) => void;
}) {
  const [beschreibung, setBeschreibung] = useState('');
  const [faelligAm, setFaelligAm] = useState('');
  const [typ, setTyp] = useState<WiedervorlageTyp>('allgemein');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!beschreibung || !faelligAm) return;
    setSaving(true);
    const wv = await wiedervorlagenApi.create({
      fallId,
      typ,
      beschreibung,
      faelligAm: new Date(faelligAm).toISOString(),
      erledigt: false,
    });
    setSaving(false);
    setBeschreibung('');
    setFaelligAm('');
    setTyp('allgemein');
    onSaved(wv);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Wiedervorlage hinzufügen</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Typ</InputLabel>
            <Select value={typ} onChange={(e) => setTyp(e.target.value as WiedervorlageTyp)} label="Typ">
              {WV_TYPEN.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Beschreibung / Aufgabe"
            fullWidth
            multiline
            rows={2}
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            required
          />
          <TextField
            label="Fällig am"
            type="date"
            fullWidth
            value={faelligAm}
            onChange={(e) => setFaelligAm(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" disabled={!beschreibung || !faelligAm || saving} onClick={handleSave}>
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}:</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  );
}

function parteiInitialen(p: Partei): string {
  const parts = p.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return p.name.slice(0, 2).toUpperCase();
}
