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
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { mandantenApi } from '../../api/mandanten';
import type { Mandant, MandantKategorie } from '../../types';

const schema = z.object({
  kategorie: z.enum(['privat', 'unternehmen']),
  // Privat
  vorname: z.string().optional(),
  nachname: z.string().optional(),
  // Unternehmen
  firmenname: z.string().optional(),
  ansprechpartner: z.string().optional(),
  // Gemeinsam
  email: z.string().email('Ungültige E-Mail'),
  telefon: z.string().min(1, 'Pflichtfeld'),
  strasse: z.string().min(1, 'Pflichtfeld'),
  plz: z.string().min(4, 'Pflichtfeld'),
  ort: z.string().min(1, 'Pflichtfeld'),
  rsv: z.boolean(),
  rsvGesellschaft: z.string().optional(),
  rsvNummer: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.kategorie === 'privat') {
    if (!data.vorname?.trim())
      ctx.addIssue({ code: 'custom', path: ['vorname'], message: 'Pflichtfeld' });
    if (!data.nachname?.trim())
      ctx.addIssue({ code: 'custom', path: ['nachname'], message: 'Pflichtfeld' });
  } else {
    if (!data.firmenname?.trim())
      ctx.addIssue({ code: 'custom', path: ['firmenname'], message: 'Pflichtfeld' });
  }
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (mandant: Mandant) => void;
  mandant?: Mandant; // wenn gesetzt → Edit-Modus
}

export default function MandantDialog({ open, onClose, onSaved, mandant: editMandant }: Props) {
  const isEdit = Boolean(editMandant);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { kategorie: 'privat', rsv: false },
  });

  useEffect(() => {
    if (!open) return;
    if (editMandant) {
      const kat: MandantKategorie = editMandant.kategorie ?? 'privat';
      reset({
        kategorie: kat,
        vorname: kat === 'privat' ? editMandant.vorname : '',
        nachname: kat === 'privat' ? editMandant.nachname : '',
        firmenname: kat === 'unternehmen' ? editMandant.nachname : '',
        ansprechpartner: kat === 'unternehmen' ? editMandant.vorname : '',
        email: editMandant.email,
        telefon: editMandant.telefon,
        strasse: editMandant.adresse?.strasse ?? '',
        plz: editMandant.adresse?.plz ?? '',
        ort: editMandant.adresse?.ort ?? '',
        rsv: editMandant.rsv ?? false,
        rsvGesellschaft: editMandant.rsvGesellschaft ?? '',
        rsvNummer: editMandant.rsvNummer ?? '',
      });
    } else {
      reset({ kategorie: 'privat', rsv: false });
    }
  }, [open, editMandant, reset]);

  const kategorie = watch('kategorie');
  const rsv = watch('rsv');
  const istUnternehmen = kategorie === 'unternehmen';

  const onSubmit = async (data: FormValues) => {
    const payload = {
      vorname: istUnternehmen ? (data.ansprechpartner ?? '') : (data.vorname ?? ''),
      nachname: istUnternehmen ? (data.firmenname ?? '') : (data.nachname ?? ''),
      email: data.email,
      telefon: data.telefon,
      adresse: { strasse: data.strasse, plz: data.plz, ort: data.ort },
      rsv: data.rsv,
      rsvGesellschaft: data.rsvGesellschaft,
      rsvNummer: data.rsvNummer,
      kategorie: data.kategorie as MandantKategorie,
    };
    const saved = isEdit && editMandant
      ? await mandantenApi.update(editMandant.id, payload)
      : await mandantenApi.create(payload);
    onSaved(saved);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEdit ? 'Mandant bearbeiten' : 'Neuer Mandant'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>

            {/* Kategorie-Auswahl */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="primary" mb={1}>Mandantentyp</Typography>
              <Controller
                name="kategorie"
                control={control}
                render={({ field }) => (
                  <ToggleButtonGroup
                    value={field.value}
                    exclusive
                    onChange={(_, v) => v && field.onChange(v)}
                    size="small"
                  >
                    <ToggleButton value="privat">
                      <PersonIcon fontSize="small" sx={{ mr: 0.75 }} />
                      Privatperson
                    </ToggleButton>
                    <ToggleButton value="unternehmen">
                      <BusinessIcon fontSize="small" sx={{ mr: 0.75 }} />
                      Unternehmen
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
              <Typography variant="subtitle2" color="primary" mt={2} mb={1}>
                {istUnternehmen ? 'Firmendaten' : 'Persönliche Daten'}
              </Typography>
            </Grid>

            {istUnternehmen ? (
              <>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Firmenname"
                    fullWidth
                    required
                    {...register('firmenname')}
                    error={!!errors.firmenname}
                    helperText={errors.firmenname?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Ansprechpartner (optional)"
                    fullWidth
                    {...register('ansprechpartner')}
                    helperText="Name der Kontaktperson im Unternehmen"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Vorname"
                    fullWidth
                    required
                    {...register('vorname')}
                    error={!!errors.vorname}
                    helperText={errors.vorname?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Nachname"
                    fullWidth
                    required
                    {...register('nachname')}
                    error={!!errors.nachname}
                    helperText={errors.nachname?.message}
                  />
                </Grid>
              </>
            )}

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="E-Mail"
                type="email"
                fullWidth
                required
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Telefon"
                fullWidth
                required
                {...register('telefon')}
                error={!!errors.telefon}
                helperText={errors.telefon?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
              <Typography variant="subtitle2" color="primary" mt={2} mb={1}>Adresse</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Straße & Hausnummer"
                fullWidth
                required
                {...register('strasse')}
                error={!!errors.strasse}
                helperText={errors.strasse?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="PLZ"
                fullWidth
                required
                {...register('plz')}
                error={!!errors.plz}
                helperText={errors.plz?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                label="Ort"
                fullWidth
                required
                {...register('ort')}
                error={!!errors.ort}
                helperText={errors.ort?.message}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider />
              <Typography variant="subtitle2" color="primary" mt={2} mb={1}>
                Rechtsschutzversicherung (RSV)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="rsv"
                control={control}
                render={({ field }: { field: { value: boolean; onChange: (v: boolean) => void; [k: string]: unknown } }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    }
                    label="Rechtsschutzversicherung vorhanden"
                  />
                )}
              />
            </Grid>
            {rsv && (
              <>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="RSV-Gesellschaft"
                    fullWidth
                    {...register('rsvGesellschaft')}
                    helperText="z.B. ARAG, Roland, DAS"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField label="RSV-Nummer" fullWidth {...register('rsvNummer')} />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Wird gespeichert...' : isEdit ? 'Speichern' : 'Mandant anlegen'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
