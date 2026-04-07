import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Typography,
} from '@mui/material';
import { parteienApi } from '../../api/parteien';
import type { Partei, ParteienTyp } from '../../types';

const TYP_LABELS: Record<ParteienTyp, string> = {
  gutachter: 'Gutachter',
  werkstatt: 'Werkstatt',
  versicherung: 'Versicherung',
  gegenseite: 'Gegenseite / Arbeitgeber',
  gericht: 'Gericht',
};

const schema = z.object({
  typ: z.enum(['gutachter', 'werkstatt', 'versicherung', 'gegenseite', 'gericht']),
  name: z.string().min(1, 'Pflichtfeld'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  telefon: z.string().optional(),
  strasse: z.string().optional(),
  plz: z.string().optional(),
  ort: z.string().optional(),
  gutachterNr: z.string().optional(),
  schadensnummer: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (partei: Partei) => void;
  defaultTyp?: ParteienTyp;
  /** Wenn gesetzt → Bearbeiten (Update), sonst neue Partei */
  partei?: Partei | null;
}

export default function ParteiDialog({ open, onClose, onSaved, defaultTyp, partei: editPartei }: Props) {
  const isEdit = Boolean(editPartei);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { typ: defaultTyp ?? 'versicherung' },
  });

  useEffect(() => {
    if (!open) return;
    if (editPartei) {
      reset({
        typ: editPartei.typ,
        name: editPartei.name,
        email: editPartei.email ?? '',
        telefon: editPartei.telefon ?? '',
        strasse: editPartei.adresse?.strasse ?? '',
        plz: editPartei.adresse?.plz ?? '',
        ort: editPartei.adresse?.ort ?? '',
        gutachterNr: editPartei.gutachterNr ?? '',
        schadensnummer: editPartei.schadensnummer ?? '',
      });
    } else {
      reset({ typ: defaultTyp ?? 'versicherung' });
    }
  }, [open, reset, defaultTyp, editPartei]);

  const typ = watch('typ');

  const onSubmit = async (data: FormValues) => {
    const payload = {
      typ: data.typ,
      name: data.name,
      email: data.email || undefined,
      telefon: data.telefon || undefined,
      adresse:
        data.strasse && data.plz && data.ort
          ? { strasse: data.strasse, plz: data.plz, ort: data.ort }
          : undefined,
      gutachterNr: data.gutachterNr || undefined,
      schadensnummer: data.schadensnummer || undefined,
    };

    if (editPartei) {
      const updated = await parteienApi.update(editPartei.id, payload);
      onSaved(updated);
    } else {
      const partei = await parteienApi.create({
        ...payload,
        erstelltAm: new Date().toISOString(),
      });
      onSaved(partei);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? 'Partei bearbeiten' : 'Neue Partei anlegen'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Typ</InputLabel>
                <Controller
                  name="typ"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} label="Typ" disabled={isEdit}>
                      {(Object.entries(TYP_LABELS) as [ParteienTyp, string][]).map(([v, l]) => (
                        <MenuItem key={v} value={v}>{l}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Name / Firma" fullWidth required {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="E-Mail" type="email" fullWidth {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Telefon" fullWidth {...register('telefon')} />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
              <Typography variant="subtitle2" color="primary" mt={2} mb={1}>Adresse (optional)</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Straße & Hausnummer" fullWidth {...register('strasse')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="PLZ" fullWidth {...register('plz')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField label="Ort" fullWidth {...register('ort')} />
            </Grid>

            {/* Typ-spezifische Felder */}
            {typ === 'gutachter' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                  <Typography variant="subtitle2" color="primary" mt={2} mb={1}>Gutachter</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Gutachter-Nr. (BVSK o.ä.)" fullWidth {...register('gutachterNr')} />
                </Grid>
              </>
            )}
            {typ === 'versicherung' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Divider />
                  <Typography variant="subtitle2" color="primary" mt={2} mb={1}>Versicherung</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="Schadensnummer" fullWidth {...register('schadensnummer')} />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Wird gespeichert...' : isEdit ? 'Speichern' : 'Partei anlegen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
