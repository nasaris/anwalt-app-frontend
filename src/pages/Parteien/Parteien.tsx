import { useEffect, useMemo, useState } from 'react';
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
  Stack,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Skeleton,
  TextField,
  InputAdornment,
  Breadcrumbs,
  Avatar,
  TablePagination,
  TableSortLabel,
  LinearProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HandshakeIcon from '@mui/icons-material/Handshake';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import GavelIcon from '@mui/icons-material/Gavel';
import { parseISO } from 'date-fns';
import { parteienApi } from '../../api/parteien';
import { faelleApi } from '../../api/faelle';
import type { Fall, Partei, ParteienTyp } from '../../types';
import ParteiDialog from '../../components/ParteiDialog/ParteiDialog';

const TYP_COLORS: Record<ParteienTyp, 'default' | 'info' | 'warning' | 'error' | 'secondary' | 'primary'> = {
  gutachter: 'info',
  werkstatt: 'warning',
  versicherung: 'primary',
  gegenseite: 'error',
  gericht: 'secondary',
};

const TYP_LABELS: Record<ParteienTyp, string> = {
  gutachter: 'Gutachter',
  werkstatt: 'Werkstatt',
  versicherung: 'Versicherung',
  gegenseite: 'Gegenseite',
  gericht: 'Gericht',
};

const TYP_ORDER: ParteienTyp[] = ['gutachter', 'werkstatt', 'versicherung', 'gegenseite', 'gericht'];

type SortKey = 'name' | 'typ' | 'email' | 'ort' | 'referenzen' | 'erstelltAm';

type FilterGruppe = 'alle' | 'kfz' | 'prozess';

const KFZ_TYP: ParteienTyp[] = ['gutachter', 'werkstatt', 'versicherung'];
const PROZESS_TYP: ParteienTyp[] = ['gegenseite', 'gericht'];

function typSortIndex(t: ParteienTyp): number {
  const i = TYP_ORDER.indexOf(t);
  return i === -1 ? TYP_ORDER.length : i;
}

function initialenPartei(p: Partei): string {
  const parts = p.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0].charAt(0);
    const b = parts[parts.length - 1].charAt(0);
    return `${a}${b}`.toUpperCase();
  }
  return p.name.slice(0, 2).toUpperCase();
}

function faelleReferenzenProPartei(faelle: Fall[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const f of faelle) {
    if (f.verkehrsrecht) {
      const vr = f.verkehrsrecht;
      for (const id of [vr.gutachterId, vr.werkstattId, vr.versicherungId].filter(Boolean) as string[]) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
    if (f.arbeitsrecht) {
      const ar = f.arbeitsrecht;
      for (const id of [ar.gegenseiteId, ar.gerichtId].filter(Boolean) as string[]) {
        map.set(id, (map.get(id) ?? 0) + 1);
      }
    }
  }
  return map;
}

function matchesGruppe(p: Partei, g: FilterGruppe): boolean {
  if (g === 'alle') return true;
  if (g === 'kfz') return KFZ_TYP.includes(p.typ);
  return PROZESS_TYP.includes(p.typ);
}

const CARD_SHADOW = '0 8px 32px rgba(12, 15, 16, 0.06)';

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

export default function Parteien() {
  const [parteien, setParteien] = useState<Partei[]>([]);
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState('');
  const [gruppeFilter, setGruppeFilter] = useState<FilterGruppe>('alle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPartei, setMenuPartei] = useState<Partei | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([parteienApi.getAll(), faelleApi.getAll()])
      .then(([p, f]) => {
        setParteien(Array.isArray(p) ? p : []);
        setFaelle(Array.isArray(f) ? f : []);
      })
      .catch(() => {
        setParteien([]);
        setFaelle([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const refProPartei = useMemo(() => faelleReferenzenProPartei(faelle), [faelle]);

  const kpi = useMemo(() => {
    const alle = parteien.length;
    const kfzPartner = parteien.filter((p) => KFZ_TYP.includes(p.typ)).length;
    const prozessbeteiligte = parteien.filter((p) => PROZESS_TYP.includes(p.typ)).length;
    const mitFallbezug = parteien.filter((p) => (refProPartei.get(p.id) ?? 0) > 0).length;
    return { alle, kfzPartner, prozessbeteiligte, mitFallbezug };
  }, [parteien, refProPartei]);

  const gefiltert = useMemo(() => {
    let list = parteien.filter((p) => matchesGruppe(p, gruppeFilter));
    const q = suche.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const ort = p.adresse?.ort?.toLowerCase() ?? '';
        const zusatz = [p.gutachterNr, p.schadensnummer].filter(Boolean).join(' ').toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.email?.toLowerCase().includes(q) ?? false) ||
          (p.telefon?.replace(/\s/g, '').toLowerCase().includes(q) ?? false) ||
          ort.includes(q) ||
          zusatz.includes(q) ||
          p.id.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [parteien, suche, gruppeFilter]);

  const sortiert = useMemo(() => {
    const list = [...gefiltert];
    const mul = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name, 'de', { sensitivity: 'base' });
          break;
        case 'typ':
          cmp = typSortIndex(a.typ) - typSortIndex(b.typ);
          break;
        case 'email':
          cmp = (a.email ?? '').localeCompare(b.email ?? '', 'de');
          break;
        case 'ort':
          cmp = (a.adresse?.ort ?? '').localeCompare(b.adresse?.ort ?? '', 'de');
          break;
        case 'referenzen':
          cmp = (refProPartei.get(a.id) ?? 0) - (refProPartei.get(b.id) ?? 0);
          break;
        case 'erstelltAm': {
          const ta = a.erstelltAm ? parseISO(a.erstelltAm).getTime() : 0;
          const tb = b.erstelltAm ? parseISO(b.erstelltAm).getTime() : 0;
          cmp = ta - tb;
          break;
        }
        default:
          break;
      }
      if (cmp !== 0) return cmp * mul;
      return a.id.localeCompare(b.id);
    });
    return list;
  }, [gefiltert, sortBy, sortDir, refProPartei]);

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

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>, p: Partei) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuPartei(p);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPartei(null);
  };

  const metaZeile = (p: Partei) => {
    const teile: string[] = [];
    if (p.gutachterNr) teile.push(`Nr. ${p.gutachterNr}`);
    if (p.schadensnummer) teile.push(`Schaden ${p.schadensnummer}`);
    if (teile.length > 0) return teile.join(' · ');
    return `ID ${p.id.toUpperCase()}`;
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
          placeholder="Parteien, Kontakte, Orte oder Referenznummern durchsuchen…"
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
          Parteien
        </Typography>
      </Breadcrumbs>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-start' }} spacing={2} mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 0.5 }}>
            Parteienverzeichnis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 560 }}>
            Gutachter, Werkstätten, Versicherungen, Gegenseiten und Gerichte zentral pflegen und Fallbezüge im Blick behalten.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ flexShrink: 0 }}>
          Neue Partei
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{ flex: 1, p: 2.5, borderRadius: 3, bgcolor: 'jurist.surfaceContainerLowest', boxShadow: CARD_SHADOW }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <HandshakeIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
              Einträge gesamt
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} mt={1}>
            {loading ? '—' : kpi.alle}
          </Typography>
          <LinearProgress variant="determinate" value={Math.min(100, (kpi.alle / 40) * 100)} sx={{ mt: 2, height: 6, borderRadius: 999 }} />
        </Paper>
        <Paper
          elevation={0}
          sx={{ flex: 1, p: 2.5, borderRadius: 3, bgcolor: 'jurist.surfaceContainerLowest', boxShadow: CARD_SHADOW }}
        >
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <DirectionsCarIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '0.1em' }}>
              Kfz & Schadenpartner
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} mt={1}>
            {loading ? '—' : kpi.kfzPartner}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Gutachter, Werkstatt, Versicherung
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
            <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.75)' }}>
              Mit Fallbezug
            </Typography>
          </Stack>
          <Typography variant="h4" fontWeight={800} sx={{ color: '#ffffff' }}>
            {loading ? '—' : kpi.mitFallbezug}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)', display: 'block', mt: 0.5 }}>
            {kpi.prozessbeteiligte} Prozessbeteiligte (Gegenseite / Gericht) im Verzeichnis
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
            <Typography variant="body2">Filter nach Rolle</Typography>
          </Stack>
          <ToggleButtonGroup
            size="small"
            value={gruppeFilter}
            exclusive
            onChange={(_, v) => {
              if (v) {
                setGruppeFilter(v);
                setPage(0);
              }
            }}
            sx={{
              bgcolor: 'jurist.surfaceContainerLow',
              borderRadius: 999,
              p: 0.5,
              '& .MuiToggleButton-root': { border: 'none', borderRadius: 999, px: 2 },
            }}
          >
            <ToggleButton value="alle">Alle</ToggleButton>
            <ToggleButton value="kfz">Kfz & Schaden</ToggleButton>
            <ToggleButton value="prozess">Prozess</ToggleButton>
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
                    Partei
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'typ' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'typ'}
                    direction={sortBy === 'typ' ? sortDir : 'asc'}
                    onClick={() => handleSort('typ')}
                  >
                    Typ
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
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }} sortDirection={sortBy === 'ort' ? sortDir : false}>
                  <TableSortLabel
                    active={sortBy === 'ort'}
                    direction={sortBy === 'ort' ? sortDir : 'asc'}
                    onClick={() => handleSort('ort')}
                  >
                    Ort
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ display: { xs: 'none', lg: 'table-cell' } }}
                  sortDirection={sortBy === 'referenzen' ? sortDir : false}
                >
                  <TableSortLabel
                    active={sortBy === 'referenzen'}
                    direction={sortBy === 'referenzen' ? sortDir : 'asc'}
                    onClick={() => handleSort('referenzen')}
                  >
                    Fallbezug
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
                : zeige.map((p) => {
                    const n = refProPartei.get(p.id) ?? 0;
                    return (
                      <TableRow key={p.id} hover sx={{ cursor: 'default' }}>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                              {initialenPartei(p)}
                            </Avatar>
                            <Box>
                              <Typography fontWeight={700}>{p.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {metaZeile(p)}
                              </Typography>
                            </Box>
                          </Stack>
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                            {TYP_LABELS[p.typ]}
                            {p.adresse?.ort ? ` · ${p.adresse.ort}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={TYP_LABELS[p.typ].toUpperCase()}
                            color={TYP_COLORS[p.typ]}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800, fontSize: '0.65rem', letterSpacing: '0.05em' }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          {p.email && <Typography variant="body2">{p.email}</Typography>}
                          {p.telefon && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {p.telefon}
                            </Typography>
                          )}
                          {!p.email && !p.telefon && (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          {p.adresse ? (
                            <Typography variant="body2" color="text.secondary">
                              {p.adresse.plz} {p.adresse.ort}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                          <Stack direction="row" alignItems="center" justifyContent="center">
                            <Typography fontWeight={800}>{n}</Typography>
                            <MiniSparkline value={n} />
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                          <Typography variant="body2" color="text.secondary">
                            {p.erstelltAm ? new Date(p.erstelltAm).toLocaleDateString('de-DE') : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Aktionen">
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, p)}>
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
                : `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, sortiert.length)} von ${sortiert.length} Parteien`}
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
        {menuPartei?.email && (
          <MenuItem
            component="a"
            href={`mailto:${menuPartei.email}`}
            onClick={handleMenuClose}
          >
            E-Mail schreiben
          </MenuItem>
        )}
        {menuPartei?.telefon && (
          <MenuItem
            component="a"
            href={`tel:${menuPartei.telefon.replace(/\s/g, '')}`}
            onClick={handleMenuClose}
          >
            Anrufen
          </MenuItem>
        )}
        {!menuPartei?.email && !menuPartei?.telefon && (
          <MenuItem disabled>Kein Kontakt hinterlegt</MenuItem>
        )}
      </Menu>

      <ParteiDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={(neu) => setParteien((prev) => [...prev, neu])}
      />
    </Box>
  );
}
