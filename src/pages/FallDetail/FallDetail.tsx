import { useEffect, useMemo, useState } from 'react';
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
  InputLabel,
  Avatar,
  Collapse,
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import InboxIcon from '@mui/icons-material/Inbox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import { parteienApi, wiedervorlagenApi } from '../../api/parteien';
import { schriftverkehrApi } from '../../api/schriftverkehr';
import type { Fall, Mandant, Partei, Schriftverkehr, Wiedervorlage, WiedervorlageTyp } from '../../types';
import PhaseTimeline from '../../components/PhaseTimeline/PhaseTimeline';
import FristBadge from '../../components/FristBadge/FristBadge';
import SchriftverkehrDialog from '../../components/SchriftverkehrDialog/SchriftverkehrDialog';
import MandantDialog from '../../components/MandantDialog/MandantDialog';
import ParteiDialog from '../../components/ParteiDialog/ParteiDialog';
import { useDokumenteStore } from '../../store/dokumenteStore';
import { druckeBriefAlsPdf, erzeugeBriefPdfBlob } from '../../utils/briefDruck';
import { useKanzleiStore } from '../../store/kanzleiStore';
import KennzeichenSchild from '../../components/KennzeichenSchild/KennzeichenSchild';

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

const VR_MAX_PHASE = 4;
const AR_MAX_PHASE = 3;

const VR_PHASE_HINWEISE: Record<number, string> = {
  1: 'Phase 1 — Eingang: Mandant aufnehmen, Unfallhergang dokumentieren, Schadensanzeige an Versicherung, Gutachter beauftragen.',
  2: 'Phase 2 — Schriftverkehr: Gutachten + Reparaturrechnung übermitteln, Nutzungsausfall/Mietwagen geltend machen, Rückläufer prüfen.',
  3: 'Phase 3 — Kürzungsschreiben: Kürzung durch Versicherung prüfen, Stellungnahme fertigen, ggf. Nachbesserung fordern.',
  4: 'Phase 4 — Klage: Klageschrift vorbereiten, Mahnbescheid oder Klage einreichen, Gerichtstermin koordinieren.',
};

const AR_PHASE_HINWEISE: Record<number, string> = {
  1: 'Phase 1 — Eingang: Sachverhalt aufnehmen, KSchG-Frist prüfen (§ 4 — 3 Wochen!), RSV-Deckungsanfrage stellen, Vollmacht einholen.',
  2: 'Phase 2 — Außergerichtlich: Abmahnung/Kündigung prüfen, Gegenseite anschreiben, Vergleich/Abfindung verhandeln.',
  3: 'Phase 3 — Gericht: Klage einreichen (ArbG), Gütetermin vorbereiten, Kammertermin koordinieren.',
};

export default function FallDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const kanzlei = useKanzleiStore((s) => s.daten);
  const { getDokumenteByFall, deleteDokument, getUploadedDateienByFall, deleteUploadedDatei } = useDokumenteStore();
  const [fall, setFall] = useState<Fall | null>(null);
  const [mandant, setMandant] = useState<Mandant | null>(null);
  const [wiedervorlagen, setWiedervorlagen] = useState<Wiedervorlage[]>([]);
  const [parteienMap, setParteienMap] = useState<Record<string, Partei>>({});
  const [alleParteien, setAlleParteien] = useState<Partei[]>([]);
  const [schriftverkehr, setSchriftverkehr] = useState<Schriftverkehr[]>([]);
  const [loading, setLoading] = useState(true);
  const [notizenEdit, setNotizenEdit] = useState(false);
  const [notizenDraft, setNotizenDraft] = useState('');

  // Dialog-States
  const [wvDialogOpen, setWvDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [svDialogOpen, setSvDialogOpen] = useState(false);
  const [neuerStatus, setNeuerStatus] = useState('');
  const [mandantEditOpen, setMandantEditOpen] = useState(false);
  const [fallInfoDialogOpen, setFallInfoDialogOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<'akte' | 'uploads'>('uploads');
  const [mandantSidebarOpen, setMandantSidebarOpen] = useState(false);
  /** Pro Partei-ID: nur bei explizit `true` ausgeklappt */
  const [parteiBlockOpen, setParteiBlockOpen] = useState<Record<string, boolean>>({});
  const [parteiZumEditieren, setParteiZumEditieren] = useState<Partei | null>(null);

  useEffect(() => {
    if (!id) return;
    faelleApi.getById(id).then(async (f) => {
      setFall(f);
      setNeuerStatus(f.status);
      setNotizenDraft(f.notizen ?? '');
      const [m, w] = await Promise.all([
        mandantenApi.getById(f.mandantId),
        wiedervorlagenApi.getAll({ fallId: f.id, nurOffene: true }),
      ]);
      setMandant(m);
      setWiedervorlagen(w);

      // Parteien laden
      const ids = [
        f.verkehrsrecht?.gutachterId,
        f.verkehrsrecht?.werkstattId,
        f.verkehrsrecht?.versicherungId,
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

  const beteiligteAmFall = useMemo(() => {
    if (!fall) return [] as { key: string; label: string; partei: Partei }[];
    const rows: { key: string; label: string; partei: Partei }[] = [];
    const vr = fall.verkehrsrecht;
    const ar = fall.arbeitsrecht;
    if (vr?.versicherungId && parteienMap[vr.versicherungId]) {
      rows.push({ key: 'versicherung', label: 'Versicherung', partei: parteienMap[vr.versicherungId] });
    }
    if (vr?.gutachterId && parteienMap[vr.gutachterId]) {
      rows.push({ key: 'gutachter', label: 'Gutachter / Sachverständiger', partei: parteienMap[vr.gutachterId] });
    }
    if (vr?.werkstattId && parteienMap[vr.werkstattId]) {
      rows.push({ key: 'werkstatt', label: 'Werkstatt', partei: parteienMap[vr.werkstattId] });
    }
    if (ar?.gegenseiteId && parteienMap[ar.gegenseiteId]) {
      rows.push({ key: 'gegenseite', label: 'Gegenseite', partei: parteienMap[ar.gegenseiteId] });
    }
    if (ar?.gerichtId && parteienMap[ar.gerichtId]) {
      rows.push({ key: 'gericht', label: 'Gericht', partei: parteienMap[ar.gerichtId] });
    }
    return rows;
  }, [fall, parteienMap]);

  const handlePhaseVor = async () => {
    if (!fall) return;
    const maxPhase = fall.rechtsgebiet === 'verkehrsrecht' ? VR_MAX_PHASE : AR_MAX_PHASE;
    if (fall.phase >= maxPhase) return;
    const updated = await faelleApi.update(fall.id, { phase: (fall.phase + 1) as any });
    setFall(updated);
  };

  const handleStatusAendern = async () => {
    if (!fall || !neuerStatus) return;
    const updated = await faelleApi.update(fall.id, { status: neuerStatus as any });
    setFall(updated);
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

  const handleNotizenSave = async () => {
    if (!fall) return;
    const updated = await faelleApi.update(fall.id, { notizen: notizenDraft });
    setFall(updated);
    setNotizenEdit(false);
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
  const maxPhase = isVR ? VR_MAX_PHASE : AR_MAX_PHASE;

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
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Prozessfortschritt</Typography>
              <Tooltip title={fall.phase >= maxPhase ? 'Letzte Phase erreicht' : 'Zur nächsten Phase'}>
                <span>
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    disabled={fall.phase >= maxPhase || fall.status !== 'aktiv'}
                    onClick={handlePhaseVor}
                  >
                    Phase {fall.phase + 1}
                  </Button>
                </span>
              </Tooltip>
            </Stack>
            <PhaseTimeline rechtsgebiet={fall.rechtsgebiet} aktuellePhase={fall.phase as any} vertikal={false} />
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
          </Paper>

        {/* Dokumente + Hochgeladene Unterlagen — kombiniert */}
        {(() => {
          const docs = getDokumenteByFall(fall.id);
          const uploads = getUploadedDateienByFall(fall.id);
          const formatBytes = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
          const formatDate = (d: string) =>
            new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

          return (
              <Paper elevation={1} sx={{ p: 2.5 }}>
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
              </Paper>
            );
        })()}

          </Stack>
        </Grid>

        {/* Rechte Spalte: Mandant + Beteiligte Parteien */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={1} sx={{ p: 2.5 }}>
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

            {/* BETEILIGTE PARTEIEN */}
            {beteiligteAmFall.length > 0 && (
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
                          <Stack direction="row" spacing={1}>
                            <Button size="small" startIcon={<EditIcon />} onClick={() => setParteiZumEditieren(partei)}>
                              Bearbeiten
                            </Button>
                            <Button size="small" onClick={() => navigate('/parteien')}>
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



        {/* Nächste Schritte */}
        <Grid size={{ xs: 12 }}>
          <Alert
            severity="info"
            icon={false}
            sx={{ '& .MuiAlert-message': { width: '100%' } }}
          >
            <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
              Nächste Schritte — Phase {fall.phase}
            </Typography>
            <Typography variant="body2">
              {isVR
                ? VR_PHASE_HINWEISE[fall.phase]
                : AR_PHASE_HINWEISE[fall.phase]}
            </Typography>
          </Alert>
        </Grid>


        {/* Schriftverkehr */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={600}>Schriftverkehr</Typography>
              <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setSvDialogOpen(true)}>
                Schreiben erfassen
              </Button>
            </Stack>
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
                                const url = `mailto:${sv.empfaengerEmail}?subject=${encodeURIComponent(sv.betreff)}&body=${encodeURIComponent(sv.inhalt)}`;
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
          </Paper>
        </Grid>



        {/* Notizen */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="h6" fontWeight={600}>Notizen</Typography>
              {!notizenEdit ? (
                <Tooltip title="Notizen bearbeiten">
                  <IconButton size="small" onClick={() => { setNotizenDraft(fall.notizen ?? ''); setNotizenEdit(true); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Speichern">
                    <IconButton size="small" color="primary" onClick={handleNotizenSave}>
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Abbrechen">
                    <IconButton size="small" onClick={() => setNotizenEdit(false)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )}
            </Stack>
            {notizenEdit ? (
              <TextField
                multiline
                rows={4}
                fullWidth
                value={notizenDraft}
                onChange={(e) => setNotizenDraft(e.target.value)}
                placeholder="Interne Notizen zum Fall..."
              />
            ) : (
              <Typography variant="body2" color={fall.notizen ? 'text.primary' : 'text.secondary'} sx={{ whiteSpace: 'pre-wrap' }}>
                {fall.notizen || 'Keine Notizen vorhanden.'}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Phasendetails Stepper */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Phasendetails</Typography>
            <PhaseTimeline rechtsgebiet={fall.rechtsgebiet} aktuellePhase={fall.phase as any} vertikal={true} />
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog: Schriftverkehr */}
      <SchriftverkehrDialog
        open={svDialogOpen}
        fall={fall}
        mandant={mandant}
        parteien={alleParteien}
        onClose={() => setSvDialogOpen(false)}
        onSaved={(sv) => setSchriftverkehr((prev) => [sv, ...prev])}
        onWiedervorlageCreated={(wv) => setWiedervorlagen((prev) => [...prev, wv])}
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
            <InfoRow label="Phase" value={`Phase ${fall.phase} von ${maxPhase}`} />
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
