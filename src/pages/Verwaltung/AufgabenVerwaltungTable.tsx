import { Fragment, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAufgabenStore, type Aufgabe, type AufgabeRechtsgebiet, type AufgabePrioritaet } from '../../store/aufgabenStore';

const PRIO_COLORS: Record<AufgabePrioritaet, 'error' | 'warning' | 'default'> = {
  hoch: 'error',
  normal: 'default',
  niedrig: 'default',
};
const PRIO_LABELS: Record<AufgabePrioritaet, string> = {
  hoch: 'Hoch',
  normal: 'Normal',
  niedrig: 'Niedrig',
};
import type { DokumentTyp } from '../../store/vorlagenStore';

const RG_OPTIONS: { value: AufgabeRechtsgebiet; label: string }[] = [
  { value: 'verkehrsrecht', label: 'Verkehrsrecht' },
  { value: 'arbeitsrecht', label: 'Arbeitsrecht' },
  { value: 'zivilrecht', label: 'Zivilrecht' },
  { value: 'insolvenzrecht', label: 'Insolvenzrecht' },
  { value: 'wettbewerbsrecht', label: 'Wettbewerbsrecht' },
  { value: 'erbrecht', label: 'Erbrecht' },
];

type AufgabeZeile = Aufgabe & { deaktiviert: boolean; hatOverride: boolean };

interface AufgabenVerwaltungTableProps {
  rechtsgebiet: AufgabeRechtsgebiet;
  onRechtsgebietChange: (rg: AufgabeRechtsgebiet) => void;
  alleTypen: DokumentTyp[];
  onNeueAufgabe: (standardPhase: number) => void;
  onBearbeitenAufgabe: (aufgabe: Aufgabe, phaseContext: number) => void;
}

function SortableRow({
  aufgabe,
  alleTypen,
  phaseNummer,
  reihenfolgeIds,
  onEdit,
  onToggleDeaktiviert,
  onReset,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  aufgabe: AufgabeZeile;
  alleTypen: DokumentTyp[];
  phaseNummer: number;
  reihenfolgeIds: string[];
  onEdit: () => void;
  onToggleDeaktiviert: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: aufgabe.id,
    data: { phase: phaseNummer },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: aufgabe.deaktiviert ? 0.45 : isDragging ? 0.65 : 1,
  };

  const idx = reihenfolgeIds.indexOf(aufgabe.id);

  return (
    <TableRow ref={setNodeRef} hover sx={{ ...style }}>
      <TableCell sx={{ width: 44, py: 0.5 }}>
        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab', touchAction: 'none' }}>
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" sx={{ textDecoration: aufgabe.deaktiviert ? 'line-through' : 'none' }}>
            {aufgabe.text}
          </Typography>
          {aufgabe.system && (
            <Chip label="System" size="small" variant="filled" sx={{ fontSize: '0.65rem', height: 18 }} />
          )}
          {aufgabe.system && aufgabe.hatOverride && (
            <Chip label="Angepasst" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
          )}
        </Stack>
      </TableCell>
      <TableCell>
        {aufgabe.schriftverkehrTypId ? (
          <Chip
            label={alleTypen.find((t) => t.id === aufgabe.schriftverkehrTypId)?.label ?? aufgabe.schriftverkehrTypId}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ fontSize: '0.7rem' }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">
            —
          </Typography>
        )}
      </TableCell>
      <TableCell align="center">
        {aufgabe.prioritaet && aufgabe.prioritaet !== 'normal' ? (
          <Chip
            label={PRIO_LABELS[aufgabe.prioritaet]}
            size="small"
            color={PRIO_COLORS[aufgabe.prioritaet]}
            variant="filled"
            sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }}
          />
        ) : (
          <Typography variant="caption" color="text.disabled">—</Typography>
        )}
      </TableCell>
      <TableCell align="center">
        <Typography variant="caption" color="text.secondary">
          {aufgabe.reihenfolge}
        </Typography>
      </TableCell>
      <TableCell align="center">
        <Switch size="small" checked={!aufgabe.deaktiviert} onChange={onToggleDeaktiviert} />
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" justifyContent="flex-end" alignItems="center">
          <Tooltip title="Nach oben">
            <span>
              <IconButton size="small" disabled={idx <= 0} onClick={onMoveUp}>
                <KeyboardArrowUpIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Nach unten">
            <span>
              <IconButton size="small" disabled={idx < 0 || idx >= reihenfolgeIds.length - 1} onClick={onMoveDown}>
                <KeyboardArrowDownIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Bearbeiten">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {aufgabe.system && aufgabe.hatOverride && onReset && (
            <Tooltip title="Änderungen zurücksetzen">
              <IconButton size="small" color="warning" onClick={onReset}>
                <RestoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!aufgabe.system && onDelete && (
            <Tooltip title="Löschen">
              <IconButton size="small" color="error" onClick={onDelete}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}

function PhaseDropBody({
  phaseNummer,
  children,
}: {
  phaseNummer: number;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: `phase-drop-${phaseNummer}` });
  return (
    <TableBody ref={setNodeRef} data-phase-drop={phaseNummer}>
      {children}
    </TableBody>
  );
}

export default function AufgabenVerwaltungTable({
  rechtsgebiet,
  onRechtsgebietChange,
  alleTypen,
  onNeueAufgabe,
  onBearbeitenAufgabe,
}: AufgabenVerwaltungTableProps) {
  const systemOverrides = useAufgabenStore((s) => s.systemOverrides);
  const deaktiviertIds = useAufgabenStore((s) => s.deaktiviertIds);
  const customAufgaben = useAufgabenStore((s) => s.customAufgaben);
  const bundledSystemAufgaben = useAufgabenStore((s) => s.bundledSystemAufgaben);
  const getAufgaben = useAufgabenStore((s) => s.getAufgaben);
  const verschiebeAufgabeZuPhase = useAufgabenStore((s) => s.verschiebeAufgabeZuPhase);
  const setReihenfolgeInPhase = useAufgabenStore((s) => s.setReihenfolgeInPhase);
  const addPhase = useAufgabenStore((s) => s.addPhase);
  const toggleDeaktiviert = useAufgabenStore((s) => s.toggleDeaktiviert);
  const resetSystemAufgabe = useAufgabenStore((s) => s.resetSystemAufgabe);
  const deleteAufgabe = useAufgabenStore((s) => s.deleteAufgabe);
  const setPhaseLabelStore = useAufgabenStore((s) => s.setPhaseLabel);
  const phaseKannEntferntWerdenFn = useAufgabenStore((s) => s.phaseKannEntferntWerden);
  const removePhaseFn = useAufgabenStore((s) => s.removePhase);

  const alleAufgaben: AufgabeZeile[] = useMemo(
    () =>
      [
        ...bundledSystemAufgaben.map((a) => ({
          ...a,
          ...(systemOverrides[a.id] ?? {}),
          deaktiviert: deaktiviertIds.includes(a.id),
          hatOverride: !!systemOverrides[a.id],
        })),
        ...customAufgaben.map((a) => ({ ...a, deaktiviert: false, hatOverride: false })),
      ]
        .filter((a) => a.rechtsgebiet === rechtsgebiet)
        .sort((a, b) => a.phase - b.phase || a.reihenfolge - b.reihenfolge),
    [systemOverrides, deaktiviertIds, customAufgaben, bundledSystemAufgaben, rechtsgebiet],
  );

  const phasenNummernRg = useAufgabenStore((s) => s.phasenNummern[rechtsgebiet]);
  const phaseLabelsRg = useAufgabenStore((s) => s.phaseLabelOverrides[rechtsgebiet]);
  const phasenKonfig = useMemo(
    () => useAufgabenStore.getState().getPhasenKonfiguration(rechtsgebiet),
    [rechtsgebiet, phasenNummernRg, phaseLabelsRg],
  );

  const [phaseDialog, setPhaseDialog] = useState<{ nummer: number; label: string } | null>(null);
  const [phaseDeleteConfirm, setPhaseDeleteConfirm] = useState<{ nummer: number; label: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const aufgabeById = useMemo(() => Object.fromEntries(alleAufgaben.map((a) => [a.id, a])), [alleAufgaben]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    const akt = aufgabeById[activeId];
    if (!akt) return;

    const rg = rechtsgebiet;

    if (overId.startsWith('phase-drop-')) {
      const targetPhase = Number(overId.replace('phase-drop-', ''));
      const ohne = getAufgaben(rg, targetPhase).filter((a) => a.id !== activeId);
      verschiebeAufgabeZuPhase(rg, activeId, targetPhase, ohne.length);
      return;
    }

    const ziel = aufgabeById[overId];
    if (!ziel) return;

    if (akt.phase === ziel.phase) {
      const ids = alleAufgaben
        .filter((a) => a.phase === akt.phase)
        .sort((a, b) => a.reihenfolge - b.reihenfolge)
        .map((a) => a.id);
      const oldIndex = ids.indexOf(activeId);
      const newIndex = ids.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      setReihenfolgeInPhase(rg, akt.phase, arrayMove(ids, oldIndex, newIndex));
      return;
    }

    const zielListeIds = alleAufgaben
      .filter((a) => a.phase === ziel.phase && a.id !== activeId)
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((a) => a.id);
    let insertAt = zielListeIds.indexOf(overId);
    if (insertAt < 0) insertAt = zielListeIds.length;
    verschiebeAufgabeZuPhase(rg, activeId, ziel.phase, insertAt);
  };

  const moveUpDown = (aufgabeId: string, phaseNummer: number, dir: -1 | 1) => {
    const ids = alleAufgaben
      .filter((a) => a.phase === phaseNummer)
      .sort((a, b) => a.reihenfolge - b.reihenfolge)
      .map((a) => a.id);
    const idx = ids.indexOf(aufgabeId);
    const ni = idx + dir;
    if (idx < 0 || ni < 0 || ni >= ids.length) return;
    setReihenfolgeInPhase(rechtsgebiet, phaseNummer, arrayMove(ids, idx, ni));
  };

  return (
    <Box>
      {/* Toolbar: Aktionen oben, RG-Auswahl darunter */}
      <Stack px={2} pt={1.5} pb={1} spacing={1}>
        {/* Zeile 1: Info + Buttons */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip
            title="Phasen anlegen und benennen; Aufgaben per Ziehen oder Pfeilen sortieren. Phasen löschen, wenn alle aktiven Aufgaben verschoben oder (bei System-Aufgaben) deaktiviert sind — verbleibende deaktivierte Einträge werden in die erste verbleibende Phase verschoben."
            arrow
            placement="bottom-start"
          >
            <InfoOutlinedIcon fontSize="small" sx={{ color: 'text.disabled', cursor: 'default' }} />
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => addPhase(rechtsgebiet)}>
            Neue Phase
          </Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => onNeueAufgabe(1)}>
            Neue Aufgabe
          </Button>
        </Stack>
        {/* Zeile 2: Rechtsgebiet-Pills */}
        <Box sx={{ overflowX: 'auto', pb: 0.5 }}>
          <ToggleButtonGroup
            size="small"
            value={rechtsgebiet}
            exclusive
            onChange={(_, v) => { if (v) onRechtsgebietChange(v); }}
            sx={{
              display: 'flex',
              flexWrap: 'nowrap',
              gap: 0.5,
              '& .MuiToggleButtonGroup-grouped': { border: 'none !important', margin: '0 !important' },
              '& .MuiToggleButton-root': {
                border: '1px solid !important',
                borderColor: 'divider !important',
                borderRadius: '999px !important',
                px: 1.75,
                py: 0.4,
                fontSize: '0.8rem',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderColor: 'primary.main !important',
                  '&:hover': { bgcolor: 'primary.dark' },
                },
              },
            }}
          >
            {RG_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Stack>
      <Divider />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, mx: 2, mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
                <TableCell sx={{ width: 44 }} />
                <TableCell>Aufgabe</TableCell>
                <TableCell>Dokumententyp</TableCell>
                <TableCell sx={{ width: 80 }} align="center">Priorität</TableCell>
                <TableCell sx={{ width: 88 }} align="center">
                  Reihenfolge
                </TableCell>
                <TableCell sx={{ width: 72 }} align="center">
                  Aktiv
                </TableCell>
                <TableCell align="right" sx={{ width: 200 }} />
              </TableRow>
            </TableHead>

            {phasenKonfig.map(({ nummer, label }) => {
              const rows = alleAufgaben.filter((a) => a.phase === nummer).sort((a, b) => a.reihenfolge - b.reihenfolge);
              const ids = rows.map((r) => r.id);

              return (
                <Fragment key={nummer}>
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell colSpan={7} sx={{ py: 1 }}>
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Chip label={`Phase ${nummer}`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            <Typography variant="body2" fontWeight={600}>
                              {label}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Tooltip title="Phasenname bearbeiten">
                              <IconButton size="small" onClick={() => setPhaseDialog({ nummer, label })}>
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={
                                phaseKannEntferntWerdenFn(rechtsgebiet, nummer)
                                  ? 'Phase aus der Ansicht entfernen'
                                  : 'Nur möglich, wenn keine aktiven Aufgaben mehr zugeordnet sind (verschoben, eigene gelöscht oder System-Aufgaben deaktiviert). Mindestens eine Phase bleibt.'
                              }
                            >
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={!phaseKannEntferntWerdenFn(rechtsgebiet, nummer)}
                                  onClick={() => setPhaseDeleteConfirm({ nummer, label })}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  </TableBody>

                  <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                    <PhaseDropBody phaseNummer={nummer}>
                      {rows.map((zeile) => (
                        <SortableRow
                          key={zeile.id}
                          aufgabe={zeile}
                          alleTypen={alleTypen}
                          phaseNummer={nummer}
                          reihenfolgeIds={ids}
                          onEdit={() => onBearbeitenAufgabe(zeile, nummer)}
                          onToggleDeaktiviert={() => toggleDeaktiviert(zeile.id)}
                          onReset={zeile.system && zeile.hatOverride ? () => resetSystemAufgabe(zeile.id) : undefined}
                          onDelete={!zeile.system ? () => deleteAufgabe(zeile.id) : undefined}
                          onMoveUp={() => moveUpDown(zeile.id, nummer, -1)}
                          onMoveDown={() => moveUpDown(zeile.id, nummer, 1)}
                        />
                      ))}
                      {rows.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 2, borderStyle: 'dashed', color: 'text.secondary' }}>
                            <Typography variant="caption">Keine Aufgaben — hierher ziehen oder Neue Aufgabe.</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </PhaseDropBody>
                  </SortableContext>
                </Fragment>
              );
            })}
          </Table>
        </TableContainer>
      </DndContext>

      <Dialog open={!!phaseDeleteConfirm} onClose={() => setPhaseDeleteConfirm(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Phase entfernen?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            Die Phase wird aus der Verwaltung und der Fall-Timeline entfernt. Das ist nur möglich, wenn keinerlei aktive Aufgaben
            mehr dieser Phase zugeordnet sind. Nur noch deaktivierte System-Aufgaben werden automatisch in die erste verbleibende
            Phase verschoben.
          </Alert>
          <Typography variant="body2">
            <strong>{phaseDeleteConfirm?.label}</strong> (Phase {phaseDeleteConfirm?.nummer})
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhaseDeleteConfirm(null)}>Abbrechen</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (phaseDeleteConfirm) {
                removePhaseFn(rechtsgebiet, phaseDeleteConfirm.nummer);
                setPhaseDeleteConfirm(null);
              }
            }}
          >
            Phase entfernen
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!phaseDialog} onClose={() => setPhaseDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Phasenname</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            margin="dense"
            label="Bezeichnung"
            value={phaseDialog?.label ?? ''}
            onChange={(e) => phaseDialog && setPhaseDialog({ ...phaseDialog, label: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhaseDialog(null)}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (phaseDialog) {
                setPhaseLabelStore(rechtsgebiet, phaseDialog.nummer, phaseDialog.label.trim());
                setPhaseDialog(null);
              }
            }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
