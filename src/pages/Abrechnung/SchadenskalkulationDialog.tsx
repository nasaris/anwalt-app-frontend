/**
 * SchadenskalkulationDialog — Kalkulation des VR-Schadens für die Versicherung
 *
 * Erzeugt ein PDF, das dem Anschreiben an die Versicherung beigelegt wird.
 * Positionen sind frei konfigurierbar; Standardpositionen werden aus den
 * Falldaten vorausgefüllt.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, Grid,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Alert, InputAdornment, Stack, Paper,
  Divider, Chip, FormControlLabel, Checkbox,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SaveIcon from '@mui/icons-material/Save';
import type {
  Fall, Mandant, Partei, Schadenskalkulation, SchadenskalkulationPosition,
} from '../../types';
import {
  getGebuehrEinfach, berechnePosition, berechneAuslagenPauschale, formatEuro,
} from '../../utils/rvgBerechnung';
import { druckeSchadenskalkulationAlsPdf } from '../../utils/schadenskalkulationDruck';
import { useKanzleiStore } from '../../store/kanzleiStore';

const KOSTENPAUSCHALE_DEFAULT = 25;
const MWST = 0.19;

/** Berechnet VV 2300 (1,3) auf einen Streitwert — gibt die Teilbeträge zurück */
function berechneAnwaltsGebuehrDetails(streitwert: number): {
  netto: number;
  auslagen: number;
  mwst: number;
  brutto: number;
} {
  const g1 = getGebuehrEinfach(streitwert);
  const gebuehr2300 = berechnePosition(1.3, g1);
  const auslagen = berechneAuslagenPauschale(gebuehr2300);
  const netto = gebuehr2300 + auslagen;
  const mwst = Math.round(netto * MWST * 100) / 100;
  const brutto = Math.round((netto + mwst) * 100) / 100;
  return {
    netto: Math.round(gebuehr2300 * 100) / 100,
    auslagen: Math.round(auslagen * 100) / 100,
    mwst,
    brutto,
  };
}

function neuePosition(bezeichnung = '', betrag = 0): SchadenskalkulationPosition {
  return { id: crypto.randomUUID(), bezeichnung, betrag };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (k: Schadenskalkulation) => void;
  fall: Fall;
  mandant: Mandant;
  parteienMap?: Record<string, Partei>;
  initial?: Schadenskalkulation;
}

export default function SchadenskalkulationDialog({
  open, onClose, onSave, fall, mandant, parteienMap, initial,
}: Props) {
  const kanzlei = useKanzleiStore((s) => s.daten);
  const vr = fall.verkehrsrecht;

  const [datum, setDatum] = useState(initial?.datum ?? new Date().toISOString().slice(0, 10));
  const [positionen, setPositionen] = useState<SchadenskalkulationPosition[]>([]);
  const [notizen, setNotizen] = useState(initial?.notizen ?? '');
  const [erledigungDatum, setErledigungDatum] = useState(
    initial?.erledigungDatum ?? '',
  );
  const [mitVorbehalt, setMitVorbehalt] = useState(
    initial?.mitVorbehalt !== false, // default true
  );

  // Versicherung aus Parteien
  const versicherung = useMemo(() => {
    if (!parteienMap || !vr?.versicherungId) return undefined;
    return parteienMap[vr.versicherungId];
  }, [parteienMap, vr]);

  // Beim ersten Öffnen: Positionen aus Falldaten vorausfüllen
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setPositionen(initial.positionen);
      setDatum(initial.datum);
      setNotizen(initial.notizen ?? '');
      setErledigungDatum(initial.erledigungDatum ?? '');
      setMitVorbehalt(initial.mitVorbehalt !== false);
      return;
    }
    if (!vr) return;

    const pList: SchadenskalkulationPosition[] = [];

    // Fahrzeugschaden
    if (vr.abrechnungsart === 'fiktiv' && (vr.gutachtenwert ?? 0) > 0) {
      pList.push(neuePosition(
        `Fiktive Nettoreparaturkosten lt. Gutachten`,
        vr.gutachtenwert ?? 0,
      ));
    } else if (vr.abrechnungsart === 'konkret' && (vr.reparaturkosten ?? 0) > 0) {
      pList.push(neuePosition(
        `Reparaturkosten lt. Rechnung (brutto)`,
        vr.reparaturkosten ?? 0,
      ));
    }

    // Wertminderung (leer — muss manuell eingetragen werden)
    pList.push(neuePosition('Merkantile Wertminderung', 0));

    // Nutzungsausfall
    if ((vr.nutzungsausfall ?? 0) > 0) {
      pList.push(neuePosition('Nutzungsausfall', vr.nutzungsausfall ?? 0));
    } else {
      pList.push(neuePosition('Nutzungsausfall (Tage × Tagessatz)', 0));
    }

    // Mietwagen
    if ((vr.mietwagen ?? 0) > 0) {
      pList.push(neuePosition('Mietwagenkosten', vr.mietwagen ?? 0));
    }

    // Sachverständigenkosten
    pList.push(neuePosition('Sachverständigenkosten', 0));

    // Abschleppkosten
    pList.push(neuePosition('Abschleppkosten', 0));

    // Kostenpauschale
    pList.push(neuePosition('Kostenpauschale (Auslagen)', KOSTENPAUSCHALE_DEFAULT));

    setPositionen(pList);
  }, [open, fall.id]);

  // Summenberechnung
  const schadensumme = useMemo(
    () => Math.round(positionen.reduce((s, p) => s + (p.betrag || 0), 0) * 100) / 100,
    [positionen],
  );

  const gebuehrDetails = useMemo(
    () => berechneAnwaltsGebuehrDetails(schadensumme),
    [schadensumme],
  );

  const gesamtforderung = useMemo(
    () => Math.round((schadensumme + gebuehrDetails.brutto) * 100) / 100,
    [schadensumme, gebuehrDetails],
  );

  function handlePositionChange(id: string, field: 'bezeichnung' | 'betrag', value: string | number) {
    setPositionen((prev) =>
      prev.map((p) => p.id === id ? { ...p, [field]: value } : p),
    );
  }

  function handleLoeschen(id: string) {
    setPositionen((prev) => prev.filter((p) => p.id !== id));
  }

  function handleHinzufuegen() {
    setPositionen((prev) => [...prev, neuePosition()]);
  }

  function buildKalkulation(): Schadenskalkulation {
    return {
      id: initial?.id ?? crypto.randomUUID(),
      fallId: fall.id,
      erstelltAm: initial?.erstelltAm ?? new Date().toISOString(),
      datum,
      positionen,
      schadensumme,
      anwaltsGebuehrNetto: gebuehrDetails.netto,
      auslagenPauschale: gebuehrDetails.auslagen,
      anwaltsGebuehrMwst: gebuehrDetails.mwst,
      anwaltsgebuehr: gebuehrDetails.brutto,
      gesamtforderung,
      erledigungDatum: erledigungDatum || undefined,
      mitVorbehalt,
      notizen: notizen || undefined,
    };
  }

  function handleSpeichern() {
    onSave(buildKalkulation());
    onClose();
  }

  function handlePdf() {
    druckeSchadenskalkulationAlsPdf(buildKalkulation(), fall, mandant, kanzlei, versicherung);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" gap={1}>
          Schadenskalkulation
          <Chip
            label={vr?.abrechnungsart === 'fiktiv' ? 'Fiktive Abrechnung' : 'Konkrete Abrechnung'}
            size="small"
            color={vr?.abrechnungsart === 'fiktiv' ? 'info' : 'success'}
          />
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2} mb={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
              <Typography variant="body2">
                <strong>Fall:</strong> {fall.aktenzeichen} &nbsp;·&nbsp;
                <strong>Mandant:</strong> {mandant.vorname} {mandant.nachname}
              </Typography>
              {versicherung && (
                <Typography variant="body2">
                  <strong>Versicherung:</strong> {versicherung.name}
                  {versicherung.schadensnummer && ` (SchadenNr.: ${versicherung.schadensnummer})`}
                </Typography>
              )}
            </Alert>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Datum der Kalkulation"
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        {/* Positionen */}
        <Table size="small" sx={{ mb: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Schadenposition</TableCell>
              <TableCell align="right" sx={{ width: 140 }}>Betrag</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {positionen.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <TextField
                    size="small"
                    value={p.bezeichnung}
                    onChange={(e) => handlePositionChange(p.id, 'bezeichnung', e.target.value)}
                    variant="standard"
                    fullWidth
                    placeholder="Bezeichnung"
                  />
                </TableCell>
                <TableCell align="right">
                  <TextField
                    size="small"
                    type="number"
                    value={p.betrag === 0 ? '' : p.betrag}
                    onChange={(e) =>
                      handlePositionChange(p.id, 'betrag', parseFloat(e.target.value) || 0)
                    }
                    variant="standard"
                    inputProps={{ style: { textAlign: 'right' }, min: 0, step: 10 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
                    sx={{ width: 120 }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleLoeschen(p.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Button startIcon={<AddIcon />} size="small" onClick={handleHinzufuegen} sx={{ mb: 2 }}>
          Position hinzufügen
        </Button>

        <Divider sx={{ mb: 2 }} />

        {/* Summen-Vorschau */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={700}>Beziffert werden daher</Typography>
              <Typography variant="body2" fontWeight={700}>{formatEuro(schadensumme)}</Typography>
            </Stack>

            <Divider />

            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Anwaltskosten (Gegenstandswert: {formatEuro(schadensumme)})
            </Typography>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Geschäftsgebühr gem. Nr. 2300 VV RVG (1,3)</Typography>
              <Typography variant="body2">{formatEuro(gebuehrDetails.netto)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Auslagenpauschale gem. Nr. 7002 VV RVG</Typography>
              <Typography variant="body2">{formatEuro(gebuehrDetails.auslagen)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">Summe netto</Typography>
              <Typography variant="body2">{formatEuro(gebuehrDetails.netto + gebuehrDetails.auslagen)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2">19 % USt.</Typography>
              <Typography variant="body2">{formatEuro(gebuehrDetails.mwst)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" fontWeight={600}>Gesamtsumme Anwaltskosten brutto</Typography>
              <Typography variant="body2" fontWeight={600}>{formatEuro(gebuehrDetails.brutto)}</Typography>
            </Stack>

            <Divider />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="subtitle2" fontWeight={800}>Gesamtforderung</Typography>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                {formatEuro(gesamtforderung)}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        {/* Optionen */}
        <Stack spacing={2} mt={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Frist / Erledigung vorgemerkt am (optional)"
                type="date"
                value={erledigungDatum}
                onChange={(e) => setErledigungDatum(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
                helperText="Erscheint als Fristhinweis im PDF"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }} display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mitVorbehalt}
                    onChange={(e) => setMitVorbehalt(e.target.checked)}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    Vorbehalt weiterer Schadenspositionen
                  </Typography>
                }
              />
            </Grid>
          </Grid>

          <TextField
            label="Notizen / Besonderheiten (optional)"
            value={notizen}
            onChange={(e) => setNotizen(e.target.value)}
            fullWidth
            multiline
            rows={2}
            size="small"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">Abbrechen</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={handlePdf}
          disabled={schadensumme <= 0}
        >
          PDF erzeugen
        </Button>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSpeichern}
          disabled={schadensumme <= 0}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
