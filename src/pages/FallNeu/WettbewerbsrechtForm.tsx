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
  { value: 'abmahnung', label: 'Abmahnung' },
  { value: 'einstw_verfuegung', label: 'Einstweilige Verfügung' },
  { value: 'hauptsacheklage', label: 'Hauptsacheklage' },
  { value: 'schutzschrift', label: 'Schutzschrift' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const schema = z.object({
  aktenzeichen: z.string().min(3, 'Pflichtfeld'),
  mandantId: z.string().min(1, 'Mandant wählen'),
  falltyp: z.enum(['abmahnung', 'einstw_verfuegung', 'hauptsacheklage', 'schutzschrift', 'sonstiges']),
  gegenseite: z.string().optional(),
  verletzungshandlung: z.string().optional(),
  abmahnungsdatum: z.string().optional(),
  fristsetzung: z.string().optional(),
  streitwert: z.coerce.number().optional(),
  notizen: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSaved: (id: string) => void;
}

export default function WettbewerbsrechtForm({ onBack, onSaved }: Props) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { falltyp: 'abmahnung' },
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
        setValue('aktenzeichen', naechstesAktenzeichen(az, 'wettbewerbsrecht'));
      })
      .catch(() => {
        if (!cancelled) setValue('aktenzeichen', naechstesAktenzeichen([], 'wettbewerbsrecht'));
      });
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const falltyp = watch('falltyp');

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const fall = await faelleApi.create({
        aktenzeichen: data.aktenzeichen,
        rechtsgebiet: 'wettbewerbsrecht',
        status: 'aktiv',
        phase: 1,
        mandantId: data.mandantId,
        notizen: data.notizen,
        wettbewerbsrecht: {
          falltyp: data.falltyp,
          gegenseite: data.gegenseite || undefined,
          verletzungshandlung: data.verletzungshandlung || undefined,
          abmahnungsdatum: data.abmahnungsdatum || undefined,
          fristsetzung: data.fristsetzung || undefined,
          streitwert: data.streitwert || undefined,
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
        Wettbewerbsrecht — Fallanlage
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

          {/* Wettbewerbsdetails */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Wettbewerbsdetails
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
              label="Gegenseite / Verletzer"
              fullWidth
              {...register('gegenseite')}
              helperText="Name des Verletzers / der Gegenseite"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="Verletzungshandlung"
              fullWidth
              {...register('verletzungshandlung')}
              helperText="z.B. unlautere Werbung, Markenrechtsverletzung, Irreführung"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Streitwert (€)"
              type="number"
              fullWidth
              {...register('streitwert')}
            />
          </Grid>

          {(falltyp === 'abmahnung' || falltyp === 'einstw_verfuegung') && (
            <>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Datum der Abmahnung"
                  type="date"
                  fullWidth
                  {...register('abmahnungsdatum')}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Fristsetzung bis"
                  type="date"
                  fullWidth
                  {...register('fristsetzung')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  helperText="Frist zur Abgabe der Unterlassungserklärung"
                />
              </Grid>
            </>
          )}

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
