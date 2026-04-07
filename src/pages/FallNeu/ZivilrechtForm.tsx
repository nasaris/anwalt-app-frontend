import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import type { Mandant } from '../../types';
import MandantDialog from '../../components/MandantDialog/MandantDialog';

const FALLTYP_OPTIONEN = [
  { value: 'vertrag',      label: 'Vertragsdurchsetzung / -streitigkeit' },
  { value: 'forderung',    label: 'Forderungseinzug / Inkasso' },
  { value: 'kaufrecht',    label: 'Kaufrecht / Sachmängel' },
  { value: 'schadensersatz', label: 'Schadensersatz' },
  { value: 'mietrecht',   label: 'Mietrecht' },
  { value: 'sonstiges',   label: 'Sonstiges' },
];

const schema = z.object({
  aktenzeichen: z.string().min(3, 'Pflichtfeld'),
  mandantId: z.string().min(1, 'Mandant wählen'),
  falltyp: z.enum(['vertrag', 'forderung', 'kaufrecht', 'schadensersatz', 'mietrecht', 'sonstiges']),
  gegenseite: z.string().optional(),
  streitwert: z.string().optional(),
  forderungsbetrag: z.string().optional(),
  mahnfristEnde: z.string().optional(),
  notizen: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSaved: (id: string) => void;
}

export default function ZivilrechtForm({ onBack, onSaved }: Props) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mandantNeuOpen, setMandantNeuOpen] = useState(false);
  const [mandantEditOpen, setMandantEditOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mandantId: '',
      falltyp: 'forderung',
      gegenseite: '',
      streitwert: '',
      forderungsbetrag: '',
      mahnfristEnde: '',
      notizen: '',
    },
  });

  useEffect(() => {
    mandantenApi.getAll().then((m) => setMandanten(Array.isArray(m) ? m : []));
  }, []);

  const selectedMandantId = watch('mandantId');
  const selectedMandant = mandanten.find((m) => m.id === selectedMandantId);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const fall = await faelleApi.create({
        aktenzeichen: data.aktenzeichen,
        rechtsgebiet: 'zivilrecht',
        status: 'aktiv',
        phase: 1,
        mandantId: data.mandantId,
        notizen: data.notizen,
        zivilrecht: {
          falltyp: data.falltyp,
          gegenseite: data.gegenseite || undefined,
          streitwert: data.streitwert ? parseFloat(data.streitwert) : undefined,
          forderungsbetrag: data.forderungsbetrag ? parseFloat(data.forderungsbetrag) : undefined,
          mahnfristEnde: data.mahnfristEnde || undefined,
        },
      });
      onSaved(fall.id);
    } catch {
      setError('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" mb={3}>Zivilrecht — Fallanlage</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>Allgemein</Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Aktenzeichen"
              fullWidth
              {...register('aktenzeichen')}
              error={!!errors.aktenzeichen}
              helperText={errors.aktenzeichen?.message ?? 'z.B. ZR/2025/001'}
              required
            />
          </Grid>

          {/* Mandant */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <FormControl fullWidth error={!!errors.mandantId} required>
                <InputLabel>Mandant</InputLabel>
                <Controller
                  name="mandantId"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Mandant" value={field.value ?? ''}>
                      {mandanten.length === 0 && (
                        <MenuItem value="" disabled><em>Keine Mandanten vorhanden</em></MenuItem>
                      )}
                      {mandanten.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.kategorie === 'unternehmen' ? m.nachname : `${m.nachname}, ${m.vorname}`}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                {errors.mandantId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                    {errors.mandantId.message}
                  </Typography>
                )}
              </FormControl>
              <Tooltip title="Neuen Mandanten anlegen">
                <IconButton onClick={() => setMandantNeuOpen(true)}
                  sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={selectedMandant ? 'Ausgewählten Mandanten bearbeiten' : 'Zuerst Mandanten auswählen'}>
                <span>
                  <IconButton onClick={() => setMandantEditOpen(true)} disabled={!selectedMandant}
                    sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <EditOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /></Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>Streitgegenstand</Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.falltyp}>
              <InputLabel>Falltyp</InputLabel>
              <Controller
                name="falltyp"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Falltyp" value={field.value ?? ''}>
                    {FALLTYP_OPTIONEN.map((o) => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Gegenseite (Name)"
              fullWidth
              {...register('gegenseite')}
              helperText="Name der Gegenseite / Schuldner"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Forderungsbetrag (€)"
              type="number"
              fullWidth
              {...register('forderungsbetrag')}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Hauptforderung ohne Zinsen"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Streitwert (€)"
              type="number"
              fullWidth
              {...register('streitwert')}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Gerichtlicher Streitwert (falls abweichend)"
            />
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /></Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Außergerichtliche Phase
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Mahnfrist bis"
              type="date"
              fullWidth
              {...register('mahnfristEnde')}
              InputLabelProps={{ shrink: true }}
              helperText="Frist aus dem Mahnschreiben — löst Wiedervorlage aus"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Alert severity="info" sx={{ mt: 0 }}>
              Phase 1 — Außergerichtlich: Mahnschreiben, Fristsetzung, Vergleichsgespräche.
              Phase 2 — Gerichtlich: Klage / Mahnbescheid, Gütetermin, Urteil.
            </Alert>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Notizen"
              multiline
              rows={3}
              fullWidth
              {...register('notizen')}
              helperText="Interne Notizen zum Fall"
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} mt={3}>
          <Button variant="outlined" onClick={onBack}>Zurück</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Wird gespeichert...' : 'Fall anlegen'}
          </Button>
        </Stack>
      </form>

      <MandantDialog
        open={mandantNeuOpen}
        onClose={() => setMandantNeuOpen(false)}
        onSaved={(neu) => {
          setMandanten((prev) => [...prev, neu]);
          setValue('mandantId', neu.id, { shouldValidate: true });
          setMandantNeuOpen(false);
        }}
      />
      {selectedMandant && (
        <MandantDialog
          open={mandantEditOpen}
          mandant={selectedMandant}
          onClose={() => setMandantEditOpen(false)}
          onSaved={(updated) => {
            setMandanten((prev) => prev.map((m) => m.id === updated.id ? updated : m));
            setMandantEditOpen(false);
          }}
        />
      )}
    </Paper>
  );
}
