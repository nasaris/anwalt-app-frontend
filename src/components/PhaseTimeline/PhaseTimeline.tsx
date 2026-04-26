import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  StepConnector,
  stepConnectorClasses,
  Checkbox,
  FormControlLabel,
  Stack,
  LinearProgress,
  Tooltip,
  IconButton,
  TextField,
  Button,
  InputAdornment,
  Chip,
  Popover,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EventIcon from '@mui/icons-material/Event';
import { styled } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import type { StepIconProps } from '@mui/material/StepIcon';
import type { Rechtsgebiet } from '../../types';
import {
  useAufgabenStore,
  effectiveAktion,
  effectivePrioritaet,
  type AufgabeRechtsgebiet,
  type AufgabePrioritaet,
  type UploadErwartung,
} from '../../store/aufgabenStore';

const PRIO_COLORS: Record<AufgabePrioritaet, 'error' | 'warning' | 'default'> = {
  hoch: 'error',
  normal: 'default',
  niedrig: 'default',
};
const PRIO_LABELS: Record<AufgabePrioritaet, string> = {
  hoch: 'HOCH',
  normal: 'NORMAL',
  niedrig: 'NIEDRIG',
};

const JuristConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 14 },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[700],
    borderTopWidth: 2,
    borderRadius: 999,
  },
}));

export interface SchriftverkehrErstellenPayload {
  typId: string;
  standardTextvorlageId?: string;
}

interface PhaseTimelineProps {
  rechtsgebiet: Rechtsgebiet;
  aktuellePhase: number;
  vertikal?: boolean;
  fallId?: string;
  /** ISO-Falldatum (erstelltAm) als Basis für relative Fristen in Tagen */
  fallStartDatum?: string;
  /** Öffnet Schriftverkehr mit Typ und optional gewählter Standardvorlage */
  onSchriftverkehrErstellen?: (payload: SchriftverkehrErstellenPayload) => void;
  /** Akten-Upload mit optionaler Dokument-Kategorie */
  onUploadErstellen?: (payload: { uploadErwartung?: UploadErwartung }) => void;
  /** Telefon: Dialog „Anruf dokumentieren“, Betreff = Aufgabentext */
  onAufgabeAnrufDokumentieren?: (payload: { aufgabeId: string; aufgabenText: string }) => void;
  /** Notiz-Icon: Notiz-Dialog; nach Speichern kann die Aufgabe automatisch erledigt werden */
  onAufgabeNotiz?: (payload: { aufgabeId: string; aufgabenText: string }) => void;
}

export default function PhaseTimeline({
  rechtsgebiet,
  aktuellePhase,
  vertikal = false,
  fallId,
  fallStartDatum,
  onSchriftverkehrErstellen,
  onUploadErstellen,
  onAufgabeAnrufDokumentieren,
  onAufgabeNotiz,
}: PhaseTimelineProps) {
  const rg = rechtsgebiet as AufgabeRechtsgebiet;
  const phasenNummernSlice = useAufgabenStore((s) => s.phasenNummern[rg]);
  const phaseLabelSlice = useAufgabenStore((s) => s.phaseLabelOverrides[rg]);
  const phasenKonfig = useMemo(
    () => useAufgabenStore.getState().getPhasenKonfiguration(rg),
    [rg, phasenNummernSlice, phaseLabelSlice],
  );
  const idxAktiv = phasenKonfig.findIndex((p) => p.nummer === aktuellePhase);
  const activeStep = idxAktiv >= 0 ? idxAktiv : Math.max(0, Math.min(aktuellePhase - 1, phasenKonfig.length - 1));

  const getAufgaben = useAufgabenStore((s) => s.getAufgaben);
  const customAufgabenProFall = useAufgabenStore((s) => s.customAufgabenProFall);
  const ausgeblendetProFall = useAufgabenStore((s) => s.ausgeblendetProFall);
  const addFallAufgabe = useAufgabenStore((s) => s.addFallAufgabe);
  const hideAufgabeImFall = useAufgabenStore((s) => s.hideAufgabeImFall);
  const deleteFallAufgabe = useAufgabenStore((s) => s.deleteFallAufgabe);
  const setReihenfolgeInPhase = useAufgabenStore((s) => s.setReihenfolgeInPhase);
  const erledigtProFall = useAufgabenStore((s) => s.erledigtProFall);
  const toggleErledigt = useAufgabenStore((s) => s.toggleErledigt);
  const fallAufgabenMeta = useAufgabenStore((s) => s.fallAufgabenMeta);
  const setFallAufgabeFaelligkeit = useAufgabenStore((s) => s.setFallAufgabeFaelligkeit);

  const erledigtIds = fallId ? (erledigtProFall[fallId] ?? []) : [];
  const fallMeta = fallId ? (fallAufgabenMeta[fallId] ?? {}) : {};

  const [datepickerAnchor, setDatepickerAnchor] = useState<{ el: HTMLElement; aufgabeId: string } | null>(null);
  const [customTaskDrafts, setCustomTaskDrafts] = useState<Record<number, string>>({});
  const [expandedPhasen, setExpandedPhasen] = useState<Record<number, boolean>>({});
  const [showAllPhasen, setShowAllPhasen] = useState(false);

  const CompactStepIcon = (props: StepIconProps) => {
    const phaseNummer = Number(props.icon);
    if (props.completed) {
      return (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'common.white',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 15,
            lineHeight: 1,
            boxShadow: 1,
            border: '2px solid',
            borderColor: 'rgba(255,255,255,0.9)',
          }}
        >
          ✓
        </Box>
      );
    }
    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          bgcolor: props.active ? 'primary.main' : 'action.hover',
          color: props.active ? 'common.white' : 'text.secondary',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1,
          border: '1px solid',
          borderColor: props.active ? 'primary.main' : 'divider',
          boxShadow: props.active ? 1 : 0,
          transition: 'all 0.2s ease',
        }}
      >
        {phaseNummer}
      </Box>
    );
  };

  if (vertikal) {
    const aktivPhase = phasenKonfig[activeStep];

    return (
      <Box>
        {/* Toggle: nur aktuelle Phase vs. alle */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="caption" color="text.secondary">
            {showAllPhasen
              ? `Alle ${phasenKonfig.length} Phasen`
              : aktivPhase
                ? `Phase ${aktivPhase.nummer} von ${phasenKonfig.length}`
                : ''}
          </Typography>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowAllPhasen((o) => !o)}
            endIcon={showAllPhasen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ minWidth: 0, fontSize: '0.78rem', color: 'text.secondary', px: 1 }}
          >
            {showAllPhasen ? 'Nur aktuelle' : 'Alle Phasen'}
          </Button>
        </Stack>

      <Stepper
        activeStep={activeStep}
        orientation="vertical"
        connector={showAllPhasen ? undefined : null}
        sx={!showAllPhasen ? {
          '& .MuiStepContent-root': { borderLeft: 'none', ml: 0, pl: 0 },
          '& .MuiStepLabel-iconContainer': { pr: 1.5 },
        } : undefined}
      >
        {phasenKonfig.map((phase, i) => {
          const phaseNr = phase.nummer;
          const basisAufgaben = getAufgaben(rechtsgebiet as AufgabeRechtsgebiet, phaseNr);
          const fallAufgaben = fallId
            ? (customAufgabenProFall[fallId] ?? []).filter(
              (a) => a.rechtsgebiet === rg && a.phase === phaseNr,
            )
            : [];
          const ausgeblendetIds = fallId ? new Set(ausgeblendetProFall[fallId] ?? []) : new Set<string>();
          const aufgaben = [...basisAufgaben, ...fallAufgaben]
            .filter((a) => !ausgeblendetIds.has(a.id))
            .sort((a, b) => a.reihenfolge - b.reihenfolge);
          const erledigtCount = aufgaben.filter((a) => erledigtIds.includes(a.id)).length;
          const fortschritt = aufgaben.length > 0 ? (erledigtCount / aufgaben.length) * 100 : 0;
          const alleErledigt = aufgaben.length > 0 && erledigtCount === aufgaben.length;
          const isActive = i === activeStep;
          const expanded = isActive || expandedPhasen[phaseNr] === true;
          const visible = showAllPhasen || isActive;

          return (
            <Step
              key={`${phaseNr}-${phase.label}`}
              completed={i < activeStep || alleErledigt}
              expanded={expanded}
              sx={{ display: visible ? undefined : 'none' }}
            >
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    fontWeight: isActive ? 700 : 400,
                    color:
                      isActive ? 'primary.main' :
                      i < activeStep   ? 'success.main' :
                      'text.secondary',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: '100%' }}>
                  <span>{phase.label}</span>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {aufgaben.length > 0 && (
                      <Tooltip title={`${erledigtCount} von ${aufgaben.length} erledigt`}>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                          {erledigtCount}/{aufgaben.length}
                        </Typography>
                      </Tooltip>
                    )}
                    <Tooltip title={expanded ? 'Phase einklappen' : 'Phase aufklappen'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (isActive) return;
                            setExpandedPhasen((prev) => ({ ...prev, [phaseNr]: !expanded }));
                          }}
                          disabled={isActive}
                          sx={{ opacity: isActive ? 0.3 : 1 }}
                        >
                          {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Stack>
              </StepLabel>
              <StepContent>
                {aufgaben.length > 0 && (
                  <Box mb={1.5}>
                    <LinearProgress
                      variant="determinate"
                      value={fortschritt}
                      sx={{
                        height: 4,
                        borderRadius: 999,
                        mb: 1.5,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: alleErledigt ? 'success.main' : 'primary.main',
                        },
                      }}
                    />
                    <Stack spacing={0.25}>
                      {aufgaben.map((aufgabe, idx) => {
                        const erledigt = erledigtIds.includes(aufgabe.id);
                        const akt = effectiveAktion(aufgabe);
                        const zeigeBrief =
                          akt === 'brief' &&
                          !!aufgabe.schriftverkehrTypId &&
                          !!onSchriftverkehrErstellen;
                        const zeigeUpload = akt === 'upload' && !!onUploadErstellen;
                        const zeigeAnruf = akt === 'anruf';

                        const meta = fallMeta[aufgabe.id] ?? {};
                        const prio = effectivePrioritaet(aufgabe, meta);
                        const faelligAm = (() => {
                          if (meta.faelligAm) return meta.faelligAm;
                          if (aufgabe.faelligAm) return aufgabe.faelligAm;
                          if (typeof aufgabe.faelligInTagen === 'number' && Number.isFinite(aufgabe.faelligInTagen)) {
                            const basis = fallStartDatum ? new Date(fallStartDatum) : null;
                            if (basis && !Number.isNaN(basis.getTime())) {
                              const d = new Date(basis);
                              d.setDate(d.getDate() + Math.max(0, Math.floor(aufgabe.faelligInTagen)));
                              return d.toISOString().slice(0, 10);
                            }
                          }
                          return undefined;
                        })();
                        const erledigtAm = meta.erledigtAm;
                        const zeigtPrio = prio !== 'normal';

                        const faelligFormatted = (() => {
                          if (!faelligAm) return null;
                          try {
                            return new Date(faelligAm).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
                          } catch { return faelligAm; }
                        })();
                        const erledigtFormatted = (() => {
                          if (!erledigtAm) return null;
                          try {
                            return new Date(erledigtAm).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
                          } catch { return erledigtAm; }
                        })();

                        return (
                          <Stack key={aufgabe.id} direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
                            <FormControlLabel
                              sx={{ mx: 0, alignItems: 'flex-start', flex: 1, minWidth: 0 }}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={erledigt}
                                  disabled={!fallId}
                                  onChange={() => fallId && toggleErledigt(fallId, aufgabe.id)}
                                  sx={{
                                    py: 0.25, pr: 0.75, pl: 0,
                                    color: 'action.active',
                                    '& .MuiSvgIcon-root': { borderRadius: '50%' },
                                    '&.Mui-checked': {
                                      color: 'success.main',
                                    },
                                    '& .MuiSvgIcon-root path': {
                                      /* Runder Rahmen via clip */
                                    },
                                  }}
                                  icon={
                                    <Box
                                      component="span"
                                      sx={{
                                        width: 18, height: 18,
                                        border: '2px solid',
                                        borderColor: erledigt ? 'success.main' : 'action.active',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        bgcolor: 'transparent',
                                      }}
                                    />
                                  }
                                  checkedIcon={
                                    <Box
                                      component="span"
                                      sx={{
                                        width: 18, height: 18,
                                        borderRadius: '50%',
                                        bgcolor: 'success.main',
                                        border: '2px solid',
                                        borderColor: 'success.main',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                      }}
                                    >
                                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                    </Box>
                                  }
                                />
                              }
                              label={
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      textDecoration: 'none',
                                      color: erledigt ? 'text.disabled' : 'text.primary',
                                      mt: 0.1,
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {aufgabe.text}
                                  </Typography>
                                  {erledigt && erledigtFormatted && (
                                    <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.1 }}>
                                      Abgeschlossen am {erledigtFormatted}
                                    </Typography>
                                  )}
                                  {!erledigt && faelligFormatted && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.1 }}>
                                      Fällig am {faelligFormatted}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            {zeigtPrio && (
                              <Chip
                                label={PRIO_LABELS[prio]}
                                size="small"
                                color={PRIO_COLORS[prio]}
                                variant={prio === 'hoch' ? 'filled' : 'outlined'}
                                sx={{ fontSize: '0.62rem', height: 18, flexShrink: 0, alignSelf: 'center', fontWeight: 700 }}
                              />
                            )}
                            <Stack
                              direction="row"
                              spacing={0.25}
                              sx={{
                                mt: 0.1,
                                flexWrap: 'nowrap',
                                flexShrink: 0,
                                minWidth: 84,
                                justifyContent: 'flex-end',
                              }}
                            >
                              <Tooltip title="Nach oben">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      if (idx === 0) return;
                                      const ids = aufgaben.map((a) => a.id);
                                      [ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]];
                                      setReihenfolgeInPhase(rg, phaseNr, ids);
                                    }}
                                  >
                                    <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Nach unten">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={idx === aufgaben.length - 1}
                                    onClick={() => {
                                      if (idx >= aufgaben.length - 1) return;
                                      const ids = aufgaben.map((a) => a.id);
                                      [ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]];
                                      setReihenfolgeInPhase(rg, phaseNr, ids);
                                    }}
                                  >
                                    <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              {fallId && (
                                <Tooltip title={faelligAm ? `Fälligkeit: ${faelligFormatted} – klicken zum Ändern` : 'Fälligkeit setzen'}>
                                  <IconButton
                                    size="small"
                                    sx={{ color: faelligAm ? 'primary.main' : 'action.active' }}
                                    onClick={(e) => setDatepickerAnchor({ el: e.currentTarget, aufgabeId: aufgabe.id })}
                                  >
                                    <EventIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {fallId && (
                                <Tooltip title="In diesem Fall entfernen">
                                  <IconButton
                                    size="small"
                                    sx={{ mr: 0.75 }}
                                    onClick={() => {
                                      const istFallAufgabe = (customAufgabenProFall[fallId] ?? []).some((a) => a.id === aufgabe.id);
                                      if (istFallAufgabe) {
                                        deleteFallAufgabe(fallId, aufgabe.id);
                                      } else {
                                        hideAufgabeImFall(fallId, aufgabe.id);
                                      }
                                    }}
                                  >
                                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                            <Stack
                              direction="row"
                              spacing={0.25}
                              sx={{
                                mt: 0.1,
                                flexWrap: 'nowrap',
                                flexShrink: 0,
                                minWidth: 56,
                                justifyContent: 'flex-end',
                              }}
                            >
                              {zeigeBrief && (
                                <Tooltip title={erledigt ? 'Brief bereits erstellt' : 'Brief erstellen'}>
                                  <IconButton
                                    size="small"
                                    color={erledigt ? 'default' : 'primary'}
                                    onClick={() =>
                                      onSchriftverkehrErstellen({
                                        typId: aufgabe.schriftverkehrTypId!,
                                        standardTextvorlageId: aufgabe.standardTextvorlageId,
                                      })
                                    }
                                    sx={{ opacity: erledigt ? 0.4 : 1 }}
                                  >
                                    <MailOutlineIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {zeigeUpload && (
                                <Tooltip title={erledigt ? 'Erledigt' : 'Dokument zur Akte hochladen'}>
                                  <IconButton
                                    size="small"
                                    color={erledigt ? 'default' : 'primary'}
                                    onClick={() =>
                                      onUploadErstellen({ uploadErwartung: aufgabe.uploadErwartung })
                                    }
                                    sx={{ opacity: erledigt ? 0.4 : 1 }}
                                  >
                                    <UploadFileIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {zeigeAnruf && (
                                <>
                                  <Tooltip
                                    title={
                                      !fallId
                                        ? 'Fall wird geladen …'
                                        : !onAufgabeAnrufDokumentieren
                                          ? 'Anruf — Erledigung über Checkbox'
                                          : 'Anruf dokumentieren'
                                    }
                                  >
                                    <span>
                                      <IconButton
                                        size="small"
                                        color={erledigt ? 'default' : 'primary'}
                                        disabled={!fallId || !onAufgabeAnrufDokumentieren}
                                        onClick={() =>
                                          onAufgabeAnrufDokumentieren?.({
                                            aufgabeId: aufgabe.id,
                                            aufgabenText: aufgabe.text,
                                          })
                                        }
                                        sx={{
                                          opacity:
                                            !fallId || !onAufgabeAnrufDokumentieren ? 0.5 : erledigt ? 0.4 : 1,
                                        }}
                                      >
                                        <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip
                                    title={
                                      !fallId
                                        ? 'Fall wird geladen …'
                                        : !onAufgabeNotiz
                                          ? 'Notiz — Erledigung über Checkbox'
                                          : erledigt
                                            ? 'Notiz zur Dokumentation'
                                            : 'Notiz — Aufgabe nach Speichern erledigen'
                                    }
                                  >
                                    <span>
                                      <IconButton
                                        size="small"
                                        color={erledigt ? 'default' : 'primary'}
                                        disabled={!fallId || !onAufgabeNotiz}
                                        onClick={() =>
                                          onAufgabeNotiz?.({
                                            aufgabeId: aufgabe.id,
                                            aufgabenText: aufgabe.text,
                                          })
                                        }
                                        sx={{
                                          opacity: !fallId || !onAufgabeNotiz ? 0.5 : erledigt ? 0.4 : 1,
                                        }}
                                      >
                                        <EditNoteOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </>
                              )}
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                )}
                {fallId && (() => {
                  const draft = customTaskDrafts[phaseNr] ?? '';
                  const submit = () => {
                    const text = draft.trim();
                    if (!text || !fallId) return;
                    const maxReihenfolge = aufgaben.length
                      ? Math.max(...aufgaben.map((a) => a.reihenfolge))
                      : 0;
                    addFallAufgabe(fallId, {
                      text,
                      rechtsgebiet: rg,
                      phase: phaseNr,
                      reihenfolge: maxReihenfolge + 10,
                    });
                    setCustomTaskDrafts((prev) => ({ ...prev, [phaseNr]: '' }));
                  };
                  return (
                    <Box mb={1}>
                      <TextField
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder="Aufgabe hinzufügen …"
                        value={draft}
                        onChange={(e) =>
                          setCustomTaskDrafts((prev) => ({ ...prev, [phaseNr]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            submit();
                          }
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AddIcon fontSize="small" color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: draft.trim() ? (
                            <InputAdornment position="end">
                              <Tooltip title="Aufgabe hinzufügen (Enter)">
                                <IconButton size="small" color="primary" onClick={submit}>
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ) : undefined,
                        }}
                      />
                    </Box>
                  );
                })()}
                {aufgaben.length === 0 && (
                  <Typography variant="body2" color="text.disabled" mb={1}>
                    Keine Aufgaben für diese Phase.
                  </Typography>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
      <Popover
        open={!!datepickerAnchor}
        anchorEl={datepickerAnchor?.el ?? null}
        onClose={() => setDatepickerAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { p: 2, minWidth: 220 } }}
      >
        {datepickerAnchor && (() => {
          const aufgabeId = datepickerAnchor.aufgabeId;
          const currentMeta = fallMeta[aufgabeId] ?? {};
          return (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={600}>Fälligkeit setzen</Typography>
              <TextField
                type="date"
                size="small"
                label="Fällig am"
                InputLabelProps={{ shrink: true }}
                value={currentMeta.faelligAm ?? ''}
                onChange={(e) => {
                  if (fallId) setFallAufgabeFaelligkeit(fallId, aufgabeId, e.target.value || null);
                }}
                fullWidth
              />
              {currentMeta.faelligAm && (
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  onClick={() => {
                    if (fallId) setFallAufgabeFaelligkeit(fallId, aufgabeId, null);
                    setDatepickerAnchor(null);
                  }}
                >
                  Fälligkeit entfernen
                </Button>
              )}
              <Button
                size="small"
                variant="contained"
                onClick={() => setDatepickerAnchor(null)}
              >
                Fertig
              </Button>
            </Stack>
          );
        })()}
      </Popover>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflowX: 'auto', py: 0.5, WebkitOverflowScrolling: 'touch' }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<JuristConnector />}
        sx={{
          width: '100%',
          minWidth: { xs: 520, sm: '100%' },
          px: { xs: 0.5, sm: 0 },
          '& .MuiStepConnector-root': { zIndex: 0 },
          '& .MuiStepLabel-iconContainer': {
            zIndex: 1,
            position: 'relative',
            pb: 0.2,
          },
          '& .MuiStepLabel-label': {
            mt: 0.8,
            fontSize: '0.72rem',
            fontWeight: 600,
            lineHeight: 1.25,
            color: 'text.secondary',
          },
          '& .MuiStepLabel-label.Mui-active': {
            color: 'primary.main',
            fontWeight: 700,
          },
          '& .MuiStepLabel-label.Mui-completed': {
            color: 'text.primary',
            fontWeight: 700,
          },
          '& .MuiStepIcon-root': { width: 30, height: 30 },
        }}
      >
        {phasenKonfig.map((phase, i) => (
          <Step key={`${phase.nummer}-${phase.label}`} completed={i < activeStep}>
            <Tooltip title={phase.label} arrow>
              <StepLabel StepIconComponent={CompactStepIcon} StepIconProps={{ titleAccess: phase.label }}>
                {phase.label}
              </StepLabel>
            </Tooltip>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
