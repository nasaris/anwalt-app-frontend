import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import type { Fall, Mandant } from '../../../types';

interface Props {
  open: boolean;
  fall: Fall;
  suche: string;
  kandidaten: Mandant[];
  onClose: () => void;
  onSucheChange: (v: string) => void;
  onHinzufuegen: (mandantId: string) => void;
}

export default function WeitereMandantenDialog({
  open, fall, suche, kandidaten, onClose, onSucheChange, onHinzufuegen,
}: Props) {
  const forbidden = new Set<string>([fall.mandantId, ...(fall.weitereMandantenIds ?? [])]);
  const gefiltert = kandidaten.filter((m) => {
    if (forbidden.has(m.id)) return false;
    if (!suche.trim()) return true;
    const q = suche.trim().toLowerCase();
    const name = `${m.vorname} ${m.nachname}`.toLowerCase();
    return name.includes(q) || (m.email ?? '').toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Weiteren Mandanten zuordnen</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="Suchen…"
          value={suche}
          onChange={(e) => onSucheChange(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.disabled' }} /> }}
          sx={{ mb: 2 }}
          autoFocus
        />
        {gefiltert.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Keine Treffer
          </Typography>
        ) : (
          <Stack spacing={1}>
            {gefiltert.map((m) => (
              <Box
                key={m.id}
                onClick={() => onHinzufuegen(m.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                }}
              >
                <Avatar sx={{ bgcolor: 'grey.400', width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700 }}>
                  {m.vorname[0]}{m.nachname[0]}
                </Avatar>
                <Box flex={1} minWidth={0}>
                  <Typography variant="subtitle2" fontWeight={700} noWrap>
                    {m.kategorie === 'unternehmen' ? m.nachname : `${m.vorname} ${m.nachname}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{m.email}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}
