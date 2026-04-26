import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  TableSortLabel,
  LinearProgress,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GavelIcon from '@mui/icons-material/Gavel';
import { mandantenApi } from '../../api/mandanten';
import { faelleApi } from '../../api/faelle';
import { parseISO } from 'date-fns';
import type { Fall, Mandant, MandantKategorie } from '../../types';
import MandantDialog from '../../components/MandantDialog/MandantDialog';

type SortKey = 'name' | 'email' | 'kategorie' | 'faelle' | 'status' | 'erstelltAm';

function engagementSortIndex(m: Mandant): number {
  const s = m.engagementStatus ?? 'aktiv';
  if (s === 'aktiv') return 0;
  if (s === 'onboarding') return 1;
  return 2;
}

const CARD_SHADOW = '0 8px 32px rgba(12, 15, 16, 0.06)';

function initialen(m: Mandant): string {
  const a = m.vorname?.charAt(0) ?? '';
  const b = m.nachname?.charAt(0) ?? '';
  return `${a}${b}`.toUpperCase();
}

function engagementLabel(s: NonNullable<Mandant['engagementStatus']> | undefined): string {
  const v = s ?? 'aktiv';
  if (v === 'aktiv') return 'AKTIV';
  if (v === 'onboarding') return 'ONBOARDING';
  return 'RUHEND';
}

function engagementColor(s: NonNullable<Mandant['engagementStatus']> | undefined): 'success' | 'warning' | 'default' {
  const v = s ?? 'aktiv';
  if (v === 'aktiv') return 'success';
  if (v === 'onboarding') return 'warning';
  return 'default';
}

function MiniSparkline({ value }: { value: number }) {
  const h = [0.35, 0.55, 0.4, 0.7, 0.45].map((b, i) => Math.min(1, (value + i) % 6) * 0.12 + b * 0.5);
  return (
    <Stack direction="row" alignItems="flex-end" spacing={0.35} sx={{ height: 28, ml: 1 }}>
      {h.map((x, i) => (
        <Box
          key={i}
          sx={{
            width: 4,
            height: `${20 + x * 22}px`,
            borderRadius: 0.5,
            bgcolor: 'primary.main',
            opacity: 0.35 + (i % 3) * 0.15,
          }}
        />
      ))}
    </Stack>
  );
}

export default function Mandanten() {
  const navigate = useNavigate();
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState('');
  const [kategorieFilter, setKategorieFilter] = useState<'alle' | MandantKategorie>('alle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuMandantId, setMenuMandantId] = useState<string | null>(null);
  const [editMandant, setEditMandant] = useState<Mandant | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    Promise.all([mandantenApi.getAll(), faelleApi.getAll()])
      .then(([m, f]) => {
        setMandanten(Array.isArray(m) ? m : []);
        setFaelle(Array.isArray(f) ? f : []);
      })
      .catch(() => {
        setMandanten([]);
        setFaelle([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const aktiveFaelleProMandant = useMemo(() => {
    const map = new Map<string, number>();
    for (const fa of faelle) {
      if (fa.status !== 'aktiv') continue;
      map.set(fa.mandantId, (map.get(fa.mandantId) ?? 0) + 1);
      for (const wid of fa.weitereMandantenIds ?? []) {
        map.set(wid, (map.get(wid) ?? 0) + 1);
      }
    }
    return map;
  }, [faelle]);

  const kpi = useMemo(() => {
    const alle = mandanten.length;
    const aktivKonten = mandanten.filter((m) => (m.engagementStatus ?? 'aktiv') === 'aktiv').length;
    const onboarding = mandanten.filter((m) => m.engagementStatus === 'onboarding').length;
    const litigation = faelle.filter((f) => f.status === 'aktiv' || f.status === 'klage').length;
    const onboardingPending = onboarding;
    return { alle, aktivKonten, onboarding, litigation, onboardingPending };
  }, [mandanten, faelle]);

  const gefiltert = useMemo(() => {
    let list = mandanten;
    if (kategorieFilter !== 'alle') {
      list = list.filter((m) => (m.kategorie ?? 'privat') === kategorieFilter);
    }
    const q = suche.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          `${m.vorname} ${m.nachname}`.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.telefon.replace(/\s/g, '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [mandanten, suche, kategorieFilter]);

  const sortiert = useMemo(() => {
    const list = [...gefiltert];
    const mul = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name': {
          cmp = `${a.vorname} ${a.nachname}`.localeCompare(`${b.vorname} ${b.nachname}`, 'de', {
            sensitivity: 'base',
          });
          break;
        }
        case 'email':
          cmp = a.email.localeCompare(b.email, 'de');
          break;
        case 'kategorie': {
          const ka = (a.kategorie ?? 'privat') === 'unternehmen' ? 1 : 0;
          const kb = (b.kategorie ?? 'privat') === 'unternehmen' ? 1 : 0;
          cmp = ka - kb;
          break;
        }
        case 'faelle': {
          const fa = aktiveFaelleProMandant.get(a.id) ?? 0;
          const fb = aktiveFaelleProMandant.get(b.id) ?? 0;
          cmp = fa - fb;
          break;
        }
        case 'status':
          cmp = engagementSortIndex(a) - engagementSortIndex(b);
          break;
        case 'erstelltAm':
          cmp = parseISO(a.erstelltAm).getTime() - parseISO(b.erstelltAm).getTime();
          break;
        default:
          break;
      }
      return cmp * mul;
    });
    return list;
  }, [gefiltert, sortBy, sortDir, aktiveFaelleProMandant]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const zeige = useMemo(
    () => sortiert.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortiert, page, rowsPerPage]
  );

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, id: string) => {
    setMenuAnchor(e.currentTarget);
    setMenuMandantId(id);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuMandantId(null);
  };

  return (
    <Box>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: (t) => alpha(t.palette.background.default, 0.92),
          backdropFilter: 'blur(10px)',
          mx: { xs: -2, sm: -3, md: -6 },
          px: { xs: 2, sm: 3, md: 6 },
          py: 2,
          mb: 2,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Mandanten, Akten oder Kontakte durchsuchen…"
          value={suche}
          onChange={(e) => {
            setSuche(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Breadcrumbs separator="›" sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Verzeichnis
        </Typography>
        <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ letterSpacing: '0.08em' }}>
          Mandanten
        </Typography>
      </Breadcrumbs>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 0.5 }}>
            Mandantenportfolio
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
            Mandantenbeziehungen verwalten und die Beteiligung an Fällen in der Kanzlei im Blick behalten.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setDialogOpen(true)} sx={{ flexShrink: 0 }}>
          Neuer Mandant
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{ flex: 1, p: 2.5, borderRadius: 3, bgcolor: 'jurist.surfaceContainerLowest', boxShadow: CARD_SHADOW }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
            Aktive Mandatskonten
          </Typography>
          <Stack direction="row" alignItems="baseline" spacing={1} mt={1}>
            <Typography variant="h4" fontWeight={800}>
              {loading ? '—' : kpi.aktivKonten}
            </Typography>
            <Chip
              size="small"
              icon={<TrendingUpIcon sx={{ fontSize: '14px !important' }} />}
              label="+12%"
              color="success"
              sx={{ fontWeight: 700, fontSize: '0.65rem' }}
            />
          </Stack>
          <LinearProgress variant="determinate" value={72} sx={{ mt: 2, height: 6, borderRadius: 999 }} />
        </Paper>
        <Paper
          elevation={0}
          sx={{ flex: 1, p: 2.5, borderRadius: 3, bgcolor: 'jurist.surfaceContainerLowest', boxShadow: CARD_SHADOW }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
            Onboarding
          </Typography>
          <Typography variant="h4" fontWeight={800} mt={1}>
            {loading ? '—' : kpi.onboarding}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {kpi.onboardingPending} in Bearbeitung / Prüfung
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2.5,
            borderRadius: 3,
            bgcolor: 'jurist.inverseSurface',
            boxShadow: CARD_SHADOW,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <GavelIcon sx={{ fontSize: 20, color: 'rgba(255,255,255,0.9)' }} />
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.75)',
              }}
            >
              Aktive Verfahren
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#ffffff' }}>
            {loading ? '—' : kpi.litigation}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', display: 'block', mt: 0.5 }}>
            Fälle mit Status aktiv oder Klage
          </Typography>
        </Paper>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary' }}>
            <FilterListIcon fontSize="small" />
            <Typography variant="body2">Filter nach Mandantentyp</Typography>
          </Stack>
          <ToggleButtonGroup
            size="small"
            value={kategorieFilter}
            exclusive
            onChange={(_, v) => v && setKategorieFilter(v)}
            sx={{
              bgcolor: 'jurist.surfaceContainerLow',
              borderRadius: 999,
              p: 0.5,
              '& .MuiToggleButton-root': { border: 'none', borderRadius: 999, px: 2 },
            }}
          >
            <ToggleButton value="alle">Alle</ToggleButton>
            <ToggleButton value="unternehmen">Unternehmen</ToggleButton>
            <ToggleButton value="privat">Privat</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}`, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
                <TableCell sortDirection={sortBy === 'name' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortDir : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Mandant
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }} sortDirection={sortBy === 'email' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'email'}
                    direction={sortBy === 'email' ? sortDir : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Kontakt
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} sortDirection={sortBy === 'kategorie' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'kategorie'}
                    direction={sortBy === 'kategorie' ? sortDir : 'asc'}
                    onClick={() => handleSort('kategorie')}
                  >
                    Kategorie
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                  sortDirection={sortBy === 'faelle' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === 'faelle'}
                    direction={sortBy === 'faelle' ? sortDir : 'asc'}
                    onClick={() => handleSort('faelle')}
                  >
                    Aktive Fälle
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'status' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'status'}
                    direction={sortBy === 'status' ? sortDir : 'asc'}
                    onClick={() => handleSort('status')}
                  >
                    Status
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  sx={{ display: { xs: 'none', xl: 'table-cell' } }}
                  sortDirection={sortBy === 'erstelltAm' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === 'erstelltAm'}
                    direction={sortBy === 'erstelltAm' ? sortDir : 'asc'}
                    onClick={() => handleSort('erstelltAm')}
                  >
                    Angelegt
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" width={56} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : zeige.map((m) => {
                    const n = aktiveFaelleProMandant.get(m.id) ?? 0;
                    const kat = m.kategorie ?? 'privat';
                    return (
                      <TableRow
                        key={m.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/mandanten/${m.id}`)}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                              {initialen(m)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={700}>
                                {m.vorname} {m.nachname}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID {m.id.toUpperCase()}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="body2">{m.email}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {m.telefon}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Chip
                            size="small"
                            label={kat === 'unternehmen' ? 'UNTERNEHMEN' : 'PRIVAT'}
                            color={kat === 'unternehmen' ? 'info' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.06em' }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Stack direction="row" alignItems="center" justifyContent="center">
                            <Typography fontWeight={800}>{n}</Typography>
                            <MiniSparkline value={n} />
                          </Stack>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Chip
                            size="small"
                            label={engagementLabel(m.engagementStatus)}
                            color={engagementColor(m.engagementStatus)}
                            variant={engagementLabel(m.engagementStatus) === 'AKTIV' ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{ display: { xs: 'none', xl: 'table-cell' } }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {new Date(m.erstelltAm).toLocaleDateString('de-DE')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Aktionen">
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, m.id)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </TableContainer>
        {!loading && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: 'divider' }}
          >
            <Typography variant="body2" color="text.secondary">
              {gefiltert.length === 0
                ? 'Keine Einträge'
                : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, sortiert.length)} von ${sortiert.length} Mandanten`}
            </Typography>
            <TablePagination
              component="div"
              count={sortiert.length}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Zeilen:"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} von ${count !== -1 ? count : `mehr als ${to}`}`}
            />
          </Stack>
        )}
      </Paper>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (menuMandantId) navigate(`/mandanten/${menuMandantId}`);
            handleMenuClose();
          }}
        >
          Details öffnen
        </MenuItem>
        <MenuItem
          onClick={() => {
            const m = mandanten.find((x) => x.id === menuMandantId);
            if (m) setEditMandant(m);
            handleMenuClose();
          }}
        >
          Bearbeiten
        </MenuItem>
      </Menu>

      {/* Neuer Mandant */}
      <MandantDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={(m) => setMandanten((prev) => [...prev, m])}
      />

      {/* Mandant bearbeiten */}
      <MandantDialog
        open={Boolean(editMandant)}
        mandant={editMandant}
        onClose={() => setEditMandant(undefined)}
        onSaved={(updated) => {
          setMandanten((prev) => prev.map((m) => m.id === updated.id ? updated : m));
          setEditMandant(undefined);
        }}
      />
    </Box>
  );
}
