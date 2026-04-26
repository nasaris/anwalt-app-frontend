import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { wiedervorlagenApi } from '../../../api/parteien';
import type { Wiedervorlage, WiedervorlageTyp } from '../../../types';

const WV_TYPEN: { value: WiedervorlageTyp; label: string }[] = [
  { value: 'allgemein', label: 'Allgemein' },
  { value: 'frist_versicherung', label: 'Frist Versicherung' },
  { value: 'kschg_frist', label: 'KSchG-Frist' },
  { value: 'lag_berufung', label: 'LAG-Berufungsfrist' },
  { value: 'kuendigung_frist', label: 'Kündigungsfrist' },
];

interface Props {
  open: boolean;
  fallId: string;
  onClose: () => void;
  onSaved: (wv: Wiedervorlage) => void;
}

export default function WiedervorlageDialog({ open, fallId, onClose, onSaved }: Props) {
  const [beschreibung, setBeschreibung] = useState('');
  const [faelligAm, setFaelligAm] = useState('');
  const [typ, setTyp] = useState<WiedervorlageTyp>('allgemein');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!beschreibung || !faelligAm) return;
    setSaving(true);
    const wv = await wiedervorlagenApi.create({
      fallId,
      typ,
      beschreibung,
      faelligAm: new Date(faelligAm).toISOString(),
      erledigt: false,
    });
    setSaving(false);
    setBeschreibung('');
    setFaelligAm('');
    setTyp('allgemein');
    onSaved(wv);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Wiedervorlage hinzufügen</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Typ</InputLabel>
            <Select value={typ} onChange={(e) => setTyp(e.target.value as WiedervorlageTyp)} label="Typ">
              {WV_TYPEN.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Beschreibung / Aufgabe"
            fullWidth
            multiline
            rows={2}
            value={beschreibung}
            onChange={(e) => setBeschreibung(e.target.value)}
            required
          />
          <TextField
            label="Fällig am"
            type="date"
            fullWidth
            value={faelligAm}
            onChange={(e) => setFaelligAm(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" disabled={!beschreibung || !faelligAm || saving} onClick={handleSave}>
          {saving ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
