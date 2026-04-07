import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Skeleton,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import type { Fall, FallStatus, Mandant } from '../../types';
import FallCard from '../../components/FallCard/FallCard';
import FallListe from '../../components/FallListe/FallListe';

const FALL_STATUS_VALUES: FallStatus[] = [
  'aktiv',
  'abgeschlossen',
  'klage',
  'einigung',
  'frist_abgelaufen',
];

const STATUS_LABELS: Record<FallStatus, string> = {
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  klage: 'Klage',
  einigung: 'Einigung',
  frist_abgelaufen: 'Frist abgelaufen',
};

function parseStatusParam(raw: string | null): FallStatus | undefined {
  if (!raw) return undefined;
  return FALL_STATUS_VALUES.includes(raw as FallStatus) ? (raw as FallStatus) : undefined;
}

export default function Faelle() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [mandantenMap, setMandantenMap] = useState<Record<string, Mandant>>({});
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState(() => searchParams.get('suche') ?? '');

  const rechtsgebiet = searchParams.get('rechtsgebiet') as 'verkehrsrecht' | 'arbeitsrecht' | null;
  const isKacheln = searchParams.get('ansicht') === 'kacheln';
  const statusApi = parseStatusParam(searchParams.get('status'));
  const phaseFilter = searchParams.get('phase') ?? '';
  const nurWv = searchParams.get('wv') === '1';
  const nurKschg = searchParams.get('kschg') === '1';

  const [advExpanded, setAdvExpanded] = useState(() =>
    Boolean(
      searchParams.get('status') ||
        searchParams.get('phase') ||
        searchParams.get('wv') === '1' ||
        searchParams.get('kschg') === '1'
    )
  );

  function mergeParams(updates: Record<string, string | null | undefined>) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') {
        next.delete(k);
      } else {
        next.set(k, v);
      }
    });
    setSearchParams(next);
  }

  useEffect(() => {
    setSuche(searchParams.get('suche') ?? '');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      faelleApi.getAll({ rechtsgebiet: rechtsgebiet || undefined, status: statusApi }),
      mandantenApi.getAll(),
    ]).then(([faelleData, mandantenData]) => {
      setFaelle(Array.isArray(faelleData) ? faelleData : []);
      const md = Array.isArray(mandantenData) ? mandantenData : [];
      setMandantenMap(Object.fromEntries(md.map((m) => [m.id, m])));
    }).catch(() => {
      setFaelle([]);
      setMandantenMap({});
    }).finally(() => setLoading(false));
  }, [rechtsgebiet, statusApi]);

  const gefiltert = useMemo(() => {
    let list: Fall[] = faelle;

    const q = suche.trim().toLowerCase();
    if (q) {
      list = list.filter((f) => {
        const m = mandantenMap[f.mandantId];
        const mandantText = m
          ? `${m.vorname} ${m.nachname} ${m.nachname} ${m.vorname}`.toLowerCase()
          : '';
        return (
          f.aktenzeichen.toLowerCase().includes(q) ||
          f.rechtsgebiet.toLowerCase().includes(q) ||
          (f.notizen?.toLowerCase().includes(q) ?? false) ||
          f.id.toLowerCase().includes(q) ||
          mandantText.includes(q)
        );
      });
    }

    if (phaseFilter) {
      list = list.filter((f) => String(f.phase) === phaseFilter);
    }
    if (nurWv) {
      list = list.filter((f) => Boolean(f.wiedervorlage && f.status === 'aktiv'));
    }
    if (nurKschg) {
      list = list.filter((f) => Boolean(f.arbeitsrecht?.fristEnde));
    }

    return list;
  }, [faelle, mandantenMap, suche, phaseFilter, nurWv, nurKschg]);

  const resetErweitert = () => {
    mergeParams({
      status: null,
      phase: null,
      wv: null,
      kschg: null,
    });
  };

  const hatErweitertFilter = Boolean(statusApi || phaseFilter || nurWv || nurKschg);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Fälle
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/faelle/neu')}
        >
          Neuer Fall
        </Button>
      </Stack>

      <Stack direction="row" spacing={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          placeholder="Aktenzeichen oder Mandant suchen…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: '100%', sm: 260 }, flex: { sm: '1 1 260px' }, maxWidth: 420 }}
        />

        <ToggleButtonGroup
          size="small"
          value={rechtsgebiet ?? 'alle'}
          exclusive
          onChange={(_, val) => {
            if (val === 'alle' || val === null) {
              mergeParams({ rechtsgebiet: null });
            } else {
              mergeParams({ rechtsgebiet: val });
            }
          }}
        >
          <ToggleButton value="alle">Alle</ToggleButton>
          <ToggleButton value="verkehrsrecht">Verkehrsrecht</ToggleButton>
          <ToggleButton value="arbeitsrecht">Arbeitsrecht</ToggleButton>
        </ToggleButtonGroup>

        <ToggleButtonGroup
          size="small"
          value={isKacheln ? 'kacheln' : 'liste'}
          exclusive
          onChange={(_, val) => {
            if (val === null) return;
            if (val === 'liste') {
              mergeParams({ ansicht: null });
            } else {
              mergeParams({ ansicht: 'kacheln' });
            }
          }}
        >
          <ToggleButton value="liste" aria-label="Listenansicht">
            <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} />
            Liste
          </ToggleButton>
          <ToggleButton value="kacheln" aria-label="Kachelansicht">
            <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
            Kacheln
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      <Accordion
        expanded={advExpanded}
        onChange={(_, exp) => setAdvExpanded(exp)}
        disableGutters
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: (t) => `1px solid ${t.palette.divider}`,
          '&:before': { display: 'none' },
          overflow: 'hidden',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TuneIcon fontSize="small" color="action" />
            <Typography fontWeight={600}>Erweiterte Suche</Typography>
            {hatErweitertFilter && (
              <Chip size="small" label="Filter aktiv" color="primary" variant="outlined" />
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, px: 2, pb: 2 }}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="faelle-status-filter">Status</InputLabel>
              <Select
                labelId="faelle-status-filter"
                label="Status"
                value={statusApi ?? ''}
                onChange={(e) => {
                  const v = e.target.value as string;
                  mergeParams({ status: v || null });
                }}
              >
                <MenuItem value="">
                  <em>Alle Status</em>
                </MenuItem>
                {FALL_STATUS_VALUES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="faelle-phase-filter">Phase</InputLabel>
              <Select
                labelId="faelle-phase-filter"
                label="Phase"
                value={phaseFilter}
                onChange={(e) => mergeParams({ phase: e.target.value || null })}
              >
                <MenuItem value="">
                  <em>Alle Phasen</em>
                </MenuItem>
                {[1, 2, 3, 4].map((p) => (
                  <MenuItem key={p} value={String(p)}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={nurWv}
                  onChange={(_, c) => mergeParams({ wv: c ? '1' : null })}
                />
              }
              label="Nur mit Wiedervorlage"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={nurKschg}
                  onChange={(_, c) => mergeParams({ kschg: c ? '1' : null })}
                />
              }
              label="Nur mit KSchG-Frist"
            />

            <Button size="small" variant="outlined" onClick={resetErweitert} disabled={!hatErweitertFilter}>
              Filter zurücksetzen
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            Hinweis: Status wird serverseitig geladen; Phase, Wiedervorlage und KSchG werden zusätzlich
            im Browser eingegrenzt.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {loading ? (
        isKacheln ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack spacing={1}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} variant="rounded" height={52} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        )
      ) : gefiltert.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography color="text.secondary">Keine Fälle gefunden.</Typography>
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            onClick={() => navigate('/faelle/neu')}
          >
            Ersten Fall anlegen
          </Button>
        </Box>
      ) : isKacheln ? (
        <Grid container spacing={2}>
          {gefiltert.map((fall) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={fall.id}>
              <FallCard fall={fall} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <FallListe faelle={gefiltert} mandantenMap={mandantenMap} />
      )}
    </Box>
  );
}
