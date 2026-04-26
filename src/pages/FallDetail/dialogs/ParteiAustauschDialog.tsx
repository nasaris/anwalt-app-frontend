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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import type { Partei } from '../../../types';
import type { VrParteiAustauschZiel } from '../hooks/useVrParteien';
import { parteiInitialen } from '../hooks/useVrParteien';

interface Props {
  open: boolean;
  ziel: VrParteiAustauschZiel | null;
  suche: string;
  ausgewaehltId: string;
  kandidaten: Partei[];
  onClose: () => void;
  onSucheChange: (v: string) => void;
  onAuswaehlen: (id: string) => void;
  onUebernehmen: () => void;
}

export default function ParteiAustauschDialog({
  open, ziel, suche, ausgewaehltId, kandidaten,
  onClose, onSucheChange, onAuswaehlen, onUebernehmen,
}: Props) {
  const filtered = kandidaten.filter(
    (p) =>
      p.typ === ziel?.typ &&
      p.id !== (ziel?.aktuelleId || '') &&
      p.name.toLowerCase().includes(suche.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {ziel?.aktuelleId
              ? `${ziel.label} austauschen`
              : `${ziel?.label ?? ''} zuweisen`}
          </Typography>
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
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Keine Treffer
          </Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((p) => {
              const selected = ausgewaehltId === p.id;
              return (
                <Box
                  key={p.id}
                  onClick={() => onAuswaehlen(p.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? 'primary.50' : 'background.paper',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background-color 0.15s',
                    '&:hover': { borderColor: 'primary.main', bgcolor: selected ? 'primary.50' : 'action.hover' },
                  }}
                >
                  <Avatar sx={{ bgcolor: selected ? 'primary.main' : 'grey.400', width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700, flexShrink: 0 }}>
                    {parteiInitialen(p)}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {p.adresse ? `${p.adresse.plz} ${p.adresse.ort}` : ziel?.label}
                    </Typography>
                  </Box>
                  {selected && <CheckCircleIcon color="primary" />}
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" disabled={!ausgewaehltId} onClick={onUebernehmen}>
          Übernehmen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
