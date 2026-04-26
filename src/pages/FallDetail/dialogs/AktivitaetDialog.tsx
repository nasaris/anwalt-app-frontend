import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface Props {
  open: boolean;
  typ: 'notiz' | 'anruf' | null;
  betreff: string;
  draft: string;
  isBearbeiten: boolean;
  onBetreffChange: (v: string) => void;
  onDraftChange: (v: string) => void;
  onClose: () => void;
  onSpeichern: () => void;
}

export default function AktivitaetDialog({
  open,
  typ,
  betreff,
  draft,
  isBearbeiten,
  onBetreffChange,
  onDraftChange,
  onClose,
  onSpeichern,
}: Props) {
  const title = isBearbeiten
    ? typ === 'anruf'
      ? 'Anruf bearbeiten'
      : 'Notiz bearbeiten'
    : typ === 'anruf'
      ? 'Anruf dokumentieren'
      : 'Notiz hinzufügen';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label="Betreff"
            fullWidth
            required
            value={betreff}
            onChange={(e) => onBetreffChange(e.target.value)}
            placeholder={typ === 'anruf' ? 'z. B. Rückruf Versicherung' : 'Kurz zum Thema'}
          />
          <TextField
            label={typ === 'anruf' ? 'Gespräch / Ergebnis' : 'Notiz'}
            multiline
            minRows={4}
            fullWidth
            required
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={
              typ === 'anruf'
                ? 'Wer, wann, was besprochen, nächste Schritte …'
                : 'Ausführlicher Text …'
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={onSpeichern} disabled={!betreff.trim() || !draft.trim()}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface LesenProps {
  open: boolean;
  titel?: string;
  text?: string;
  onClose: () => void;
}

export function AktivitaetLesenDialog({ open, titel, text, onClose }: LesenProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{titel}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', pt: 0.5 }}>
          {text}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}

interface LoeschenProps {
  open: boolean;
  titel?: string;
  onClose: () => void;
  onBestaetigt: () => void;
}

export function AktivitaetLoeschenDialog({ open, titel, onClose, onBestaetigt }: LoeschenProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Eintrag löschen?</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          „{titel}" wird aus der Fallaktivität entfernt. Diese Aktion kann nicht rückgängig gemacht
          werden.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button color="error" variant="contained" onClick={onBestaetigt}>
          Löschen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
