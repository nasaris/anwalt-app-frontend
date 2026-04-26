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
  { value: 'regelinsolvenz', label: 'Regelinsolvenz' },
  { value: 'verbraucherinsolvenz', label: 'Verbraucherinsolvenz' },
  { value: 'eigenverwaltung', label: 'Eigenverwaltung (§ 270 InsO)' },
  { value: 'planinsolvenz', label: 'Insolvenzplan' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const schema = z.object({
  aktenzeichen: z.string().min(3, 'Pflichtfeld'),
  mandantId: z.string().min(1, 'Mandant wählen'),
  falltyp: z.enum(['regelinsolvenz', 'verbraucherinsolvenz', 'eigenverwaltung', 'planinsolvenz', 'sonstiges']),
  schuldner: z.string().optional(),
  forderungsbetrag: z.coerce.number().optional(),
  insolvenzgericht: z.string().optional(),
  insolvenzAktenzeichen: z.string().optional(),
  antragsdatum: z.string().optional(),
  eroeffnungsdatum: z.string().optional(),
  notizen: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSaved: (id: string) => void;
}

export default function InsolvenzrechtForm({ onBack, onSaved }: Props) {
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
    defaultValues: { falltyp: 'regelinsolvenz' },
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
        setValue('aktenzeichen', naechstesAktenzeichen(az, 'insolvenzrecht'));
      })
      .catch(() => {
        if (!cancelled) setValue('aktenzeichen', naechstesAktenzeichen([], 'insolvenzrecht'));
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
        rechtsgebiet: 'insolvenzrecht',
        status: 'aktiv',
        phase: 1,
        mandantId: data.mandantId,
        notizen: data.notizen,
        insolvenzrecht: {
          falltyp: data.falltyp,
          schuldner: data.schuldner || undefined,
          forderungsbetrag: data.forderungsbetrag || undefined,
          insolvenzgericht: data.insolvenzgericht || undefined,
          insolvenzAktenzeichen: data.insolvenzAktenzeichen || undefined,
          antragsdatum: data.antragsdatum || undefined,
          eroeffnungsdatum: data.eroeffnungsdatum || undefined,
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
        Insolvenzrecht — Fallanlage
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

          {/* Insolvenzdetails */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Insolvenzdetails
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required error={!!errors.falltyp}>
              <InputLabel>Art des Verfahrens</InputLabel>
              <Controller
                name="falltyp"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Art des Verfahrens">
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
              label="Schuldner (Name / Firma)"
              fullWidth
              {...register('schuldner')}
              helperText="Schuldner / Insolvenzschuldner"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Forderungsbetrag (€)"
              type="number"
              fullWidth
              {...register('forderungsbetrag')}
              helperText="Angemeldete Forderungshöhe"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Insolvenzgericht"
              fullWidth
              {...register('insolvenzgericht')}
              helperText="z.B. Amtsgericht München"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Insolvenz-Aktenzeichen (Gericht)"
              fullWidth
              {...register('insolvenzAktenzeichen')}
              helperText="Gerichtliches Aktenzeichen des Insolvenzverfahrens"
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Termine */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Verfahrensterm­ine (optional)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Antragsdatum"
              type="date"
              fullWidth
              {...register('antragsdatum')}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Datum der Insolvenzantragstellung"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Eröffnungsdatum"
              type="date"
              fullWidth
              {...register('eroeffnungsdatum')}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Datum der Insolvenzeröffnung (falls bekannt)"
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
