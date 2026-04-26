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
  AlertTitle,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import { parteienApi } from '../../api/parteien';
import type { Mandant, Partei } from '../../types';
import { berechneKSchGFrist } from '../../utils/fristBerechnung';
import { AKTENZEICHEN_AUTO_HINT, naechstesAktenzeichen } from '../../utils/aktenzeichenVergabe';

const FALLTYPEN = [
  { value: 'kuendigung', label: 'Kündigung — 3-Wochen-Frist § 4 KSchG!' },
  { value: 'abmahnung', label: 'Abmahnung — Berechtigt? Gegendarstellung?' },
  { value: 'aufhebung', label: 'Aufhebungsvertrag — Abfindung, BA-Sperrzeitrisiko' },
  { value: 'lohn', label: 'Lohn-/Gehaltsforderung — Rückstände berechnen' },
  { value: 'mobbing', label: 'Mobbing — Sachverhalt dokumentieren' },
  { value: 'versetzung', label: 'Versetzung — Sachverhalt dokumentieren' },
];

const schema = z.object({
  aktenzeichen: z.string().min(3, 'Pflichtfeld'),
  mandantId: z.string().min(1, 'Mandant wählen'),
  falltyp: z.enum(['kuendigung', 'abmahnung', 'aufhebung', 'lohn', 'mobbing', 'versetzung']),
  rsv: z.boolean(),
  rsvGesellschaft: z.string().optional(),
  kuendigungsdatum: z.string().optional(),
  lohnrueckstand: z.number().optional(),
  gegenseiteId: z.string().optional(),
  gerichtId: z.string().optional(),
  notizen: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSaved: (id: string) => void;
}

export default function ArbeitsrechtForm({ onBack, onSaved }: Props) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [gegenseiten, setGegenseiten] = useState<Partei[]>([]);
  const [gerichte, setGerichte] = useState<Partei[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [kschgFrist, setKschgFrist] = useState<Date | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rsv: false, falltyp: 'kuendigung' },
  });

  useEffect(() => {
    mandantenApi.getAll().then(setMandanten);
    parteienApi.getAll('gegenseite').then(setGegenseiten);
    parteienApi.getAll('gericht').then(setGerichte);
  }, []);

  useEffect(() => {
    let cancelled = false;
    faelleApi
      .getAll()
      .then((faelle) => {
        if (cancelled) return;
        const az = faelle.map((f) => f.aktenzeichen);
        setValue('aktenzeichen', naechstesAktenzeichen(az, 'arbeitsrecht'));
      })
      .catch(() => {
        if (!cancelled) setValue('aktenzeichen', naechstesAktenzeichen([], 'arbeitsrecht'));
      });
    return () => {
      cancelled = true;
    };
  }, [setValue]);

  const falltyp = watch('falltyp');
  const rsv = watch('rsv');
  const kuendigungsdatum = watch('kuendigungsdatum');
  const mandantId = watch('mandantId');

  // RSV aus Mandant automatisch übernehmen
  useEffect(() => {
    if (!mandantId) return;
    const mandant = mandanten.find((m) => m.id === mandantId);
    if (mandant) {
      setValue('rsv', mandant.rsv);
      if (mandant.rsv && mandant.rsvGesellschaft) {
        setValue('rsvGesellschaft', mandant.rsvGesellschaft);
      }
    }
  }, [mandantId, mandanten, setValue]);

  useEffect(() => {
    if (falltyp === 'kuendigung' && kuendigungsdatum) {
      try {
        setKschgFrist(berechneKSchGFrist(kuendigungsdatum));
      } catch {
        setKschgFrist(null);
      }
    } else {
      setKschgFrist(null);
    }
  }, [falltyp, kuendigungsdatum]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const fristEnde = kschgFrist?.toISOString();
      const fall = await faelleApi.create({
        aktenzeichen: data.aktenzeichen,
        rechtsgebiet: 'arbeitsrecht',
        status: 'aktiv',
        phase: 1,
        mandantId: data.mandantId,
        notizen: data.notizen,
        // Wiedervorlage = KSchG-Fristende wenn Kündigung
        wiedervorlage: fristEnde,
        arbeitsrecht: {
          falltyp: data.falltyp,
          kuendigungsdatum: data.kuendigungsdatum,
          fristEnde,
          lohnrueckstand: data.lohnrueckstand,
          gegenseiteId: data.gegenseiteId || undefined,
          gerichtId: data.gerichtId || undefined,
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
        Arbeitsrecht — Fallanlage
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

          {/* Falltyp */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Falltyp
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
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

          {/* Kündigung-spezifisch */}
          {falltyp === 'kuendigung' && (
            <>
              <Grid size={{ xs: 12 }}>
                <Alert severity="error">
                  <AlertTitle>KRITISCH — 3-Wochen-Frist § 4 KSchG</AlertTitle>
                  Die Frist beginnt mit Zugang der schriftlichen Kündigung. Das System setzt
                  automatisch eine Wiedervorlage für den Fristablauf!
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Kündigungsdatum (Zugang)"
                  type="date"
                  fullWidth
                  {...register('kuendigungsdatum')}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                  helperText="Datum des Zugangs der Kündigung beim Mandanten"
                />
              </Grid>
              {kschgFrist && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Alert severity="warning">
                    <strong>KSchG-Frist läuft ab am:</strong>{' '}
                    {kschgFrist.toLocaleDateString('de-DE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Alert>
                </Grid>
              )}
            </>
          )}

          {/* Lohnforderung-spezifisch */}
          {falltyp === 'lohn' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Lohnrückstand (€)"
                type="number"
                fullWidth
                {...register('lohnrueckstand')}
                helperText="Gesamtsumme der ausstehenden Lohnzahlungen"
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Parteien */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Beteiligte Parteien (optional)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Gegenseite / Arbeitgeber</InputLabel>
              <Controller
                name="gegenseiteId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Gegenseite / Arbeitgeber" value={field.value ?? ''}>
                    <MenuItem value=""><em>Keine</em></MenuItem>
                    {gegenseiten.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Gericht</InputLabel>
              <Controller
                name="gerichtId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Gericht" value={field.value ?? ''}>
                    <MenuItem value=""><em>Kein</em></MenuItem>
                    {gerichte.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* RSV */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Rechtsschutzversicherung (RSV)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="rsv"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox {...field} checked={field.value} />}
                  label="RSV vorhanden — Deckungsanfrage stellen"
                />
              )}
            />
          </Grid>
          {rsv && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="RSV-Gesellschaft"
                fullWidth
                {...register('rsvGesellschaft')}
                helperText="z.B. ARAG, Roland, DAS"
              />
            </Grid>
          )}

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
