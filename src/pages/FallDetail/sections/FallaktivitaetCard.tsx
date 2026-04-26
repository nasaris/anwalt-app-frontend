import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import type { FallaktivitaetZeile } from '../../../utils/fallAktivitaetTimeline';
import {
  FALL_AKTIVITAET_FILTER_LABEL,
  FALL_AKTIVITAET_TYPEN,
  type FallAktivitaetTyp,
  filterVonFallAktivitaet,
} from '../hooks/useFallaktivitaet';
import FallaktivitaetListenZeile from './FallaktivitaetListenZeile';

interface Props {
  zeilen: FallaktivitaetZeile[];
  zeilenGefiltert: FallaktivitaetZeile[];
  suche: string;
  filter: Set<FallAktivitaetTyp>;
  open: boolean;
  onSucheChange: (v: string) => void;
  onFilterChange: (fn: (prev: Set<FallAktivitaetTyp>) => Set<FallAktivitaetTyp>) => void;
  onFilterReset: () => void;
  onToggleOpen: () => void;
  onNotiz: () => void;
  onAnruf: () => void;
  onVolltext: (zeile: FallaktivitaetZeile) => void;
  onBearbeiten: (zeile: FallaktivitaetZeile) => void;
  onLoeschen: (zeile: FallaktivitaetZeile) => void;
}

export default function FallaktivitaetCard({
  zeilen, zeilenGefiltert, suche, filter, open,
  onSucheChange, onFilterChange, onFilterReset, onToggleOpen,
  onNotiz, onAnruf, onVolltext, onBearbeiten, onLoeschen,
}: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2.5 },
        borderRadius: 3,
        borderColor: 'rgba(15, 23, 42, 0.08)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'flex-start' }}
        spacing={1.25}
        sx={{
          mx: { xs: -1.5, md: -2.5 },
          mt: { xs: -1.5, md: -2.5 },
          mb: 1,
          px: { xs: 1.5, md: 2.5 },
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Box sx={{ cursor: 'pointer', flex: 1, minWidth: 0 }} onClick={onToggleOpen}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <HistoryIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={600}>Fallaktivität</Typography>
            {zeilen.length > 0 && <Chip label={zeilen.length} size="small" variant="outlined" />}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Chronik aus Notizen, Anrufen, Phase/Status, Schriftverkehr, Uploads und Dokumenten.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ rowGap: 0.75 }}>
          <Button size="small" variant="outlined" startIcon={<EditNoteIcon />} onClick={onNotiz}>Notiz</Button>
          <Button size="small" variant="outlined" startIcon={<PhoneIcon />} onClick={onAnruf}>Anruf</Button>
          <Tooltip title={open ? 'Einklappen' : 'Ausklappen'}>
            <IconButton size="small" onClick={onToggleOpen} aria-label={open ? 'Fallaktivität einklappen' : 'Fallaktivität ausklappen'}>
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ mt: 2 }}>
          <Stack spacing={1.25} sx={{ mb: 1.5 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Fallaktivität durchsuchen …"
              value={suche}
              onChange={(e) => onSucheChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              aria-label="Fallaktivität durchsuchen"
            />
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap alignItems="center">
              <Chip
                size="small"
                label={`Alle · ${zeilen.length}`}
                clickable
                color={filter.size === 0 ? 'primary' : 'default'}
                variant={filter.size === 0 ? 'filled' : 'outlined'}
                onClick={onFilterReset}
              />
              {FALL_AKTIVITAET_TYPEN.map((key) => {
                const count = zeilen.filter((z) => filterVonFallAktivitaet(z) === key).length;
                const active = filter.has(key);
                return (
                  <Chip
                    key={key}
                    size="small"
                    label={`${FALL_AKTIVITAET_FILTER_LABEL[key]} · ${count}`}
                    clickable
                    color={active ? 'primary' : 'default'}
                    variant={active ? 'filled' : 'outlined'}
                    onClick={() =>
                      onFilterChange((prev) => {
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })
                    }
                  />
                );
              })}
            </Stack>
          </Stack>
          {zeilen.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Noch keine Aktivitäten — Notiz oder Anruf anlegen, oder Schriftverkehr und Dateien erfassen.
            </Typography>
          ) : zeilenGefiltert.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Treffer für den gewählten Filter{suche.trim() ? ` und „${suche.trim()}"` : ''}.
            </Typography>
          ) : (
            <Box sx={{ maxHeight: 480, overflowY: 'auto', pr: 0.5 }}>
              <Stack spacing={1}>
                {zeilenGefiltert.map((z) => (
                  <FallaktivitaetListenZeile
                    key={z.id}
                    zeile={z}
                    onVolltext={onVolltext}
                    onBearbeiten={onBearbeiten}
                    onLoeschen={onLoeschen}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}
