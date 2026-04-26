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
} from '@mui/material';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import { AKTENZEICHEN_AUTO_HINT, naechstesAktenzeichen } from '../../utils/aktenzeichenVergabe';
import type { Mandant } from '../../types';

const FALLTYPEN = [
  { value: 'pflichtteil', label: 'Pflichtteilsanspruch' },
  { value: 'testament_anfechtung', label: 'Testament / Erbvertrag anfechten' },
  { value: 'erbschein', label: 'Erbschein beantragen' },
  { value: 'erbauseinandersetzung', label: 'Erbauseinandersetzung' },
  { value: 'nachlasspflege', label: 'Nachlasspflege / -verwaltung' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const schema = z.object({
  aktenzeichen: z.string().min(3, 'Pflichtfeld'),
  mandantId: z.string().min(1, 'Mandant wählen'),
  falltyp: z.enum(['pflichtteil', 'testament_anfechtung', 'erbschein', 'erbauseinandersetzung', 'nachlasspflege', 'sonstiges']),
  erblasser: z.string().optional(),
  todesdatum: z.string().optional(),
  nachlassgericht: z.string().optional(),
  nachlassAktenzeichen: z.string().optional(),
  forderungsbetrag: z.coerce.number().optional(),
  notizen: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSaved: (id: string) => void;
}

export default function ErbrechtForm({ onBack, onSaved }: Props) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { falltyp: 'pflichtteil' },
  });

  useEffect(() => {
    mandantenApi.getAll().then(setMandanten);
  }, []);

  useEffect(() => {
    let cancelled = false;
    faelleApi
      .getAll()
      .then((faelle) => {
        if (cancelled) return;
        const az = faelle.map((f) => f.aktenzeichen);
        setValue('aktenzeichen', naechstesAktenzeichen(az, 'erbrecht'));
      })
      .catch(() => {
        if (!cancelled) setValue('aktenzeichen', naechstesAktenzeichen([], 'erbrecht'));
      });
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const fall = await faelleApi.create({
        aktenzeichen: data.aktenzeichen,
        rechtsgebiet: 'erbrecht',
        status: 'aktiv',
        phase: 1,
        mandantId: data.mandantId,
        notizen: data.notizen,
        erbrecht: {
          falltyp: data.falltyp,
          erblasser: data.erblasser || undefined,
          todesdatum: data.todesdatum || undefined,
          nachlassgericht: data.nachlassgericht || undefined,
          nachlassAktenzeichen: data.nachlassAktenzeichen || undefined,
          forderungsbetrag: data.forderungsbetrag || undefined,
        },
      });
      onSaved(fall.id);
    } catch {
      setError('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" mb={3}>
        Erbrecht — Fallanlage
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          {/* Allgemein */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Allgemein
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Aktenzeichen"
              fullWidth
              {...register('aktenzeichen')}
              error={!!errors.aktenzeichen}
              helperText={errors.aktenzeichen?.message ?? AKTENZEICHEN_AUTO_HINT}
              required
              InputProps={{ readOnly: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth error={!!errors.mandantId} required>
              <InputLabel>Mandant</InputLabel>
              <Controller
                name="mandantId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Mandant">
                    {mandanten.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.vorname} {m.nachname}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Erbrecht-Details */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Erbrechtsdetails
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.falltyp}>
              <InputLabel>Falltyp</InputLabel>
              <Controller
                name="falltyp"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Falltyp">
                    {FALLTYPEN.map((ft) => (
                      <MenuItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Erblasser (Name)"
              fullWidth
              {...register('erblasser')}
              helperText="Vollständiger Name des Erblassers"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Todesdatum"
              type="date"
              fullWidth
              {...register('todesdatum')}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Datum des Todes des Erblassers"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Forderungsbetrag / Erbteilswert (€)"
              type="number"
              fullWidth
              {...register('forderungsbetrag')}
              helperText="Streitwert oder Pflichtteilsbetrag"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Nachlassgericht */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Nachlassgericht (optional)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nachlassgericht"
              fullWidth
              {...register('nachlassgericht')}
              helperText="z.B. Amtsgericht München — Nachlassgericht"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Nachlassgericht-Aktenzeichen"
              fullWidth
              {...register('nachlassAktenzeichen')}
              helperText="Aktenzeichen des Nachlassgerichts"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              label="Fallaktivität — erste Notiz"
              multiline
              rows={3}
              fullWidth
              {...register('notizen')}
              helperText="Interne Notiz zum Fall — erscheint in der Chronik auf der Falldetailseite."
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={2} mt={3}>
          <Button variant="outlined" onClick={onBack}>
            Zurück
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Wird gespeichert...' : 'Fall anlegen'}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
