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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import { parteienApi } from '../../api/parteien';
import type { Mandant, Partei } from '../../types';
import MandantDialog from '../../components/MandantDialog/MandantDialog';

const schema = z.object({
  aktenzeichen: z.string().min(3, 'Pflichtfeld'),
  mandantId: z.string().min(1, 'Mandant wählen'),
  abrechnungsart: z.enum(['fiktiv', 'konkret']),
  anspruchsinhaber: z.enum(['mandant', 'leasing', 'bank']),
  kennzeichen: z.string().min(1, 'Pflichtfeld'),
  fahrzeugTyp: z.string().min(1, 'Pflichtfeld'),
  baujahr: z.number().min(1990).max(new Date().getFullYear()),
  erstzulassung: z.string().optional(),
  schadenshoehe: z.string().optional(),   // als String, wird in onSubmit geparst
  gutachterId: z.string().optional(),
  werkstattId: z.string().optional(),
  versicherungId: z.string().optional(),
  notizen: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onBack: () => void;
  onSaved: (id: string) => void;
}

export default function VerkehrsrechtForm({ onBack, onSaved }: Props) {
  const [mandanten, setMandanten] = useState<Mandant[]>([]);
  const [gutachter, setGutachter] = useState<Partei[]>([]);
  const [werkstaetten, setWerkstaetten] = useState<Partei[]>([]);
  const [versicherungen, setVersicherungen] = useState<Partei[]>([]);
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
      abrechnungsart: 'konkret',
      anspruchsinhaber: 'mandant',
      baujahr: new Date().getFullYear() - 2,
      gutachterId: '',
      werkstattId: '',
      versicherungId: '',
      schadenshoehe: '',
    },
  });

  useEffect(() => {
    mandantenApi.getAll().then((m) => setMandanten(Array.isArray(m) ? m : []));
    parteienApi.getAll('gutachter').then(setGutachter);
    parteienApi.getAll('werkstatt').then(setWerkstaetten);
    parteienApi.getAll('versicherung').then(setVersicherungen);
  }, []);

  const abrechnungsart = watch('abrechnungsart');
  const anspruchsinhaber = watch('anspruchsinhaber');
  const selectedMandantId = watch('mandantId');
  const selectedMandant = mandanten.find((m) => m.id === selectedMandantId);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    try {
      const fall = await faelleApi.create({
        aktenzeichen: data.aktenzeichen,
        rechtsgebiet: 'verkehrsrecht',
        status: 'aktiv',
        phase: 1,
        mandantId: data.mandantId,
        notizen: data.notizen,
        verkehrsrecht: {
          abrechnungsart: data.abrechnungsart,
          anspruchsinhaber: data.anspruchsinhaber,
          fahrzeug: {
            kennzeichen: data.kennzeichen,
            typ: data.fahrzeugTyp,
            baujahr: data.baujahr,
            erstzulassung: data.erstzulassung || undefined,
          },
          schadenshoehe: data.schadenshoehe ? parseFloat(data.schadenshoehe) : undefined,
          gutachterId: data.gutachterId || undefined,
          werkstattId: data.werkstattId || undefined,
          versicherungId: data.versicherungId || undefined,
        },
      });
      onSaved(fall.id);
    } catch {
      setError('Fehler beim Speichern. Bitte erneut versuchen.');
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" mb={3}>Verkehrsrecht — Fallanlage</Typography>

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
              helperText={errors.aktenzeichen?.message ?? 'z.B. VR/2025/010'}
              required
            />
          </Grid>

          {/* Mandant mit Neu- und Edit-Button */}
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
                        <MenuItem value="" disabled>
                          <em>Keine Mandanten vorhanden</em>
                        </MenuItem>
                      )}
                      {mandanten.map((m) => (
                        <MenuItem key={m.id} value={m.id}>
                          {m.kategorie === 'unternehmen'
                            ? m.nachname
                            : `${m.nachname}, ${m.vorname}`}
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
                <IconButton
                  onClick={() => setMandantNeuOpen(true)}
                  sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title={selectedMandant ? 'Ausgewählten Mandanten bearbeiten' : 'Zuerst Mandanten auswählen'}>
                <span>
                  <IconButton
                    onClick={() => setMandantEditOpen(true)}
                    disabled={!selectedMandant}
                    sx={{ mt: 0.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <EditOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /></Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>Fahrzeugdaten</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              label="Kennzeichen"
              fullWidth
              {...register('kennzeichen')}
              error={!!errors.kennzeichen}
              helperText={errors.kennzeichen?.message}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              label="Fahrzeugtyp"
              fullWidth
              {...register('fahrzeugTyp')}
              error={!!errors.fahrzeugTyp}
              helperText={errors.fahrzeugTyp?.message ?? 'z.B. VW Golf 8'}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Baujahr"
              type="number"
              fullWidth
              {...register('baujahr', { valueAsNumber: true })}
              error={!!errors.baujahr}
              helperText={errors.baujahr?.message}
              required
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              label="Erstzulassung"
              type="date"
              fullWidth
              {...register('erstzulassung')}
              InputLabelProps={{ shrink: true }}
              helperText="Optional"
            />
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /></Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl>
              <FormLabel required>Abrechnungsart</FormLabel>
              <Controller
                name="abrechnungsart"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field} row>
                    <FormControlLabel value="konkret" control={<Radio />} label="Konkret (Reparaturrechnung, brutto)" />
                    <FormControlLabel value="fiktiv" control={<Radio />} label="Fiktiv (Gutachtenwert netto)" />
                  </RadioGroup>
                )}
              />
            </FormControl>
            {abrechnungsart === 'fiktiv' && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Fiktiv: Kein Reparaturnachweis erforderlich — nur Gutachtenwert netto.
              </Alert>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl>
              <FormLabel required>Anspruchsinhaber</FormLabel>
              <Controller
                name="anspruchsinhaber"
                control={control}
                render={({ field }) => (
                  <RadioGroup {...field}>
                    <FormControlLabel value="mandant" control={<Radio />} label="Mandant = Eigentümer" />
                    <FormControlLabel value="leasing" control={<Radio />} label="Leasing → Schreiben an Leasinggeber" />
                    <FormControlLabel value="bank" control={<Radio />} label="Bank → Schreiben an finanzierende Bank" />
                  </RadioGroup>
                )}
              />
            </FormControl>
            {anspruchsinhaber !== 'mandant' && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Zusatzschreiben an{' '}
                {anspruchsinhaber === 'leasing' ? 'Leasinggeber' : 'finanzierende Bank'} erforderlich!
              </Alert>
            )}
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Schadenshöhe (€)"
              type="number"
              fullWidth
              {...register('schadenshoehe')}
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Optional — kann später ergänzt werden"
            />
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /></Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>
              Beteiligte Parteien (optional)
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Gutachter</InputLabel>
              <Controller
                name="gutachterId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Gutachter" value={field.value ?? ''}>
                    <MenuItem value=""><em>Keiner</em></MenuItem>
                    {gutachter.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Werkstatt</InputLabel>
              <Controller
                name="werkstattId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Werkstatt" value={field.value ?? ''}>
                    <MenuItem value=""><em>Keine</em></MenuItem>
                    {werkstaetten.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Versicherung (Gegner)</InputLabel>
              <Controller
                name="versicherungId"
                control={control}
                render={({ field }) => (
                  <Select {...field} label="Versicherung (Gegner)" value={field.value ?? ''}>
                    <MenuItem value=""><em>Keine</em></MenuItem>
                    {versicherungen.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </Select>
                )}
              />
            </FormControl>
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

      {/* Neuer Mandant */}
      <MandantDialog
        open={mandantNeuOpen}
        onClose={() => setMandantNeuOpen(false)}
        onSaved={(neu) => {
          setMandanten((prev) => [...prev, neu]);
          setValue('mandantId', neu.id, { shouldValidate: true });
          setMandantNeuOpen(false);
        }}
      />

      {/* Ausgewählten Mandanten bearbeiten */}
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
