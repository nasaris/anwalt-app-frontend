/**
 * Abrechnung — Seite mit RVG-Rechnungen, Rechner und Tabellenverwaltung
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Stack,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  Menu,
  FormControl,
  InputLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalculateIcon from '@mui/icons-material/Calculate';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HandshakeIcon from '@mui/icons-material/Handshake';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import type { Fall, Mandant, Abrechnung as AbrechnungTyp, AbrechnungStatus, RechnungsTyp } from '../../types';
import { useAbrechnungStore } from '../../store/abrechnungStore';
import { useKanzleiStore } from '../../store/kanzleiStore';
import { formatEuro } from '../../utils/rvgBerechnung';
import { druckeRechnungAlsPdf } from '../../utils/rechnungDruck';
import AbrechnungDialog from './AbrechnungDialog';
import RvgRechner from './RvgRechner';
import GebuhrentabelleVerwaltung from './GebuhrentabelleVerwaltung';

const STATUS_LABEL: Record<AbrechnungStatus, string> = {
  entwurf: 'Entwurf',
  gestellt: 'Gestellt',
  bezahlt: 'Bezahlt',
  storniert: 'Storniert',
};

const STATUS_COLOR: Record<AbrechnungStatus, 'default' | 'info' | 'success' | 'error'> = {
  entwurf: 'default',
  gestellt: 'info',
  bezahlt: 'success',
  storniert: 'error',
};

const RECHNUNGSTYP_LABEL: Record<string, string> = {
  rvg: 'RVG',
  vorschuss: 'Vorschuss',
  honorar: 'Honorar',
};

const RECHNUNGSTYP_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'warning'> = {
  rvg: 'primary',
  vorschuss: 'secondary',
  honorar: 'warning',
};

const RECHTSGEBIET_LABELS: Record<string, string> = {
  verkehrsrecht: 'Verkehrsrecht',
  arbeitsrecht: 'Arbeitsrecht',
  zivilrecht: 'Zivilrecht',
  insolvenzrecht: 'Insolvenzrecht',
  wettbewerbsrecht: 'Wettbewerbsrecht',
  erbrecht: 'Erbrecht',
};

export default function Abrechnung() {
  const { abrechnungen, addAbrechnung, updateAbrechnung, deleteAbrechnung, naechsteRechnungsNummer } =
    useAbrechnungStore();
  const kanzleiDaten = useKanzleiStore((s) => s.daten);

  const [activeTab, setActiveTab] = useState(0);
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [mandantenMap, setMandantenMap] = useState<Record<string, Mandant>>({});
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAbrechnung, setEditAbrechnung] = useState<AbrechnungTyp | undefined>();
  const [neuTyp, setNeuTyp] = useState<RechnungsTyp>('rvg');
  const [loeschKandidat, setLoeschKandidat] = useState<AbrechnungTyp | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Filter
  const [suche, setSuche] = useState('');
  const [statusFilter, setStatusFilter] = useState<AbrechnungStatus | ''>('');

  useEffect(() => {
    Promise.all([faelleApi.getAll(), mandantenApi.getAll()])
      .then(([f, m]) => {
        setFaelle(f);
        const map: Record<string, Mandant> = {};
        m.forEach((mandant) => { map[mandant.id] = mandant; });
        setMandantenMap(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const gefiltert = useMemo(() => {
    let liste = [...abrechnungen].sort(
      (a, b) => new Date(b.erstelltAm).getTime() - new Date(a.erstelltAm).getTime(),
    );
    if (statusFilter) liste = liste.filter((a) => a.status === statusFilter);
    if (suche.trim()) {
      const q = suche.toLowerCase();
      liste = liste.filter((a) => {
        const fall = faelle.find((f) => f.id === a.fallId);
        const mandant = fall ? mandantenMap[fall.mandantId] : undefined;
        return (
          a.rechnungsNummer.toLowerCase().includes(q) ||
          fall?.aktenzeichen.toLowerCase().includes(q) ||
          (mandant && `${mandant.vorname} ${mandant.nachname}`.toLowerCase().includes(q))
        );
      });
    }
    return liste;
  }, [abrechnungen, faelle, mandantenMap, statusFilter, suche]);

  // Summen für Statistik
  const stats = useMemo(() => {
    const offen = abrechnungen
      .filter((a) => a.status === 'gestellt')
      .reduce((s, a) => s + a.gesamtBetrag, 0);
    const bezahlt = abrechnungen
      .filter((a) => a.status === 'bezahlt')
      .reduce((s, a) => s + a.gesamtBetrag, 0);
    return { offen, bezahlt, gesamt: abrechnungen.length };
  }, [abrechnungen]);

  function handleSave(ab: AbrechnungTyp) {
    if (editAbrechnung) {
      updateAbrechnung(ab.id, ab);
    } else {
      addAbrechnung(ab);
    }
    setEditAbrechnung(undefined);
  }

  function handleEdit(ab: AbrechnungTyp) {
    setEditAbrechnung(ab);
    setDialogOpen(true);
  }

  function handleStatusChange(id: string, status: AbrechnungStatus) {
    updateAbrechnung(id, { status });
  }

  function handlePdf(ab: AbrechnungTyp) {
    const fall = faelle.find((f) => f.id === ab.fallId);
    const mandant = fall ? mandantenMap[fall.mandantId] : undefined;
    if (!fall || !mandant) return;
    druckeRechnungAlsPdf(ab, fall, mandant, kanzleiDaten);
  }

  function handleDelete() {
    if (!loeschKandidat) return;
    deleteAbrechnung(loeschKandidat.id);
    setLoeschKandidat(null);
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" pt={10}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Abrechnung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            RVG-Kostenrechnungen · Gebührenrechner · Tabellenverwaltung
          </Typography>
        </Box>
        {activeTab === 0 && (
          <>
            <ButtonGroup variant="contained">
              <Button
                startIcon={<AddIcon />}
                onClick={() => { setNeuTyp('rvg'); setEditAbrechnung(undefined); setDialogOpen(true); }}
              >
                Neue Rechnung
              </Button>
              <Button size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <ArrowDropDownIcon />
              </Button>
            </ButtonGroup>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
            >
              {([
                { typ: 'rvg' as RechnungsTyp, icon: <GavelIcon fontSize="small" />, label: 'RVG-Rechnung' },
                { typ: 'vorschuss' as RechnungsTyp, icon: <AccountBalanceIcon fontSize="small" />, label: 'Vorschussrechnung' },
                { typ: 'honorar' as RechnungsTyp, icon: <HandshakeIcon fontSize="small" />, label: 'Honorarrechnung' },
              ]).map(({ typ, icon, label }) => (
                <MenuItem
                  key={typ}
                  onClick={() => {
                    setMenuAnchor(null);
                    setNeuTyp(typ);
                    setEditAbrechnung(undefined);
                    setDialogOpen(true);
                  }}
                >
                  <Box mr={1}>{icon}</Box>
                  {label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Stack>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<ReceiptLongIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Rechnungen" />
        <Tab icon={<CalculateIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="RVG-Rechner" />
        <Tab icon={<TableChartIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Gebührentabelle" />
      </Tabs>

      {/* Tab: RVG-Rechner */}
      {activeTab === 1 && <RvgRechner />}

      {/* Tab: Gebührentabelle */}
      {activeTab === 2 && <GebuhrentabelleVerwaltung />}

      {/* Tab: Rechnungen */}
      {activeTab === 0 && (
      <Box>

      {/* Statistik-Karten */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Rechnungen gesamt
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {stats.gesamt}
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Offen (gestellt)
          </Typography>
          <Typography variant="h5" fontWeight={700} color="info.main">
            {formatEuro(stats.offen)}
          </Typography>
        </Paper>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Bezahlt (gesamt)
          </Typography>
          <Typography variant="h5" fontWeight={700} color="success.main">
            {formatEuro(stats.bezahlt)}
          </Typography>
        </Paper>
      </Stack>

      {/* Filter */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField
          placeholder="Suche (Nr., Aktenzeichen, Mandant)"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as AbrechnungStatus | '')}
          >
            <MenuItem value="">Alle</MenuItem>
            {(Object.keys(STATUS_LABEL) as AbrechnungStatus[]).map((s) => (
              <MenuItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Tabelle */}
      {gefiltert.length === 0 ? (
        <Box textAlign="center" py={8}>
          <ReceiptLongIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            {abrechnungen.length === 0
              ? 'Noch keine Rechnungen erstellt. Klicken Sie auf „Neue Rechnung".'
              : 'Keine Rechnungen gefunden.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Rechnungsnummer</TableCell>
                <TableCell>Typ</TableCell>
                <TableCell>Datum</TableCell>
                <TableCell>Fall / Mandant</TableCell>
                <TableCell>Rechtsgebiet</TableCell>
                <TableCell align="right">Gegenstandswert</TableCell>
                <TableCell align="right">Gesamt (brutto)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gefiltert.map((ab) => {
                const fall = faelle.find((f) => f.id === ab.fallId);
                const mandant = fall ? mandantenMap[fall.mandantId] : undefined;
                return (
                  <TableRow key={ab.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ab.rechnungsNummer}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={RECHNUNGSTYP_LABEL[ab.rechnungsTyp ?? 'rvg']}
                        color={RECHNUNGSTYP_COLOR[ab.rechnungsTyp ?? 'rvg']}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(ab.datum).toLocaleDateString('de-DE')}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fall?.aktenzeichen ?? '—'}
                      </Typography>
                      {mandant && (
                        <Typography variant="caption" color="text.secondary">
                          {mandant.vorname} {mandant.nachname}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {fall && (
                        <Typography variant="body2" color="text.secondary">
                          {RECHTSGEBIET_LABELS[fall.rechtsgebiet] ?? fall.rechtsgebiet}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color={(ab.rechnungsTyp ?? 'rvg') !== 'rvg' ? 'text.disabled' : undefined}>
                        {(ab.rechnungsTyp ?? 'rvg') === 'rvg' ? formatEuro(ab.gegenstandswert) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatEuro(ab.gesamtBetrag)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[ab.status]}
                        color={STATUS_COLOR[ab.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {ab.status === 'entwurf' && (
                          <Tooltip title="Als gestellt markieren">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleStatusChange(ab.id, 'gestellt')}
                            >
                              <ReceiptLongIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {ab.status === 'gestellt' && (
                          <Tooltip title="Als bezahlt markieren">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStatusChange(ab.id, 'bezahlt')}
                            >
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {ab.status !== 'storniert' && ab.status !== 'bezahlt' && (
                          <Tooltip title="Stornieren">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleStatusChange(ab.id, 'storniert')}
                            >
                              <CancelOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="PDF herunterladen">
                          <IconButton size="small" onClick={() => handlePdf(ab)}>
                            <PictureAsPdfIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Bearbeiten">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(ab)}
                            disabled={ab.status === 'bezahlt' || ab.status === 'storniert'}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Löschen">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setLoeschKandidat(ab)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog Erstellen / Bearbeiten */}
      <AbrechnungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditAbrechnung(undefined); }}
        onSave={handleSave}
        faelle={faelle}
        mandantenMap={mandantenMap}
        initial={editAbrechnung}
        initialTyp={editAbrechnung ? undefined : neuTyp}
        rechnungsNummer={naechsteRechnungsNummer()}
      />

      {/* Löschen-Bestätigung */}
      <Dialog open={!!loeschKandidat} onClose={() => setLoeschKandidat(null)} maxWidth="xs">
        <DialogTitle>Rechnung löschen?</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Rechnung <strong>{loeschKandidat?.rechnungsNummer}</strong> wird unwiderruflich gelöscht.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoeschKandidat(null)}>Abbrechen</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
      )}
    </Box>
  );
}
