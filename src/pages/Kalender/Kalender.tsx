import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Paper,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Chip,
  Button,
  Skeleton,
  Grid,
  FormControlLabel,
  Checkbox,
  alpha,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { faelleApi } from '../../api/faelle';
import { wiedervorlagenApi } from '../../api/parteien';
import type { Fall } from '../../types';
import { buildKalenderEvents, type KalenderEvent } from './buildKalenderEvents';

type Ansicht = 'tag' | 'woche' | 'monat';

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function dringlichkeitFarbe(d: KalenderEvent['dringlichkeit']): 'error' | 'warning' | 'success' | 'default' {
  if (d === 'kritisch') return 'error';
  if (d === 'warnung') return 'warning';
  if (d === 'normal') return 'success';
  return 'default';
}

export default function Kalender() {
  const navigate = useNavigate();
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());
  const [ansicht, setAnsicht] = useState<Ansicht>('monat');
  const [suche, setSuche] = useState('');
  const [filterVR, setFilterVR] = useState(true);
  const [filterAR, setFilterAR] = useState(true);

  const [wiedervorlagenRaw, setWiedervorlagenRaw] = useState<Awaited<
    ReturnType<typeof wiedervorlagenApi.getAll>
  > >([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      faelleApi.getAll(),
      wiedervorlagenApi.getAll({ nurOffene: true }),
    ]).then(([f, w]) => {
      setFaelle(Array.isArray(f) ? f : []);
      setWiedervorlagenRaw(Array.isArray(w) ? w : []);
    }).catch(() => {
      setFaelle([]);
      setWiedervorlagenRaw([]);
    }).finally(() => setLoading(false));
  }, []);

  const eventsResolved = useMemo(() => {
    if (loading) return [];
    return buildKalenderEvents(faelle, wiedervorlagenRaw);
  }, [loading, faelle, wiedervorlagenRaw]);

  const filtered = useMemo(() => {
    let list = eventsResolved;
    const fallById = new Map(faelle.map((x) => [x.id, x]));

    list = list.filter((e) => {
      const f = fallById.get(e.fallId);
      if (!f) return true;
      if (f.rechtsgebiet === 'verkehrsrecht' && !filterVR) return false;
      if (f.rechtsgebiet === 'arbeitsrecht' && !filterAR) return false;
      return true;
    });

    const q = suche.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (e) =>
          e.kurztext.toLowerCase().includes(q) ||
          e.aktenzeichen.toLowerCase().includes(q)
      );
    }
    return list;
  }, [eventsResolved, faelle, filterVR, filterAR, suche]);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, KalenderEvent[]>();
    for (const e of filtered) {
      const key = format(parseISO(e.at), 'yyyy-MM-dd');
      const arr = m.get(key) ?? [];
      arr.push(e);
      m.set(key, arr);
    }
    for (const [, arr] of m) {
      arr.sort((a, b) => parseISO(a.at).getTime() - parseISO(b.at).getTime());
    }
    return m;
  }, [filtered]);

  const kritischeSidebar = useMemo(() => {
    return [...filtered]
      .filter((e) => e.dringlichkeit === 'kritisch' || e.dringlichkeit === 'warnung')
      .slice(0, 8);
  }, [filtered]);

  const handleNav = (dir: -1 | 1) => {
    if (ansicht === 'monat') setCursor((c) => addMonths(c, dir));
    else if (ansicht === 'woche') setCursor((c) => addWeeks(c, dir));
    else setCursor((c) => addDays(c, dir));
  };

  const handleHeute = () => setCursor(new Date());

  const monatstage = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const wochentage = useMemo(() => {
    const ws = startOfWeek(cursor, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: ws, end: addDays(ws, 6) });
  }, [cursor]);

  const titelZeile = () => {
    if (ansicht === 'monat') {
      return format(cursor, 'LLLL yyyy', { locale: de });
    }
    if (ansicht === 'woche') {
      const ws = startOfWeek(cursor, { weekStartsOn: 1 });
      const we = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(ws, 'd. MMM', { locale: de })} – ${format(we, 'd. MMM yyyy', { locale: de })}`;
    }
    return format(cursor, 'EEEE, d. MMMM yyyy', { locale: de });
  };

  const tagEvents = (day: Date) => eventsByDay.get(format(day, 'yyyy-MM-dd')) ?? [];

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Kalender & Fristen
        </Typography>
        <TextField
          size="small"
          placeholder="Fälle, Aktenzeichen, Stichworte…"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400, width: '100%' }}
        />
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 800, minWidth: 200 }}>
                  {titelZeile()}
                </Typography>
                <Stack direction="row" alignItems="center" sx={{ bgcolor: 'jurist.surfaceContainerLow', borderRadius: 999, p: 0.5 }}>
                  <IconButton size="small" onClick={() => handleNav(-1)} aria-label="Zurück">
                    <ChevronLeftIcon />
                  </IconButton>
                  <Button size="small" onClick={handleHeute} startIcon={<TodayIcon />} sx={{ fontWeight: 700 }}>
                    Heute
                  </Button>
                  <IconButton size="small" onClick={() => handleNav(1)} aria-label="Vor">
                    <ChevronRightIcon />
                  </IconButton>
                </Stack>
              </Stack>

              <ToggleButtonGroup
                size="small"
                value={ansicht}
                exclusive
                onChange={(_, v: Ansicht | null) => v && setAnsicht(v)}
                sx={{ bgcolor: 'jurist.surfaceContainerLow', borderRadius: 999, p: 0.5, '& .MuiToggleButton-root': { border: 'none', borderRadius: 999 } }}
              >
                <ToggleButton value="tag">Tag</ToggleButton>
                <ToggleButton value="woche">Woche</ToggleButton>
                <ToggleButton value="monat">Monat</ToggleButton>
              </ToggleButtonGroup>
            </Stack>

            {loading ? (
              <Skeleton variant="rounded" height={420} sx={{ borderRadius: 2 }} />
            ) : (
              <>
                {ansicht === 'monat' && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '1px',
                      bgcolor: 'divider',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: (t) => `1px solid ${t.palette.divider}`,
                      boxShadow: '0 8px 32px rgba(12, 15, 16, 0.06)',
                    }}
                  >
                    {WOCHENTAGE.map((w) => (
                      <Box
                        key={w}
                        sx={{
                          bgcolor: 'jurist.surfaceContainerLow',
                          py: 1.5,
                          textAlign: 'center',
                          typography: 'overline',
                          fontWeight: 800,
                          letterSpacing: '0.12em',
                        }}
                      >
                        {w}
                      </Box>
                    ))}
                    {monatstage.map((day) => {
                      const imMonat = isSameMonth(day, cursor);
                      const heute = isToday(day);
                      const evs = tagEvents(day);
                      const maxChips = 3;
                      const zeige = evs.slice(0, maxChips);
                      const mehr = evs.length - maxChips;
                      return (
                        <Box
                          key={day.toISOString()}
                          sx={{
                            minHeight: 120,
                            bgcolor: imMonat ? 'jurist.surfaceContainerLowest' : alpha('#f1f4f6', 0.5),
                            p: 1,
                            opacity: imMonat ? 1 : 0.45,
                            borderTop: heute ? 2 : 0,
                            borderColor: 'primary.main',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: heute ? 800 : 600,
                              color: heute ? 'primary.main' : 'text.primary',
                            }}
                          >
                            {format(day, 'd')}
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {zeige.map((e) => (
                              <Chip
                                key={e.id}
                                size="small"
                                label={e.kurztext}
                                color={dringlichkeitFarbe(e.dringlichkeit)}
                                variant={e.dringlichkeit === 'kritisch' ? 'filled' : 'outlined'}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  navigate(`/faelle/${e.fallId}`);
                                }}
                                sx={{
                                  height: 'auto',
                                  py: 0.25,
                                  '& .MuiChip-label': {
                                    whiteSpace: 'normal',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    fontSize: '0.65rem',
                                    lineHeight: 1.2,
                                  },
                                }}
                              />
                            ))}
                            {mehr > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                +{mehr} weitere
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>
                )}

                {ansicht === 'woche' && (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: 1,
                    }}
                  >
                    {wochentage.map((day) => {
                      const evs = tagEvents(day);
                      const heute = isToday(day);
                      return (
                        <Paper
                          key={day.toISOString()}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            minHeight: 200,
                            borderRadius: 2,
                            border: (t) =>
                              `1px solid ${heute ? alpha(t.palette.primary.main, 0.5) : t.palette.divider}`,
                            bgcolor: heute ? alpha('#5f5e5e', 0.04) : 'jurist.surfaceContainerLowest',
                          }}
                        >
                          <Typography variant="caption" fontWeight={800} color={heute ? 'primary' : 'text.primary'}>
                            {format(day, 'EEE d.', { locale: de })}
                          </Typography>
                          <Stack spacing={0.75} sx={{ mt: 1 }}>
                            {evs.map((e) => (
                              <Chip
                                key={e.id}
                                size="small"
                                label={e.aktenzeichen}
                                title={e.kurztext}
                                color={dringlichkeitFarbe(e.dringlichkeit)}
                                onClick={() => navigate(`/faelle/${e.fallId}`)}
                                sx={{ justifyContent: 'flex-start' }}
                              />
                            ))}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Box>
                )}

                {ansicht === 'tag' && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Termine am {format(cursor, 'd. MMMM yyyy', { locale: de })}
                    </Typography>
                    <Stack spacing={1.5}>
                      {tagEvents(cursor).length === 0 ? (
                        <Typography color="text.secondary">Keine Einträge an diesem Tag.</Typography>
                      ) : (
                        tagEvents(cursor).map((e) => (
                          <Paper
                            key={e.id}
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: 'jurist.surfaceContainerLow',
                              cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/faelle/${e.fallId}`)}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography fontWeight={700}>{e.aktenzeichen}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {e.kurztext}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {format(parseISO(e.at), 'HH:mm', { locale: de })} ·{' '}
                                  {e.quelle === 'kschg' ? 'KSchG' : 'Wiedervorlage'}
                                </Typography>
                              </Box>
                              <Chip
                                size="small"
                                label={e.dringlichkeit}
                                color={dringlichkeitFarbe(e.dringlichkeit)}
                              />
                            </Stack>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Paper>
                )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: (t) => `1px solid ${t.palette.divider}`,
              position: { lg: 'sticky' },
              top: { lg: 16 },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.14em' }}>
                Dringende Fristen
              </Typography>
              {kritischeSidebar.length > 0 && (
                <Chip size="small" label={`${kritischeSidebar.length}`} color="error" />
              )}
            </Stack>
            {loading ? (
              <Stack spacing={1}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} height={72} variant="rounded" />
                ))}
              </Stack>
            ) : kritischeSidebar.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Keine dringenden oder warnungsrelevanten Fristen in der Auswahl.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {kritischeSidebar.map((e) => (
                  <Paper
                    key={e.id}
                    elevation={0}
                    onClick={() => navigate(`/faelle/${e.fallId}`)}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'jurist.surfaceContainerLow',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'jurist.surfaceContainerHigh' },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <WarningAmberIcon
                        sx={{
                          fontSize: 20,
                          color: e.dringlichkeit === 'kritisch' ? 'error.main' : 'warning.main',
                          mt: 0.25,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {e.kurztext}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {e.aktenzeichen} · {format(parseISO(e.at), 'd. MMM · HH:mm', { locale: de })}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.14em', mt: 3, mb: 1, display: 'block' }}>
              Anzeige
            </Typography>
            <FormControlLabel
              control={<Checkbox checked={filterVR} onChange={(_, c) => setFilterVR(c)} />}
              label="Verkehrsrecht"
            />
            <FormControlLabel
              control={<Checkbox checked={filterAR} onChange={(_, c) => setFilterAR(c)} />}
              label="Arbeitsrecht"
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
