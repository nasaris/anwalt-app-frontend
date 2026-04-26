import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WorkIcon from '@mui/icons-material/Work';
import BalanceIcon from '@mui/icons-material/Balance';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import GavelIcon from '@mui/icons-material/Gavel';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AddIcon from '@mui/icons-material/Add';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CalculateIcon from '@mui/icons-material/Calculate';
import { faelleApi } from '../../api/faelle';
import { schriftverkehrApi } from '../../api/schriftverkehr';
import { uploadsApi } from '../../api/uploads';
import { wiedervorlagenApi } from '../../api/parteien';
import type { Fall } from '../../types';
import type { UploadErwartung } from '../../store/aufgabenStore';
import { useAufgabenStore, type AufgabeRechtsgebiet } from '../../store/aufgabenStore';
import { useKanzleiStore } from '../../store/kanzleiStore';
import { useDokumenteStore } from '../../store/dokumenteStore';
import type { DateiKategorie } from '../../store/dokumenteStore';
import FristBadge from '../../components/FristBadge/FristBadge';
import PhaseTimeline from '../../components/PhaseTimeline/PhaseTimeline';
import SchriftverkehrDialog from '../../components/SchriftverkehrDialog/SchriftverkehrDialog';
import MandantDialog from '../../components/MandantDialog/MandantDialog';
import ParteiDialog from '../../components/ParteiDialog/ParteiDialog';

// Hooks
import { useFallDetailData } from './hooks/useFallDetailData';
import { useDateien } from './hooks/useDateien';
import { useFallaktivitaet } from './hooks/useFallaktivitaet';
import { useEditFallForm } from './hooks/useEditFallForm';
import { useVrParteien } from './hooks/useVrParteien';

// Dialogs
import { useSchadenskalkulationStore } from '../../store/schadenskalkulationStore';
import type { Schadenskalkulation } from '../../types';
import SchadenskalkulationDialog from '../Abrechnung/SchadenskalkulationDialog';
import { druckeSchadenskalkulationAlsPdf } from '../../utils/schadenskalkulationDruck';
import { formatEuro } from '../../utils/rvgBerechnung';
import WiedervorlageDialog from './dialogs/WiedervorlageDialog';
import AktivitaetDialog, { AktivitaetLesenDialog, AktivitaetLoeschenDialog } from './dialogs/AktivitaetDialog';
import UploadDialog from './dialogs/UploadDialog';
import DateiBrowserDialog from './dialogs/DateiBrowserDialog';
import EditFallDialog from './dialogs/EditFallDialog';
import FallInfoDialog from './dialogs/FallInfoDialog';
import VrParteiHinzufuegenDialog from './dialogs/VrParteiHinzufuegenDialog';
import WeitereMandantenDialog from './dialogs/WeitereMandantenDialog';
import ParteiAustauschDialog from './dialogs/ParteiAustauschDialog';

// Sections
import MandantParteienCard from './sections/MandantParteienCard';
import SchriftverkehrCard from './sections/SchriftverkehrCard';
import FallaktivitaetCard from './sections/FallaktivitaetCard';
import DateienCard from './sections/DateienCard';

function uploadErwartungToDateiKategorie(u?: UploadErwartung): DateiKategorie {
  if (!u) return 'sonstiges';
  return u as DateiKategorie;
}

export default function FallDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const kanzlei = useKanzleiStore((s) => s.daten);
  const markiereBySchriftverkehrTyp = useAufgabenStore((s) => s.markiereBySchriftverkehrTyp);
  const { getDokumenteByFall, deleteDokument } = useDokumenteStore();
  const dokumenteAll = useDokumenteStore((s) => s.dokumente);

  const dokumentePdfForFall = useMemo(
    () => (id ? dokumenteAll.filter((d) => d.fallId === id) : []),
    [id, dokumenteAll],
  );

  // ── Core data ──────────────────────────────────────────────
  const {
    fall, setFall, mandant, setMandant, weitereMandanten, wiedervorlagen, setWiedervorlagen,
    setParteienMap, alleParteien, setAlleParteien, schriftverkehr, setSchriftverkehr, loading,
  } = useFallDetailData(id);

  // ── Datei / Upload state ───────────────────────────────────
  const {
    uploadsForFall, setUploadsForFall,
    uploadDialogOpen, uploadQueue, setUploadQueue, uploadTagOptions, uploadTag, setUploadTag,
    uploadTagNeu, setUploadTagNeu, isDragOverUpload, setIsDragOverUpload,
    docsTab, setDocsTab, docsTypeFilter, setDocsTypeFilter, uploadsViewMode, setUploadsViewMode,
    dokumentVorschau, uploadPreviewIds, uploadPreviewIndex,
    dokumentVorschauListeOpen, setDokumentVorschauListeOpen,
    dateiBrowserSuche, setDateiBrowserSuche, dateiBrowserViewMode, setDateiBrowserViewMode,
    dateiBrowserGefiltert,
    closeDokumentVorschau, openDokumentVorschau, openUploadVorschau, handleUploadPreviewStep,
    openDateiBrowser, resetUploadDialog, openUploadDialog, enqueueUploadFiles,
    handleUploadTagAdd, handleUploadSave,
  } = useDateien(fall, kanzlei, dokumentePdfForFall);

  // ── Aktivität state ────────────────────────────────────────
  const {
    aktivitaetDialog, aktivitaetBetreff, setAktivitaetBetreff, aktivitaetDraft, setAktivitaetDraft,
    aktivitaetBearbeitenId, aktivitaetLoeschenDialog, setAktivitaetLoeschenDialog,
    aktivitaetLesen, setAktivitaetLesen,
    fallAktivitaetSuche, setFallAktivitaetSuche, fallAktivitaetFilter, setFallAktivitaetFilter,
    fallaktivitaetOpen, setFallaktivitaetOpen,
    fallAktivitaetZeilen, fallAktivitaetZeilenGefiltert,
    openAktivitaetDialog, closeAktivitaetDialog, handleAktivitaetSpeichern,
    handleAktivitaetBearbeitenAusListe, handleAktivitaetLoeschenAusListe,
    handleAktivitaetLoeschenBestaetigt,
    setTimelineNotizErledigtAufgabeId, setAktivitaetBearbeitenId, setAktivitaetDialog,
  } = useFallaktivitaet(fall, setFall, schriftverkehr, uploadsForFall, dokumentePdfForFall);

  // ── Edit-Fall form state ───────────────────────────────────
  const editFallForm = useEditFallForm(fall, setFall);

  // ── Parteien state ─────────────────────────────────────────
  const vrParteien = useVrParteien(
    fall, alleParteien, setFall,
    setAlleParteien as (fn: (prev: import('../../types').Partei[]) => import('../../types').Partei[]) => void,
    setParteienMap as (fn: (prev: Record<string, import('../../types').Partei>) => Record<string, import('../../types').Partei>) => void,
    navigate,
  );

  // ── Phase navigation ───────────────────────────────────────
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

  const handlePhaseVor = async () => {
    if (!fall) return;
    const nums = useAufgabenStore.getState().getPhasenNummern(fall.rechtsgebiet as AufgabeRechtsgebiet);
    const maxP = nums[nums.length - 1] ?? 1;
    if (fall.phase >= maxP) return;
    const von = fall.phase;
    const updated = await faelleApi.update(fall.id, { phase: (fall.phase + 1) as Fall['phase'] });
    const withAct = await faelleApi.addAktivitaet(updated.id, { typ: 'phase_geaendert', titel: 'Phase geändert', meta: { von, nach: updated.phase } });
    setFall(withAct);
  };

  const handlePhaseZurueck = async () => {
    if (!fall || fall.phase <= 1) return;
    const von = fall.phase;
    const updated = await faelleApi.update(fall.id, { phase: (fall.phase - 1) as Fall['phase'] });
    const withAct = await faelleApi.addAktivitaet(updated.id, { typ: 'phase_geaendert', titel: 'Phase geändert', meta: { von, nach: updated.phase } });
    setFall(withAct);
  };

  const handleWvErledigen = async (wvId: string) => {
    await wiedervorlagenApi.erledigen(wvId);
    setWiedervorlagen((prev) => prev.filter((w) => w.id !== wvId));
  };

  const handleSvDelete = async (svId: string) => {
    await schriftverkehrApi.delete(svId);
    setSchriftverkehr((prev) => prev.filter((s) => s.id !== svId));
  };

  // ── Dialog state ───────────────────────────────────────────
  const [wvDialogOpen, setWvDialogOpen] = useState(false);
  const [svDialogOpen, setSvDialogOpen] = useState(false);
  const [svInitialTyp, setSvInitialTyp] = useState<string | undefined>();
  const [svInitialVorlageId, setSvInitialVorlageId] = useState<string | undefined>();
  const [svBearbeitenItem, setSvBearbeitenItem] = useState<import('../../types').Schriftverkehr | undefined>();
  const [mandantEditOpen, setMandantEditOpen] = useState(false);
  const [fallInfoDialogOpen, setFallInfoDialogOpen] = useState(false);
  const [mandantSidebarOpen, setMandantSidebarOpen] = useState(false);

  // Schadenskalkulation
  const { addKalkulation, updateKalkulation, getByFallId } = useSchadenskalkulationStore();
  const [skDialogOpen, setSkDialogOpen] = useState(false);
  const [skEditItem, setSkEditItem] = useState<Schadenskalkulation | undefined>();
  const kalkulationen = fall ? getByFallId(fall.id) : [];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }
  if (!fall) return <Alert severity="error">Fall nicht gefunden.</Alert>;

  const rgMeta = {
    verkehrsrecht: { label: 'Verkehrsrecht', short: 'VR', color: 'info' as const, icon: <DirectionsCarIcon color="info" /> },
    arbeitsrecht: { label: 'Arbeitsrecht', short: 'AR', color: 'secondary' as const, icon: <WorkIcon color="secondary" /> },
    zivilrecht: { label: 'Zivilrecht', short: 'ZR', color: 'warning' as const, icon: <BalanceIcon color="warning" /> },
    insolvenzrecht: { label: 'Insolvenzrecht', short: 'IR', color: 'warning' as const, icon: <AccountBalanceIcon color="warning" /> },
    wettbewerbsrecht: { label: 'Wettbewerbsrecht', short: 'WB', color: 'warning' as const, icon: <GavelIcon color="warning" /> },
    erbrecht: { label: 'Erbrecht', short: 'ER', color: 'info' as const, icon: <FamilyRestroomIcon color="info" /> },
  }[fall.rechtsgebiet];
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 0.5, sm: 0 } }}>
      {/* Top-Bar: Aktenzeichen + Status + Breadcrumb + Aktionen (kompakt, mobile-tauglich) */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2.5 }}
        gap={1.25}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ rowGap: 0.5 }}
        >
          {rgMeta.icon}
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}>
            {fall.aktenzeichen}
          </Typography>
          <Chip
            label={fall.status.toUpperCase()}
            size="small"
            sx={{
              height: 20,
              bgcolor: fall.status === 'aktiv' ? 'success.light' : 'action.selected',
              color: fall.status === 'aktiv' ? 'success.dark' : 'text.secondary',
              fontWeight: 700,
              '& .MuiChip-label': { px: 0.9, fontSize: '0.68rem' },
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'inline' } }}>/</Typography>
          <Breadcrumbs
            separator="›"
            sx={{
              '& .MuiBreadcrumbs-li': { alignItems: 'center' },
              '& .MuiBreadcrumbs-ol': { flexWrap: 'wrap' },
            }}
          >
            <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/faelle')}>
              Fälle
            </Link>
            <Typography variant="body2" color="primary.main" fontWeight={600}>Aktueller Fall</Typography>
          </Breadcrumbs>
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          justifyContent={{ xs: 'space-between', md: 'flex-end' }}
          alignItems="center"
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/faelle')}
            variant="text"
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            Zurück
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => editFallForm.setStatusDialogOpen(true)}
          >
            Fall bearbeiten
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

      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {/* Phasen-Timeline (kompakt) */}
        <Grid size={{ xs: 12 }}>
          <Paper
            variant="outlined"
            sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3, borderColor: 'rgba(15, 23, 42, 0.08)', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={0.5}>
              <Typography variant="h6" fontWeight={600}>
                Fallfortschritt
              </Typography>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700 }}>
                PHASE {fall.phase} VON {maxPhaseNummer}
              </Typography>
            </Stack>
            <Box sx={{ overflowX: { xs: 'auto', md: 'visible' }, mx: { xs: -0.5, md: 0 }, px: { xs: 0.5, md: 0 } }}>
              <PhaseTimeline rechtsgebiet={fall.rechtsgebiet} aktuellePhase={fall.phase} vertikal={false} />
            </Box>
          </Paper>
        </Grid>

        {/* Left: Phasendetails + Schriftverkehr + Fallaktivität */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            {/* Phasendetails */}
            <Paper
              variant="outlined"
              sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3, borderColor: 'rgba(15, 23, 42, 0.08)', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                gap={1}
                mb={2}
                sx={{
                  mx: { xs: -1.5, md: -2.5 },
                  mt: { xs: -1.5, md: -2.5 },
                  px: { xs: 1.5, md: 2.5 },
                  py: 1.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'action.hover',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AssignmentIcon color="primary" fontSize="small" />
                  <Typography variant="h6" fontWeight={600}>Phasendetails</Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ rowGap: 0.75 }}>
                  {fall.phase > 1 && (
                    <Button variant="outlined" size="small" startIcon={<ArrowBackIcon />}
                      disabled={fall.status !== 'aktiv'} onClick={handlePhaseZurueck}>
                      Phase {fall.phase - 1}
                    </Button>
                  )}
                  <Button variant="contained" size="small" endIcon={<ArrowForwardIcon />}
                    disabled={fall.phase >= maxPhaseNummer || fall.status !== 'aktiv'} onClick={handlePhaseVor}>
                    Phase {fall.phase + 1}
                  </Button>
                </Stack>
              </Stack>
              <PhaseTimeline
                rechtsgebiet={fall.rechtsgebiet}
                aktuellePhase={fall.phase}
                vertikal={true}
                fallId={fall.id}
                fallStartDatum={fall.erstelltAm}
                onSchriftverkehrErstellen={({ typId, standardTextvorlageId }) => {
                  setSvInitialTyp(typId);
                  setSvInitialVorlageId(standardTextvorlageId);
                  setSvDialogOpen(true);
                }}
                onUploadErstellen={({ uploadErwartung }) => {
                  openUploadDialog(uploadErwartungToDateiKategorie(uploadErwartung));
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

            {/* Schriftverkehr */}
            <SchriftverkehrCard
              schriftverkehr={schriftverkehr}
              onNeu={() => { setSvBearbeitenItem(undefined); setSvDialogOpen(true); }}
              onDelete={(id) => void handleSvDelete(id)}
              onBearbeiten={(sv) => { setSvBearbeitenItem(sv); setSvDialogOpen(true); }}
            />

            {/* Schadenskalkulation (nur Verkehrsrecht) */}
            {fall.rechtsgebiet === 'verkehrsrecht' && (
              <Paper
                variant="outlined"
                sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 3, borderColor: 'rgba(15, 23, 42, 0.08)', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    mx: { xs: -1.5, md: -2.5 },
                    mt: { xs: -1.5, md: -2.5 },
                    px: { xs: 1.5, md: 2.5 },
                    py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                    mb: 2,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalculateIcon color="primary" fontSize="small" />
                    <Typography variant="h6" fontWeight={600}>Schadenskalkulation</Typography>
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => { setSkEditItem(undefined); setSkDialogOpen(true); }}
                  >
                    Neue Kalkulation
                  </Button>
                </Stack>

                {kalkulationen.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                    Noch keine Schadenskalkulation erstellt.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {[...kalkulationen]
                      .sort((a, b) => new Date(b.erstelltAm).getTime() - new Date(a.erstelltAm).getTime())
                      .map((sk) => (
                        <Box key={sk.id}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {new Date(sk.datum).toLocaleDateString('de-DE')}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                  Schaden: {formatEuro(sk.schadensumme)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">·</Typography>
                                <Typography variant="caption" color="primary.main" fontWeight={600}>
                                  Gesamt: {formatEuro(sk.gesamtforderung)}
                                </Typography>
                              </Stack>
                            </Box>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="PDF herunterladen">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (!mandant) return;
                                    const parteienMapRec: Record<string, import('../../types').Partei> = {};
                                    alleParteien.forEach((p) => { parteienMapRec[p.id] = p; });
                                    druckeSchadenskalkulationAlsPdf(sk, fall, mandant, kanzlei, parteienMapRec[fall.verkehrsrecht?.versicherungId ?? '']);
                                  }}
                                >
                                  <PictureAsPdfIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Bearbeiten">
                                <IconButton size="small" onClick={() => { setSkEditItem(sk); setSkDialogOpen(true); }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                          <Divider sx={{ mt: 1 }} />
                        </Box>
                      ))}
                  </Stack>
                )}
              </Paper>
            )}

            {/* Fallaktivität */}
            <FallaktivitaetCard
              zeilen={fallAktivitaetZeilen}
              zeilenGefiltert={fallAktivitaetZeilenGefiltert}
              suche={fallAktivitaetSuche}
              filter={fallAktivitaetFilter}
              open={fallaktivitaetOpen}
              onSucheChange={setFallAktivitaetSuche}
              onFilterChange={setFallAktivitaetFilter}
              onFilterReset={() => setFallAktivitaetFilter(new Set())}
              onToggleOpen={() => setFallaktivitaetOpen((o) => !o)}
              onNotiz={() => openAktivitaetDialog('notiz')}
              onAnruf={() => openAktivitaetDialog('anruf')}
              onVolltext={(z) => setAktivitaetLesen({ titel: z.titel, text: z.beschreibung ?? '' })}
              onBearbeiten={handleAktivitaetBearbeitenAusListe}
              onLoeschen={handleAktivitaetLoeschenAusListe}
            />
          </Stack>
        </Grid>

        {/* Right: Mandant/Parteien + Dokumente */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={{ xs: 2, md: 3 }}>
            <MandantParteienCard
              fall={fall}
              mandant={mandant}
              weitereMandanten={weitereMandanten}
              wiedervorlagen={wiedervorlagen}
              vrBeteiligteZeilen={vrParteien.vrBeteiligteZeilen}
              arbeitsParteiSlots={vrParteien.arbeitsParteiSlots}
              beteiligteAmFall={vrParteien.beteiligteAmFall}
              parteiBlockOpen={vrParteien.parteiBlockOpen}
              mandantSidebarOpen={mandantSidebarOpen}
              onToggleMandantSidebar={() => setMandantSidebarOpen((o) => !o)}
              onFallInfoOpen={() => setFallInfoDialogOpen(true)}
              onFallBearbeiten={() => editFallForm.setStatusDialogOpen(true)}
              onWvHinzufuegen={() => setWvDialogOpen(true)}
              onWvErledigen={(wvId) => void handleWvErledigen(wvId)}
              onMandantBearbeiten={() => setMandantEditOpen(true)}
              onWeitererMandantHinzufuegen={() => void vrParteien.openWeitererMandantDialog()}
              onWeitererMandantEntfernen={(mid) => void vrParteien.handleWeiterenMandantEntfernen(mid)}
              onParteiBlockToggle={(blockId) =>
                vrParteien.setParteiBlockOpen((prev) => ({ ...prev, [blockId]: !prev[blockId] }))
              }
              onVrParteiHinzufuegen={vrParteien.openVrParteiDialog}
              onVrEintragEntfernen={(eintragId) => void vrParteien.handleVrEintragEntfernen(eintragId)}
              onVrParteiAustauschen={(eintragId, label, parteiId, rolle) => {
                vrParteien.setParteiAustauschNeu('');
                vrParteien.setParteiZumAustauschen({
                  scope: 'vr-eintrag',
                  eintragId,
                  label,
                  aktuelleId: parteiId,
                  typ: rolle as import('../../types').ParteienTyp,
                });
              }}
              onArParteiZuweisen={(key, label, rawId, typ) => {
                vrParteien.setParteiAustauschNeu('');
                vrParteien.setParteiZumAustauschen({
                  scope: 'ar', key, label, aktuelleId: rawId ?? '', typ: typ as import('../../types').ParteienTyp,
                });
              }}
              onZrParteiZuweisen={(key, label, rawId, typ) => {
                vrParteien.setParteiAustauschNeu('');
                vrParteien.setParteiZumAustauschen({
                  scope: 'zr', key, label, aktuelleId: rawId, typ: typ as import('../../types').ParteienTyp,
                });
              }}
              onParteiBearbeiten={vrParteien.setParteiZumEditieren}
              onNeueParteiVr={(rolle) => vrParteien.setNeueParteiSlot({ context: 'vr', rolle: rolle as import('../../types').ParteienTyp })}
              onNeueParteiAr={(key, typ) => vrParteien.setNeueParteiSlot({ context: 'ar', key, typ: typ as import('../../types').ParteienTyp })}
            />

            <DateienCard
              fallId={fall.id}
              kanzlei={kanzlei}
              dokumente={getDokumenteByFall(fall.id)}
              uploads={uploadsForFall}
              docsTab={docsTab}
              docsTypeFilter={docsTypeFilter}
              uploadsViewMode={uploadsViewMode}
              onTabChange={(tab) => { setDocsTab(tab); setDocsTypeFilter(new Set()); }}
              onTypeFilterChange={setDocsTypeFilter}
              onTypeFilterReset={() => setDocsTypeFilter(new Set())}
              onViewModeChange={setUploadsViewMode}
              onSearch={openDateiBrowser}
              onUploadOpen={() => openUploadDialog()}
              onDokumentVorschau={openDokumentVorschau}
              onUploadVorschau={openUploadVorschau}
              onUploadDelete={(uploadId) =>
                void uploadsApi.delete(fall.id, uploadId).then(() =>
                  setUploadsForFall((prev) => prev.filter((x) => x.id !== uploadId)),
                )
              }
              onDokumentDelete={deleteDokument}
            />
          </Stack>
        </Grid>
      </Grid>

      {/* ── Dialogs ─────────────────────────────────────────── */}

      <AktivitaetDialog
        open={aktivitaetDialog !== null}
        typ={aktivitaetDialog}
        betreff={aktivitaetBetreff}
        draft={aktivitaetDraft}
        isBearbeiten={!!aktivitaetBearbeitenId}
        onBetreffChange={setAktivitaetBetreff}
        onDraftChange={setAktivitaetDraft}
        onClose={closeAktivitaetDialog}
        onSpeichern={() => void handleAktivitaetSpeichern()}
      />

      <AktivitaetLesenDialog
        open={aktivitaetLesen !== null}
        titel={aktivitaetLesen?.titel}
        text={aktivitaetLesen?.text}
        onClose={() => setAktivitaetLesen(null)}
      />

      <AktivitaetLoeschenDialog
        open={aktivitaetLoeschenDialog !== null}
        titel={aktivitaetLoeschenDialog?.titel}
        onClose={() => setAktivitaetLoeschenDialog(null)}
        onBestaetigt={() => void handleAktivitaetLoeschenBestaetigt()}
      />

      <UploadDialog
        open={uploadDialogOpen}
        uploadQueue={uploadQueue}
        uploadTagOptions={uploadTagOptions}
        uploadTag={uploadTag}
        uploadTagNeu={uploadTagNeu}
        isDragOver={isDragOverUpload}
        onClose={resetUploadDialog}
        onSave={handleUploadSave}
        onTagChange={setUploadTag}
        onTagNeuChange={setUploadTagNeu}
        onTagAdd={handleUploadTagAdd}
        onFilesEnqueued={enqueueUploadFiles}
        onFileRemove={(idx) => setUploadQueue((prev) => prev.filter((_, i) => i !== idx))}
        onDragOverChange={setIsDragOverUpload}
      />

      <DateiBrowserDialog
        open={dokumentVorschau !== null}
        fallId={fall.id}
        dokumentVorschau={dokumentVorschau}
        dokumentVorschauListeOpen={dokumentVorschauListeOpen}
        dateiBrowserSuche={dateiBrowserSuche}
        dateiBrowserViewMode={dateiBrowserViewMode}
        dateiBrowserGefiltert={dateiBrowserGefiltert}
        uploadPreviewIds={uploadPreviewIds}
        uploadPreviewIndex={uploadPreviewIndex}
        onClose={closeDokumentVorschau}
        onSucheChange={setDateiBrowserSuche}
        onViewModeChange={setDateiBrowserViewMode}
        onUploadVorschau={openUploadVorschau}
        onDokumentVorschau={openDokumentVorschau}
        onPreviewStep={handleUploadPreviewStep}
        onAlleeDateienOeffnen={() => {
          setDocsTab('uploads');
          setDokumentVorschauListeOpen(true);
        }}
      />

      <EditFallDialog
        open={editFallForm.statusDialogOpen}
        fall={fall}
        neuerStatus={editFallForm.neuerStatus}
        onNeuerStatusChange={editFallForm.setNeuerStatus}
        vrAbrechnungsart={editFallForm.vrAbrechnungsart}
        onVrAbrechnungsartChange={editFallForm.setVrAbrechnungsart}
        vrAnspruchsinhaber={editFallForm.vrAnspruchsinhaber}
        onVrAnspruchsinhaberChange={editFallForm.setVrAnspruchsinhaber}
        vrKennzeichen={editFallForm.vrKennzeichen}
        onVrKennzeichenChange={editFallForm.setVrKennzeichen}
        vrFahrzeugTyp={editFallForm.vrFahrzeugTyp}
        onVrFahrzeugTypChange={editFallForm.setVrFahrzeugTyp}
        vrBaujahr={editFallForm.vrBaujahr}
        onVrBaujahrChange={editFallForm.setVrBaujahr}
        vrErstzulassung={editFallForm.vrErstzulassung}
        onVrErstzulassungChange={editFallForm.setVrErstzulassung}
        vrSchadenshoehe={editFallForm.vrSchadenshoehe}
        onVrSchadenhoheChange={editFallForm.setVrSchadenshoehe}
        vrGutachtenwert={editFallForm.vrGutachtenwert}
        onVrGutachtenwertChange={editFallForm.setVrGutachtenwert}
        vrReparaturkosten={editFallForm.vrReparaturkosten}
        onVrReparaturkostenChange={editFallForm.setVrReparaturkosten}
        vrNutzungsausfall={editFallForm.vrNutzungsausfall}
        onVrNutzungsausfallChange={editFallForm.setVrNutzungsausfall}
        vrMietwagen={editFallForm.vrMietwagen}
        onVrMietwagenChange={editFallForm.setVrMietwagen}
        vrPolizeiAufnahme={editFallForm.vrPolizeiAufnahme}
        onVrPolizeiAufnahmeChange={editFallForm.setVrPolizeiAufnahme}
        vrPolizeiAz={editFallForm.vrPolizeiAz}
        onVrPolizeiAzChange={editFallForm.setVrPolizeiAz}
        vrStaFall={editFallForm.vrStaFall}
        onVrStaFallChange={editFallForm.setVrStaFall}
        vrJustizAz={editFallForm.vrJustizAz}
        onVrJustizAzChange={editFallForm.setVrJustizAz}
        arFalltyp={editFallForm.arFalltyp}
        onArFalltypChange={editFallForm.setArFalltyp}
        arKuendigungsdatum={editFallForm.arKuendigungsdatum}
        onArKuendigungsdatumChange={editFallForm.setArKuendigungsdatum}
        arFristEnde={editFallForm.arFristEnde}
        onArFristEndeChange={editFallForm.setArFristEnde}
        arLohnrueckstand={editFallForm.arLohnrueckstand}
        onArLohnrueckstandChange={editFallForm.setArLohnrueckstand}
        zrFalltyp={editFallForm.zrFalltyp}
        onZrFalltypChange={editFallForm.setZrFalltyp}
        zrGegenseite={editFallForm.zrGegenseite}
        onZrGegenseiteChange={editFallForm.setZrGegenseite}
        zrForderungsbetrag={editFallForm.zrForderungsbetrag}
        onZrForderungsbetragChange={editFallForm.setZrForderungsbetrag}
        zrStreitwert={editFallForm.zrStreitwert}
        onZrStreitwertChange={editFallForm.setZrStreitwert}
        zrMahnfristEnde={editFallForm.zrMahnfristEnde}
        onZrMahnfristEndeChange={editFallForm.setZrMahnfristEnde}
        zrKlageEingereichtAm={editFallForm.zrKlageEingereichtAm}
        onZrKlageEingereichtAmChange={editFallForm.setZrKlageEingereichtAm}
        irFalltyp={editFallForm.irFalltyp}
        onIrFalltypChange={editFallForm.setIrFalltyp}
        irSchuldner={editFallForm.irSchuldner}
        onIrSchuldnerChange={editFallForm.setIrSchuldner}
        irForderungsbetrag={editFallForm.irForderungsbetrag}
        onIrForderungsbetragChange={editFallForm.setIrForderungsbetrag}
        irInsolvenzgericht={editFallForm.irInsolvenzgericht}
        onIrInsolvenzgerichtChange={editFallForm.setIrInsolvenzgericht}
        irInsolvenzAktenzeichen={editFallForm.irInsolvenzAktenzeichen}
        onIrInsolvenzAktenzeichenChange={editFallForm.setIrInsolvenzAktenzeichen}
        irAntragsdatum={editFallForm.irAntragsdatum}
        onIrAntragsdatumChange={editFallForm.setIrAntragsdatum}
        irEroeffnungsdatum={editFallForm.irEroeffnungsdatum}
        onIrEroeffnungsdatumChange={editFallForm.setIrEroeffnungsdatum}
        wbFalltyp={editFallForm.wbFalltyp}
        onWbFalltypChange={editFallForm.setWbFalltyp}
        wbGegenseite={editFallForm.wbGegenseite}
        onWbGegenseiteChange={editFallForm.setWbGegenseite}
        wbVerletzungshandlung={editFallForm.wbVerletzungshandlung}
        onWbVerletzungshandlungChange={editFallForm.setWbVerletzungshandlung}
        wbAbmahnungsdatum={editFallForm.wbAbmahnungsdatum}
        onWbAbmahnungsdatumChange={editFallForm.setWbAbmahnungsdatum}
        wbFristsetzung={editFallForm.wbFristsetzung}
        onWbFristsetzungChange={editFallForm.setWbFristsetzung}
        wbStreitwert={editFallForm.wbStreitwert}
        onWbStreitwertChange={editFallForm.setWbStreitwert}
        erFalltyp={editFallForm.erFalltyp}
        onErFalltypChange={editFallForm.setErFalltyp}
        erErblasser={editFallForm.erErblasser}
        onErErblasserChange={editFallForm.setErErblasser}
        erTodesdatum={editFallForm.erTodesdatum}
        onErTodesdatumChange={editFallForm.setErTodesdatum}
        erNachlassgericht={editFallForm.erNachlassgericht}
        onErNachlassgerichtChange={editFallForm.setErNachlassgericht}
        erNachlassAktenzeichen={editFallForm.erNachlassAktenzeichen}
        onErNachlassAktenzeichenChange={editFallForm.setErNachlassAktenzeichen}
        erForderungsbetrag={editFallForm.erForderungsbetrag}
        onErForderungsbetragChange={editFallForm.setErForderungsbetrag}
        onClose={() => editFallForm.setStatusDialogOpen(false)}
        onSave={() => void editFallForm.handleStatusAendern()}
      />

      <FallInfoDialog
        open={fallInfoDialogOpen}
        fall={fall}
        maxPhaseNummer={maxPhaseNummer}
        onClose={() => setFallInfoDialogOpen(false)}
      />

      <WiedervorlageDialog
        open={wvDialogOpen}
        fallId={fall.id}
        onClose={() => setWvDialogOpen(false)}
        onSaved={(wv) => {
          setWiedervorlagen((prev) => [...prev, wv]);
          setWvDialogOpen(false);
        }}
      />

      <VrParteiHinzufuegenDialog
        open={vrParteien.vrParteiHinzufuegenOpen}
        suche={vrParteien.vrParteiHinzufuegenSuche}
        stammFilter={vrParteien.vrParteiStammFilter}
        auswahl={vrParteien.vrParteiAuswahl}
        parteienGezeigt={vrParteien.vrStammParteienGezeigt}
        onClose={vrParteien.closeVrParteiDialog}
        onSucheChange={vrParteien.setVrParteiHinzufuegenSuche}
        onStammFilterChange={vrParteien.setVrParteiStammFilter}
        onToggleAuswahl={vrParteien.toggleVrParteiAuswahl}
        onHinzufuegen={() => void vrParteien.handleVrParteienMultiZuordnen()}
        onNeueParteiAnlegen={(rolle) => {
          vrParteien.setNeueParteiSlot({ context: 'vr', rolle });
          vrParteien.setVrParteiHinzufuegenOpen(false);
          vrParteien.setVrParteiHinzufuegenSuche('');
          vrParteien.setVrParteiStammFilter('alle');
        }}
      />

      <WeitereMandantenDialog
        open={vrParteien.weitererMandantDialogOpen}
        fall={fall}
        suche={vrParteien.weitererMandantSuche}
        kandidaten={vrParteien.mandantenWeiterePicker}
        onClose={() => { vrParteien.setWeitererMandantDialogOpen(false); vrParteien.setWeitererMandantSuche(''); }}
        onSucheChange={vrParteien.setWeitererMandantSuche}
        onHinzufuegen={(mid) => void vrParteien.handleWeiterenMandantHinzufuegen(mid)}
      />

      <ParteiAustauschDialog
        open={vrParteien.parteiZumAustauschen !== null}
        ziel={vrParteien.parteiZumAustauschen}
        suche={vrParteien.parteiAustauschSuche}
        ausgewaehltId={vrParteien.parteiAustauschNeu}
        kandidaten={alleParteien}
        onClose={() => { vrParteien.setParteiZumAustauschen(null); vrParteien.setParteiAustauschSuche(''); }}
        onSucheChange={vrParteien.setParteiAustauschSuche}
        onAuswaehlen={vrParteien.setParteiAustauschNeu}
        onUebernehmen={() => void vrParteien.handleParteiAustauschen()}
      />

      {/* Schriftverkehr-Dialog */}
      <SchriftverkehrDialog
        open={svDialogOpen}
        fall={fall}
        mandant={mandant}
        parteien={alleParteien}
        initialTyp={svInitialTyp}
        initialTextvorlageId={svInitialVorlageId}
        initialSv={svBearbeitenItem}
        onClose={() => { setSvDialogOpen(false); setSvInitialTyp(undefined); setSvInitialVorlageId(undefined); setSvBearbeitenItem(undefined); }}
        onSaved={(sv) => {
          if (svBearbeitenItem) {
            // Bearbeiten: in-place aktualisieren
            setSchriftverkehr((prev) => prev.map((s) => s.id === sv.id ? sv : s));
          } else {
            // Neu: vorne einsetzen + Aufgabe erledigen
            setSchriftverkehr((prev) => [sv, ...prev]);
            markiereBySchriftverkehrTyp(
              fall.id,
              fall.rechtsgebiet as AufgabeRechtsgebiet,
              fall.phase,
              sv.typ,
            );
          }
        }}
        onWiedervorlageCreated={async (wv) => {
          setWiedervorlagen((prev) => [...prev, wv]);
          const u = await faelleApi.addAktivitaet(fall.id, {
            typ: 'wiedervorlage',
            titel: 'Wiedervorlage angelegt',
            beschreibung: wv.beschreibung,
            meta: { faelligAm: wv.faelligAm, wvId: wv.id },
          });
          setFall(u);
        }}
      />

      {/* Mandant bearbeiten */}
      {mandant && (
        <MandantDialog
          open={mandantEditOpen}
          mandant={mandant}
          onClose={() => setMandantEditOpen(false)}
          onSaved={(updated) => { setMandant(updated); setMandantEditOpen(false); }}
        />
      )}

      {/* Partei bearbeiten */}
      <ParteiDialog
        open={vrParteien.parteiZumEditieren !== null}
        partei={vrParteien.parteiZumEditieren ?? undefined}
        onClose={() => vrParteien.setParteiZumEditieren(null)}
        onSaved={(updated) => {
          setParteienMap((prev) => ({ ...prev, [updated.id]: updated }));
          setAlleParteien((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          vrParteien.setParteiZumEditieren(null);
        }}
      />

      {/* Neue Partei anlegen */}
      <ParteiDialog
        open={vrParteien.neueParteiSlot !== null}
        defaultTyp={
          vrParteien.neueParteiSlot?.context === 'vr'
            ? vrParteien.neueParteiSlot.rolle
            : (vrParteien.neueParteiSlot?.typ ?? 'versicherung')
        }
        onClose={() => vrParteien.setNeueParteiSlot(null)}
        onSaved={(p) => void vrParteien.handleNeueParteiGespeichert(p)}
      />

      {/* Schadenskalkulation-Dialog (nur VR) */}
      {fall.rechtsgebiet === 'verkehrsrecht' && mandant && (
        <SchadenskalkulationDialog
          open={skDialogOpen}
          onClose={() => { setSkDialogOpen(false); setSkEditItem(undefined); }}
          onSave={(k) => {
            if (skEditItem) {
              updateKalkulation(k.id, k);
            } else {
              addKalkulation(k);
            }
            setSkDialogOpen(false);
            setSkEditItem(undefined);
          }}
          fall={fall}
          mandant={mandant}
          parteienMap={Object.fromEntries(alleParteien.map((p) => [p.id, p]))}
          initial={skEditItem}
        />
      )}
    </Box>
  );
}
