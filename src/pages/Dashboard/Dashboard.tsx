import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Skeleton,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
  Fab,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { useKanzleiStore } from '../../store/kanzleiStore';
import AddIcon from '@mui/icons-material/Add';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import { wiedervorlagenApi } from '../../api/parteien';
import type { Fall, Mandant, Wiedervorlage } from '../../types';
import FristBadge from '../../components/FristBadge/FristBadge';
import { fristDringlichkeit, verbleibendeTage } from '../../utils/fristBerechnung';

const CARD_SHADOW = '0 8px 32px rgba(12, 15, 16, 0.06)';

function greetingDe(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function fallTitel(f: Fall, mandanten: Mandant[]): string {
  const m = mandanten.find((x) => x.id === f.mandantId);
  const name = m ? `${m.nachname}` : 'Mandant';
  if (f.rechtsgebiet === 'arbeitsrecht') {
    return `${name} vs. Gegenseite`;
  }
  return `Schadenfall ${f.aktenzeichen}`;
}

function statusPill(fall: Fall): { label: string; color: 'default' | 'primary' | 'error' | 'success' } {
  if (fall.status === 'klage') return { label: 'KLAGE', color: 'error' };
  if (fall.status === 'einigung') return { label: 'EINIGUNG', color: 'success' };
  if (fall.phase === 1 && fall.status === 'aktiv') return { label: 'EINGANG', color: 'primary' };
  return { label: 'AKTIV', color: 'default' };
}

function rechtsgebietTag(f: Fall): string {
  return f.rechtsgebiet === 'verkehrsrecht' ? 'VERKEHRSRECHT' : 'ARBEITSRECHT';
}

function aufgabenStatus(index: number): 'OFFEN' | 'IN BEARBEITUNG' {
  return index % 2 === 0 ? 'OFFEN' : 'IN BEARBEITUNG';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const kanzlei = useKanzleiStore((s) => s.daten);
  const userInitials = kanzlei.anwaltVorname && kanzlei.anwaltNachname
    ? `${kanzlei.anwaltVorname[0]}${kanzlei.anwaltNachname[0]}`.toUpperCase()
    : kanzlei.anwaltName.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [wiedervorlagen, setWiedervorlagen] = useState<Wiedervorlage[]>([]);
  const [loading, setLoading] = useState(true);
  const [suche, setSuche] = useState('');

  useEffect(() => {
    Promise.all([
      faelleApi.getAll({ status: 'aktiv' }),
      mandantenApi.getAll(),
      wiedervorlagenApi.getAll({ nurOffene: true }),
    ]).then(([f, m, w]) => {
      setFaelle(Array.isArray(f) ? f : []);
      setMandanten(Array.isArray(m) ? m : []);
      setWiedervorlagen(Array.isArray(w) ? w : []);
    }).catch(() => {
      setFaelle([]);
      setMandanten([]);
      setWiedervorlagen([]);
    }).finally(() => setLoading(false));
  }, []);

  const kritischeFaelle = useMemo(
    () =>
      faelle.filter(
        (f) =>
          f.arbeitsrecht?.fristEnde &&
          (fristDringlichkeit(f.arbeitsrecht.fristEnde) === 'kritisch' ||
            fristDringlichkeit(f.arbeitsrecht.fristEnde) === 'warnung')
      ),
    [faelle]
  );

  const dringendeWv = useMemo(
    () =>
      wiedervorlagen.filter((w) => {
        const d = fristDringlichkeit(w.faelligAm);
        return d === 'kritisch' || d === 'warnung';
      }),
    [wiedervorlagen]
  );

  const dringendeFristenGesamt = kritischeFaelle.length + dringendeWv.length;

  const faelleNeu = useMemo(() => {
    return [...faelle].sort(
      (a, b) => parseISO(b.erstelltAm).getTime() - parseISO(a.erstelltAm).getTime()
    );
  }, [faelle]);

  const recentFaelle = faelleNeu.slice(0, 2);

  const fristenWidgetItems = useMemo(() => {
    const items: {
      key: string;
      title: string;
      line: string;
      tone: 'kritisch' | 'warnung' | 'normal';
      icon: typeof EventAvailableIcon;
    }[] = [];

    kritischeFaelle.slice(0, 2).forEach((f) => {
      if (!f.arbeitsrecht?.fristEnde) return;
      const d = fristDringlichkeit(f.arbeitsrecht.fristEnde);
      items.push({
        key: `kschg-${f.id}`,
        title: `${f.aktenzeichen} · KSchG`,
        line:
          d === 'kritisch'
            ? `KRITISCH · ${format(parseISO(f.arbeitsrecht.fristEnde), "EEEE, HH:mm", { locale: de })}`
            : `WARNUNG · noch ${verbleibendeTage(f.arbeitsrecht.fristEnde)} Tage`,
        tone: d === 'kritisch' ? 'kritisch' : 'warnung',
        icon: CalendarMonthIcon,
      });
    });

    [...wiedervorlagen]
      .sort((a, b) => parseISO(a.faelligAm).getTime() - parseISO(b.faelligAm).getTime())
      .slice(0, 3)
      .forEach((w) => {
        const d = fristDringlichkeit(w.faelligAm);
        const fall = faelle.find((x) => x.id === w.fallId);
        items.push({
          key: `wv-${w.id}`,
          title: fall ? `${fall.aktenzeichen}` : w.fallId,
          line: `${format(parseISO(w.faelligAm), 'd. MMM · HH:mm', { locale: de })} · ${w.beschreibung.slice(0, 40)}${w.beschreibung.length > 40 ? '…' : ''}`,
          tone: d === 'kritisch' ? 'kritisch' : d === 'warnung' ? 'warnung' : 'normal',
          icon: EventAvailableIcon,
        });
      });

    return items.slice(0, 5);
  }, [kritischeFaelle, wiedervorlagen, faelle]);

  const handleSucheSubmit = () => {
    const q = suche.trim();
    if (q) navigate(`/faelle?suche=${encodeURIComponent(q)}`);
    else navigate('/faelle');
  };

  const kritischGesamt = kritischeFaelle.length + dringendeWv.filter((w) => fristDringlichkeit(w.faelligAm) === 'kritisch').length;

  return (
    <Box sx={{ position: 'relative', pb: 10 }}>
      {/* Sticky Topbar — Mockup: Suche, Icons, CTA */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          bgcolor: (t) => alpha(t.palette.background.default, 0.92),
          backdropFilter: 'blur(12px)',
          mx: { xs: -2, sm: -3, md: -6 },
          px: { xs: 2, sm: 3, md: 6 },
          py: 2,
          mb: 3,
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <TextField
            fullWidth
            placeholder="Suche nach Fällen, Mandanten oder Gesetzen…"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSucheSubmit()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { md: 560 } }}
          />
          <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-end' }}>
            <Tooltip title="Benachrichtigungen">
              <IconButton
                aria-label="Benachrichtigungen"
                sx={{
                  width: 40,
                  height: 40,
                  border: (t) => `1px solid ${t.palette.divider}`,
                  borderRadius: '10px',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Profil & Einstellungen">
              <IconButton
                aria-label="Profil"
                onClick={() => navigate('/einstellungen')}
                sx={{
                  width: 40,
                  height: 40,
                  p: 0,
                  borderRadius: '50%',
                  border: (t) => `1px solid ${t.palette.divider}`,
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Avatar sx={{ width: 40, height: 40, fontSize: '0.8rem', fontWeight: 700, bgcolor: 'primary.main' }}>
                  {userInitials}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/faelle/neu')}
              sx={{ height: 40, borderRadius: '10px', px: 2.5 }}
            >
              Neuer Fall
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Begrüßung */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 1 }}>
          {greetingDe()}, Herr Rechtsanwalt.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 400, maxWidth: 720 }}>
          {kritischGesamt > 0
            ? `Sie haben heute ${kritischGesamt} kritische Frist${kritischGesamt === 1 ? '' : 'en'}, die sofortige Aufmerksamkeit erfordern.`
            : 'Keine kritischen Fristen für heute — gute Übersicht über Ihre Mandate.'}
        </Typography>
      </Box>

      {kritischeFaelle.length > 0 && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }} icon={false}>
          <AlertTitle sx={{ fontWeight: 700 }}>
            KSchG: {kritischeFaelle.length} Frist{kritischeFaelle.length > 1 ? 'en' : ''} akut
          </AlertTitle>
          {kritischeFaelle.map((f) => (
            <Box
              key={f.id}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, cursor: 'pointer' }}
              onClick={() => navigate(`/faelle/${f.id}`)}
            >
              <Typography variant="body2">
                <strong>{f.aktenzeichen}</strong> — § 4 KSchG
              </Typography>
              {f.arbeitsrecht?.fristEnde && <FristBadge fristEnde={f.arbeitsrecht.fristEnde} />}
            </Box>
          ))}
        </Alert>
      )}

      {/* KPI Bento */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          {
            key: 'faelle',
            label: 'Offene Fälle',
            value: loading ? null : faelle.length,
            hint: '+12%',
            hintColor: 'success.main',
            icon: <FolderOutlinedIcon sx={{ fontSize: 28, color: 'action.disabled' }} />,
            interactive: true,
            onClick: () => navigate('/faelle'),
          },
          {
            key: 'aufgaben',
            label: 'Anstehende Aufgaben',
            value: loading ? null : wiedervorlagen.length,
            hint: wiedervorlagen.length ? `${wiedervorlagen.length} aktiv` : '—',
            hintColor: 'text.secondary',
            icon: <RuleOutlinedIcon sx={{ fontSize: 28, color: 'action.disabled' }} />,
            interactive: true,
            onClick: () => navigate('/faelle'),
          },
          {
            key: 'fristen',
            label: 'Dringende Fristen',
            value: loading ? null : dringendeFristenGesamt,
            hint: dringendeFristenGesamt ? 'Handlungsbedarf' : 'OK',
            hintColor: dringendeFristenGesamt ? 'error.main' : 'success.main',
            icon: (
              <PriorityHighIcon
                sx={{
                  fontSize: 28,
                  color: dringendeFristenGesamt ? 'error.main' : 'action.disabled',
                }}
              />
            ),
            interactive: true,
            onClick: () => navigate('/faelle'),
          },
          {
            key: 'stunden',
            label: 'Abrechenbare Stunden',
            value: loading ? null : '—',
            hint: 'diesen Monat',
            hintColor: 'text.secondary',
            icon: <TimerOutlinedIcon sx={{ fontSize: 28, color: 'action.disabled' }} />,
            interactive: false,
            onClick: undefined,
          },
        ].map((k) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={k.key}>
            <Paper
              elevation={0}
              onClick={k.interactive ? k.onClick : undefined}
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'jurist.surfaceContainerLowest',
                boxShadow: CARD_SHADOW,
                cursor: k.interactive ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': k.interactive
                  ? {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(12, 15, 16, 0.08)',
                    }
                  : {},
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Typography
                  variant="overline"
                  sx={{ color: 'text.secondary', fontSize: '0.65rem', letterSpacing: '0.14em' }}
                >
                  {k.label}
                </Typography>
                {k.icon}
              </Stack>
              {loading ? (
                <Skeleton variant="text" width={80} height={42} />
              ) : (
                <Stack direction="row" alignItems="baseline" spacing={1} flexWrap="wrap">
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 800,
                      letterSpacing: '-0.04em',
                      color: k.key === 'fristen' && dringendeFristenGesamt ? 'error.main' : 'text.primary',
                    }}
                  >
                    {k.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: k.hintColor, fontWeight: 600 }}>
                    {k.hint}
                  </Typography>
                </Stack>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Linke Spalte: Aufgaben + Fälle */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Typography variant="overline" sx={{ mb: 2, display: 'block', letterSpacing: '0.18em' }}>
            Aktive Aufgaben
          </Typography>
          <Stack spacing={2} sx={{ mb: 5 }}>
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={88} sx={{ borderRadius: 3 }} />)
            ) : wiedervorlagen.length === 0 ? (
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 3, bgcolor: 'jurist.surfaceContainerLowest', boxShadow: CARD_SHADOW }}
              >
                <Typography color="text.secondary">Keine offenen Wiedervorlagen.</Typography>
              </Paper>
            ) : (
              wiedervorlagen.slice(0, 5).map((w, idx) => {
                const fall = faelle.find((f) => f.id === w.fallId);
                const st = aufgabenStatus(idx);
                return (
                  <Paper
                    key={w.id}
                    elevation={0}
                    onClick={() => navigate(`/faelle/${w.fallId}`)}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      bgcolor: 'jurist.surfaceContainerLowest',
                      boxShadow: CARD_SHADOW,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: alpha('#fff', 0.95) },
                    }}
                  >
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {w.beschreibung}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {fall?.aktenzeichen ?? w.fallId} · fällig{' '}
                          {format(parseISO(w.faelligAm), 'd. MMM yyyy', { locale: de })}
                        </Typography>
                      </Box>
                      <Chip
                        label={st}
                        size="small"
                        sx={{
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          letterSpacing: '0.06em',
                          bgcolor: 'jurist.surfaceVariant',
                          color: 'text.secondary',
                        }}
                      />
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>

          <Typography variant="overline" sx={{ mb: 2, display: 'block', letterSpacing: '0.18em' }}>
            Aktuelle Fälle
          </Typography>
          <Stack spacing={2.5}>
            {loading ? (
              <>
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
                <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />
              </>
            ) : recentFaelle.length === 0 ? (
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 3, bgcolor: 'jurist.surfaceContainerLowest', boxShadow: CARD_SHADOW }}
              >
                <Typography color="text.secondary">Keine Fälle vorhanden.</Typography>
              </Paper>
            ) : (
              recentFaelle.map((f) => {
                const pill = statusPill(f);
                const m = mandanten.find((x) => x.id === f.mandantId);
                return (
                  <Paper
                    key={f.id}
                    elevation={0}
                    onClick={() => navigate(`/faelle/${f.id}`)}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      bgcolor: 'jurist.surfaceContainerLowest',
                      boxShadow: CARD_SHADOW,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                      '&:hover': { boxShadow: '0 12px 40px rgba(12, 15, 16, 0.1)' },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Chip
                        label={rechtsgebietTag(f)}
                        size="small"
                        sx={{
                          borderRadius: 2,
                          fontWeight: 800,
                          fontSize: '0.65rem',
                          letterSpacing: '0.1em',
                          bgcolor: 'jurist.surfaceContainerHigh',
                        }}
                      />
                      <Chip
                        label={pill.label}
                        color={pill.color === 'default' ? 'default' : pill.color}
                        size="small"
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      {f.aktenzeichen}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                      {fallTitel(f, mandanten)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {f.notizen?.slice(0, 120) ||
                        (f.rechtsgebiet === 'verkehrsrecht'
                          ? 'Verkehrsrechtssache — Schadenregulierung und Gutachten.'
                          : 'Arbeitsrechtssache — Mandantenvertretung und Fristen.')}
                      {(f.notizen?.length ?? 0) > 120 ? '…' : ''}
                    </Typography>
                    <Stack direction="row" spacing={-0.5}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.85rem',
                          bgcolor: 'primary.main',
                          border: '2px solid',
                          borderColor: 'background.default',
                        }}
                      >
                        {m?.nachname?.slice(0, 1) ?? '?'}
                      </Avatar>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: '0.85rem',
                          bgcolor: 'jurist.surfaceVariant',
                          color: 'text.primary',
                          border: '2px solid',
                          borderColor: 'background.default',
                          ml: -1,
                        }}
                      >
                        +
                      </Avatar>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Grid>

        {/* Rechte Spalte: Fristen + Nachrichten */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'jurist.surfaceContainerLow',
              boxShadow: CARD_SHADOW,
              mb: 3,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, letterSpacing: '0.04em' }}>
              Kritische Fristen
            </Typography>
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} height={56} sx={{ mb: 1, borderRadius: 2 }} />)
            ) : fristenWidgetItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Keine anstehenden Fristen in der Übersicht.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {fristenWidgetItems.map((it) => {
                  const Icon = it.icon;
                  return (
                    <Stack key={it.key} direction="row" spacing={2} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: (t) =>
                            it.tone === 'kritisch'
                              ? alpha(t.palette.error.main, 0.14)
                              : it.tone === 'warnung'
                                ? alpha(t.palette.warning.main, 0.2)
                                : alpha(t.palette.success.main, 0.18),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Icon
                          sx={{
                            fontSize: 22,
                            color:
                              it.tone === 'kritisch'
                                ? 'error.main'
                                : it.tone === 'warnung'
                                  ? 'warning.main'
                                  : 'success.main',
                          }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {it.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: it.tone === 'kritisch' ? 'error.main' : 'text.secondary',
                            fontWeight: it.tone === 'kritisch' ? 700 : 500,
                            display: 'block',
                          }}
                        >
                          {it.line}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            )}
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              bgcolor: 'jurist.surfaceContainerLowest',
              boxShadow: CARD_SHADOW,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <ChatBubbleOutlineIcon sx={{ color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: '0.04em' }}>
                Letzte Nachrichten
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Noch keine Nachrichten angebunden — dieses Modul folgt in einer späteren Version.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Fab
        color="primary"
        aria-label="Neuer Fall"
        sx={{
          position: 'fixed',
          right: { xs: 16, md: 32 },
          bottom: { xs: 16, md: 32 },
          zIndex: 30,
          boxShadow: CARD_SHADOW,
        }}
        onClick={() => navigate('/faelle/neu')}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
