/**
 * AbrechnungDialog — RVG-, Vorschuss- und Honorarrechnung erstellen / bearbeiten
 *
 * Schritt 0: Rechnungstyp wählen (RVG | Vorschuss | Honorar)
 * RVG / Vorschuss:
 *   Schritt 1: Fall + Gegenstandswert
 *   Schritt 2: Gebührenpositionen
 *   Schritt 3: Vorschau
 * Honorar:
 *   Schritt 1: Fall + Datum
 *   Schritt 2: Leistungspositionen
 *   Schritt 3: Vorschau
 */
import { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, Autocomplete,
  Grid, Divider, FormControlLabel, Checkbox,
  Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip, Alert, Stepper, Step, StepLabel,
  InputAdornment, Chip, ToggleButton, ToggleButtonGroup,
  Select, MenuItem, FormControl, InputLabel, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HandshakeIcon from '@mui/icons-material/Handshake';
import type {
  Fall, Mandant, Abrechnung, AbrechnungsPosition,
  RechnungsTyp, HonorarPosition, HonorarEinheit,
} from '../../types';
import {
  getGebuehrEinfach, berechnePosition, berechneAbrechnungsSummen,
  berechneAnrechnung, erstellePosition, getStandardPositionen,
  formatEuro, VV_POSITIONEN,
} from '../../utils/rvgBerechnung';

const MWST = 0.19;

// ── Schritte je Typ ───────────────────────────────────────
const SCHRITTE_RVG      = ['Typ', 'Fall & Gegenstandswert', 'Gebührenpositionen', 'Vorschau'];
const SCHRITTE_FREITEXT = ['Typ', 'Fall & Leistungsart', 'Positionen', 'Vorschau'];

const EINHEIT_LABELS: Record<HonorarEinheit, string> = {
  stunden: 'Stunden (h)',
  stueck: 'Stück',
  pauschale: 'Pauschale',
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (abrechnung: Abrechnung) => void;
  faelle: Fall[];
  mandantenMap: Record<string, Mandant>;
  initial?: Abrechnung;
  initialFallId?: string;
  initialTyp?: RechnungsTyp;
  rechnungsNummer: string;
}

function rechtsgebietLabel(rg: string): string {
  const m: Record<string, string> = {
    verkehrsrecht: 'Verkehrsrecht', arbeitsrecht: 'Arbeitsrecht',
    zivilrecht: 'Zivilrecht', insolvenzrecht: 'Insolvenzrecht',
    wettbewerbsrecht: 'Wettbewerbsrecht', erbrecht: 'Erbrecht',
  };
  return m[rg] ?? rg;
}

function gegenstandswertAusFall(fall: Fall): number {
  if (fall.verkehrsrecht) {
    const vr = fall.verkehrsrecht;
    if (vr.abrechnungsart === 'fiktiv')
      return (vr.gutachtenwert ?? 0) + (vr.nutzungsausfall ?? 0) + (vr.mietwagen ?? 0);
    return (vr.reparaturkosten ?? 0) + (vr.nutzungsausfall ?? 0) + (vr.mietwagen ?? 0);
  }
  if (fall.arbeitsrecht) return fall.arbeitsrecht.lohnrueckstand ?? 0;
  if (fall.zivilrecht) return fall.zivilrecht.streitwert ?? fall.zivilrecht.forderungsbetrag ?? 0;
  if (fall.insolvenzrecht) return fall.insolvenzrecht.forderungsbetrag ?? 0;
  if (fall.wettbewerbsrecht) return fall.wettbewerbsrecht.streitwert ?? 0;
  if (fall.erbrecht) return fall.erbrecht.forderungsbetrag ?? 0;
  return 0;
}

function neueHonorarPosition(): HonorarPosition {
  return {
    id: crypto.randomUUID(),
    beschreibung: '',
    einheit: 'stunden',
    menge: 1,
    einzelpreis: 0,
    betrag: 0,
  };
}

export default function AbrechnungDialog({
  open, onClose, onSave, faelle, mandantenMap,
  initial, initialFallId, initialTyp, rechnungsNummer,
}: Props) {
  const [schritt, setSchritt] = useState(0);

  // Typ-Auswahl
  const [rechnungsTyp, setRechnungsTyp] = useState<RechnungsTyp>(
    initial?.rechnungsTyp ?? initialTyp ?? 'rvg',
  );

  const schritte = rechnungsTyp === 'rvg' ? SCHRITTE_RVG : SCHRITTE_FREITEXT;

  // Gemeinsame Felder
  const [selectedFallId, setSelectedFallId] = useState<string | null>(
    initial?.fallId ?? initialFallId ?? null,
  );
  const [datum, setDatum] = useState(initial?.datum ?? new Date().toISOString().slice(0, 10));
  const [notizen, setNotizen] = useState(initial?.notizen ?? '');

  // RVG / Vorschuss
  const [gegenstandswert, setGegenstandswert] = useState(
    initial ? String(initial.gegenstandswert) : '',
  );
  const [positionen, setPositionen] = useState<AbrechnungsPosition[]>(
    initial?.positionen ?? [],
  );
  const [mitAnrechnung, setMitAnrechnung] = useState(
    initial ? (initial.anrechnung ?? 0) > 0 : false,
  );
  const [neueVvNummer, setNeueVvNummer] = useState('');

  // Honorar / Vorschuss (beide freie Positionen)
  const [honorarPositionen, setHonorarPositionen] = useState<HonorarPosition[]>(() => {
    if (initial?.honorarPositionen) return initial.honorarPositionen;
    if ((initialTyp ?? initial?.rechnungsTyp) === 'vorschuss') {
      return [
        { id: crypto.randomUUID(), beschreibung: 'Vorschuss auf Verfahrensgebühr (VV 3100)', einheit: 'pauschale', menge: 1, einzelpreis: 0, betrag: 0 },
        { id: crypto.randomUUID(), beschreibung: 'Vorschuss auf Terminsgebühr (VV 3104)', einheit: 'pauschale', menge: 1, einzelpreis: 0, betrag: 0 },
      ];
    }
    return [neueHonorarPosition()];
  });
  const [honorarBetreff, setHonorarBetreff] = useState(initial?.notizen ?? '');

  const selectedFall = faelle.find((f) => f.id === selectedFallId) ?? null;
  const gwNum = parseFloat(gegenstandswert.replace(',', '.')) || 0;
  const gebuehrEinfach = getGebuehrEinfach(gwNum);

  // Gegenstandswert vorschlagen wenn Fall wechselt
  useEffect(() => {
    if (!selectedFall || initial) return;
    const v = gegenstandswertAusFall(selectedFall);
    if (v > 0) setGegenstandswert(String(v));
  }, [selectedFall?.id]);

  // Standardpositionen setzen
  useEffect(() => {
    if (gwNum <= 0 || !selectedFall || initial || rechnungsTyp === 'honorar') return;
    const defaultVv = rechnungsTyp === 'vorschuss'
      ? ['3100', '3104']   // Vorschuss: Verfahrens- + Terminsgebühr
      : getStandardPositionen(selectedFall.rechtsgebiet, selectedFall.phase);
    const neu = defaultVv.map((vv) => erstellePosition(vv, gwNum));
    setPositionen(neu);
    const hat2300 = defaultVv.includes('2300');
    const hat3100 = defaultVv.includes('3100');
    setMitAnrechnung(hat2300 && hat3100);
  }, [gwNum, selectedFall?.id, rechnungsTyp]);

  // Neu-Berechnung bei GW-Änderung
  useEffect(() => {
    if (initial || gwNum <= 0 || rechnungsTyp === 'honorar') return;
    setPositionen((prev) =>
      prev.map((p) => ({
        ...p,
        gebuehrEinfach: getGebuehrEinfach(gwNum),
        betrag: berechnePosition(p.faktor, getGebuehrEinfach(gwNum)),
      })),
    );
  }, [gwNum]);

  // ── RVG Summen ───────────────────────────────────────────
  const anrechnung = useMemo(() => {
    if (!mitAnrechnung) return 0;
    const p2300 = positionen.find((p) => p.vvNummer === '2300');
    if (!p2300) return 0;
    return berechneAnrechnung(p2300.betrag, gebuehrEinfach);
  }, [mitAnrechnung, positionen, gebuehrEinfach]);

  const rvgSummen = useMemo(
    () => berechneAbrechnungsSummen(positionen, anrechnung, MWST),
    [positionen, anrechnung],
  );

  // ── Honorar Summen ────────────────────────────────────────
  const honorarNetto = useMemo(
    () => Math.round(honorarPositionen.reduce((s, p) => s + p.betrag, 0) * 100) / 100,
    [honorarPositionen],
  );
  const honorarMwst = useMemo(
    () => Math.round(honorarNetto * MWST * 100) / 100,
    [honorarNetto],
  );
  const honorarGesamt = useMemo(
    () => Math.round((honorarNetto + honorarMwst) * 100) / 100,
    [honorarNetto, honorarMwst],
  );

  // ── Handlers RVG ─────────────────────────────────────────
  function handleFaktorChange(id: string, value: string) {
    const f = parseFloat(value.replace(',', '.'));
    if (isNaN(f) || f < 0) return;
    setPositionen((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, faktor: f, betrag: berechnePosition(f, p.gebuehrEinfach) } : p,
      ),
    );
  }

  function handlePositionLoeschen(id: string) {
    setPositionen((prev) => prev.filter((p) => p.id !== id));
  }

  function handlePositionHinzufuegen() {
    if (!neueVvNummer || gwNum <= 0) return;
    try {
      setPositionen((prev) => [...prev, erstellePosition(neueVvNummer, gwNum)]);
      setNeueVvNummer('');
    } catch { /* ignore unknown VV */ }
  }

  // ── Handlers Honorar ─────────────────────────────────────
  function handleHonorarChange(
    id: string,
    field: keyof HonorarPosition,
    value: string | number,
  ) {
    setHonorarPositionen((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        updated.betrag =
          updated.einheit === 'pauschale'
            ? updated.einzelpreis
            : Math.round(updated.menge * updated.einzelpreis * 100) / 100;
        return updated;
      }),
    );
  }

  function handleHonorarLoeschen(id: string) {
    setHonorarPositionen((prev) => prev.filter((p) => p.id !== id));
  }

  function handleHonorarHinzufuegen() {
    setHonorarPositionen((prev) => [...prev, neueHonorarPosition()]);
  }

  // ── Speichern ─────────────────────────────────────────────
  function handleSpeichern() {
    if (!selectedFall) return;
    const isRvg = rechnungsTyp === 'rvg';
    const ab: Abrechnung = {
      id: initial?.id ?? crypto.randomUUID(),
      fallId: selectedFall.id,
      rechnungsNummer: initial?.rechnungsNummer ?? rechnungsNummer,
      datum,
      rechnungsTyp,
      gegenstandswert: isRvg ? gwNum : 0,
      positionen: isRvg ? positionen : [],
      anrechnung: isRvg && anrechnung > 0 ? anrechnung : undefined,
      auslagenPauschale: isRvg ? rvgSummen.auslagenPauschale : 0,
      honorarPositionen: !isRvg ? honorarPositionen : undefined,
      zwischensumme: isRvg ? rvgSummen.zwischensumme : honorarNetto,
      mwstSatz: MWST,
      mwstBetrag: isRvg ? rvgSummen.mwstBetrag : honorarMwst,
      gesamtBetrag: isRvg ? rvgSummen.gesamtBetrag : honorarGesamt,
      status: initial?.status ?? 'entwurf',
      notizen: (isRvg ? notizen : honorarBetreff) || undefined,
      erstelltAm: initial?.erstelltAm ?? new Date().toISOString(),
    };
    onSave(ab);
    handleClose();
  }

  function handleClose() {
    setSchritt(0);
    setRechnungsTyp(initialTyp ?? 'rvg');
    setSelectedFallId(initialFallId ?? null);
    setGegenstandswert('');
    setDatum(new Date().toISOString().slice(0, 10));
    setNotizen('');
    setPositionen([]);
    setMitAnrechnung(false);
    setNeueVvNummer('');
    setHonorarPositionen(
      initialTyp === 'vorschuss'
        ? [
            { id: crypto.randomUUID(), beschreibung: 'Vorschuss auf Verfahrensgebühr (VV 3100)', einheit: 'pauschale', menge: 1, einzelpreis: 0, betrag: 0 },
            { id: crypto.randomUUID(), beschreibung: 'Vorschuss auf Terminsgebühr (VV 3104)', einheit: 'pauschale', menge: 1, einzelpreis: 0, betrag: 0 },
          ]
        : [neueHonorarPosition()],
    );
    setHonorarBetreff('');
    onClose();
  }

  const mandantName = selectedFall
    ? (() => {
        const m = mandantenMap[selectedFall.mandantId];
        return m ? `${m.vorname} ${m.nachname}` : '—';
      })()
    : '';

  const schritt1Valid = !!selectedFall && (rechnungsTyp !== 'rvg' || gwNum > 0);
  const schritt2Valid =
    rechnungsTyp === 'rvg'
      ? positionen.length > 0
      : honorarPositionen.length > 0 && honorarPositionen.every((p) => p.betrag > 0);

  // ── Render ────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initial ? 'Rechnung bearbeiten' : 'Neue Rechnung erstellen'}
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={schritt} sx={{ mb: 3 }}>
          {schritte.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        {/* ── Schritt 0: Typ ────────────────────────── */}
        {schritt === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom mb={2}>
              Welche Art von Rechnung möchten Sie erstellen?
            </Typography>
            <Grid container spacing={2}>
              {([
                {
                  typ: 'rvg' as RechnungsTyp,
                  icon: <GavelIcon sx={{ fontSize: 32 }} />,
                  label: 'RVG-Rechnung',
                  desc: 'Abrechnung nach dem Rechtsanwaltsvergütungsgesetz auf Basis des Gegenstandswerts.',
                },
                {
                  typ: 'vorschuss' as RechnungsTyp,
                  icon: <AccountBalanceIcon sx={{ fontSize: 32 }} />,
                  label: 'Vorschussrechnung',
                  desc: 'Vorschuss auf Gebühren gem. § 9 RVG — freie Positionen, kein Gegenstandswert.',
                },
                {
                  typ: 'honorar' as RechnungsTyp,
                  icon: <HandshakeIcon sx={{ fontSize: 32 }} />,
                  label: 'Honorarrechnung',
                  desc: 'Freie Vergütung (Stunden, Pauschale) — z. B. Beratung, Strafrecht, Ersttermin.',
                },
              ] as const).map(({ typ, icon, label, desc }) => (
                <Grid key={typ} size={{ xs: 12, sm: 4 }}>
                  <Box
                    onClick={() => setRechnungsTyp(typ)}
                    sx={{
                      p: 2.5,
                      border: '2px solid',
                      borderColor: rechnungsTyp === typ ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      textAlign: 'center',
                      bgcolor: rechnungsTyp === typ ? 'primary.50' : 'background.paper',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
                    }}
                  >
                    <Box color={rechnungsTyp === typ ? 'primary.main' : 'text.secondary'} mb={1}>
                      {icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {rechnungsTyp === 'vorschuss' && (
              <Alert severity="info" sx={{ mt: 2 }} icon={<InfoOutlinedIcon />}>
                <Typography variant="body2">
                  <strong>§ 9 RVG:</strong> Der Rechtsanwalt kann einen Vorschuss auf die zu
                  erwartenden Gebühren verlangen. Positionen werden frei eingetragen —
                  Vorschuss auf VV 3100 und VV 3104 sind vorausgefüllt.
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* ── Schritt 1: Fall ───────────────────────── */}
        {schritt === 1 && (
          <Box>
            <Grid container spacing={2}>
              <Grid size={12}>
                <Autocomplete
                  options={faelle}
                  value={selectedFall}
                  onChange={(_, v) => setSelectedFallId(v?.id ?? null)}
                  getOptionLabel={(f) => {
                    const m = mandantenMap[f.mandantId];
                    return `${f.aktenzeichen} — ${m ? `${m.vorname} ${m.nachname}` : '?'} (${rechtsgebietLabel(f.rechtsgebiet)})`;
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Fall" required />
                  )}
                  disabled={!!initial}
                />
              </Grid>

              {selectedFall && (
                <Grid size={12}>
                  <Alert severity="info" icon={false} sx={{ py: 0.5 }}>
                    <Typography variant="body2">
                      <strong>Az.:</strong> {selectedFall.aktenzeichen} &nbsp;·&nbsp;
                      <strong>Mandant:</strong> {mandantName} &nbsp;·&nbsp;
                      <Chip label={rechtsgebietLabel(selectedFall.rechtsgebiet)} size="small" sx={{ ml: 0.5 }} />
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {rechnungsTyp === 'rvg' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Gegenstandswert"
                    value={gegenstandswert}
                    onChange={(e) => setGegenstandswert(e.target.value)}
                    required
                    fullWidth
                    InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
                    helperText={gwNum > 0 ? `1,0-Gebühr: ${formatEuro(gebuehrEinfach)}` : ' '}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, sm: rechnungsTyp === 'rvg' ? 6 : 12 }}>
                <TextField
                  label="Rechnungsdatum"
                  type="date"
                  value={datum}
                  onChange={(e) => setDatum(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  label={rechnungsTyp === 'rvg' ? 'Interne Notizen (optional)' : 'Betreff / Leistungsbeschreibung'}
                  value={rechnungsTyp === 'rvg' ? notizen : honorarBetreff}
                  onChange={(e) =>
                    rechnungsTyp === 'rvg'
                      ? setNotizen(e.target.value)
                      : setHonorarBetreff(e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ── Schritt 2 RVG: VV-Positionen ────────── */}
        {schritt === 2 && rechnungsTyp === 'rvg' && (
          <Box>
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>VV-Nr.</TableCell>
                  <TableCell>Bezeichnung</TableCell>
                  <TableCell align="right">Faktor</TableCell>
                  <TableCell align="right">1,0-Gebühr</TableCell>
                  <TableCell align="right">Betrag</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {positionen.map((p) => {
                  const def = VV_POSITIONEN[p.vvNummer];
                  return (
                    <TableRow key={p.id}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{p.vvNummer}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2">{p.bezeichnung}</Typography>
                        {def?.hinweis && (
                          <Typography variant="caption" color="text.secondary">{def.hinweis}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ width: 100 }}>
                        <TextField
                          size="small"
                          value={p.faktor}
                          onChange={(e) => handleFaktorChange(p.id, e.target.value)}
                          inputProps={{ style: { textAlign: 'right', width: 60 } }}
                          variant="standard"
                        />
                      </TableCell>
                      <TableCell align="right"><Typography variant="body2">{formatEuro(p.gebuehrEinfach)}</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" fontWeight={600}>{formatEuro(p.betrag)}</Typography></TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handlePositionLoeschen(p.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {positionen.some((p) => p.vvNummer === '2300') &&
              positionen.some((p) => p.vvNummer === '3100') && (
              <FormControlLabel
                control={<Checkbox checked={mitAnrechnung} onChange={(e) => setMitAnrechnung(e.target.checked)} />}
                label={
                  <Box component="span" display="flex" alignItems="center" gap={0.5}>
                    Anrechnung Geschäftsgebühr auf Verfahrensgebühr (§ 15a RVG)
                    <Tooltip title="Hälftige Anrechnung der Geschäftsgebühr, maximal 0,75 × 1,0-Gebühr.">
                      <InfoOutlinedIcon fontSize="small" color="action" />
                    </Tooltip>
                  </Box>
                }
                sx={{ mb: 2 }}
              />
            )}

            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" gap={1} alignItems="flex-start">
              <Autocomplete
                options={Object.keys(VV_POSITIONEN)}
                value={neueVvNummer}
                onChange={(_, v) => setNeueVvNummer(v ?? '')}
                getOptionLabel={(vv) => `${vv} — ${VV_POSITIONEN[vv]?.bezeichnung ?? ''}`}
                renderInput={(params) => (
                  <TextField {...params} label="VV-Nr. hinzufügen" size="small" />
                )}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handlePositionHinzufuegen}
                disabled={!neueVvNummer || gwNum <= 0}
                sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
              >
                Hinzufügen
              </Button>
            </Box>
          </Box>
        )}

        {/* ── Schritt 2 Vorschuss / Honorar: freie Positionen ─ */}
        {schritt === 2 && rechnungsTyp !== 'rvg' && (
          <Box>
            {rechnungsTyp === 'vorschuss' && (
              <Alert severity="info" sx={{ mb: 2 }} icon={<InfoOutlinedIcon />}>
                <Typography variant="body2">
                  <strong>Vorschussrechnung § 9 RVG</strong> — Tragen Sie die voraussichtlichen
                  Gebühren als freie Positionen ein. Die endgültige Abrechnung erfolgt nach
                  Abschluss des Mandats.
                </Typography>
              </Alert>
            )}
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Leistungsbeschreibung</TableCell>
                  <TableCell>Einheit</TableCell>
                  <TableCell align="right">Menge</TableCell>
                  <TableCell align="right">Einzelpreis</TableCell>
                  <TableCell align="right">Betrag</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {honorarPositionen.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell sx={{ minWidth: 200 }}>
                      <TextField
                        size="small"
                        value={p.beschreibung}
                        onChange={(e) => handleHonorarChange(p.id, 'beschreibung', e.target.value)}
                        placeholder="z. B. Beratungsgespräch, Schriftsatz …"
                        variant="standard"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ width: 140 }}>
                      <FormControl size="small" variant="standard" fullWidth>
                        <Select
                          value={p.einheit}
                          onChange={(e) => handleHonorarChange(p.id, 'einheit', e.target.value)}
                        >
                          {(Object.entries(EINHEIT_LABELS) as [HonorarEinheit, string][]).map(
                            ([val, label]) => (
                              <MenuItem key={val} value={val}>{label}</MenuItem>
                            ),
                          )}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 80 }}>
                      {p.einheit !== 'pauschale' ? (
                        <TextField
                          size="small"
                          type="number"
                          value={p.menge}
                          onChange={(e) => handleHonorarChange(p.id, 'menge', parseFloat(e.target.value) || 0)}
                          inputProps={{ style: { textAlign: 'right' }, min: 0, step: 0.25 }}
                          variant="standard"
                          sx={{ width: 70 }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ width: 120 }}>
                      <TextField
                        size="small"
                        type="number"
                        value={p.einzelpreis}
                        onChange={(e) => handleHonorarChange(p.id, 'einzelpreis', parseFloat(e.target.value) || 0)}
                        inputProps={{ style: { textAlign: 'right' }, min: 0, step: 10 }}
                        variant="standard"
                        InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
                        sx={{ width: 110 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>{formatEuro(p.betrag)}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleHonorarLoeschen(p.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button startIcon={<AddIcon />} onClick={handleHonorarHinzufuegen} size="small">
              Position hinzufügen
            </Button>
          </Box>
        )}

        {/* ── Schritt 3: Vorschau ───────────────────── */}
        {schritt === 3 && (
          <Box>
            <Stack direction="row" gap={1} alignItems="center" mb={2}>
              <Typography variant="subtitle2">
                Rechnungsnummer: <strong>{initial?.rechnungsNummer ?? rechnungsNummer}</strong>
                &nbsp;·&nbsp; Datum: <strong>{new Date(datum).toLocaleDateString('de-DE')}</strong>
              </Typography>
              <Chip
                size="small"
                label={rechnungsTyp === 'rvg' ? 'RVG' : rechnungsTyp === 'vorschuss' ? 'Vorschuss' : 'Honorar'}
                color={rechnungsTyp === 'vorschuss' ? 'warning' : rechnungsTyp === 'honorar' ? 'secondary' : 'primary'}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Fall: {selectedFall?.aktenzeichen} · Mandant: {mandantName}
            </Typography>

            {rechnungsTyp === 'rvg' && (
              <Typography variant="body2" color="text.secondary" mb={2}>
                Gegenstandswert: <strong>{formatEuro(gwNum)}</strong> · 1,0-Gebühr: <strong>{formatEuro(gebuehrEinfach)}</strong>
              </Typography>
            )}

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Betrag</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rechnungsTyp === 'rvg'
                  ? <>
                      {positionen.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Typography variant="body2">{p.vvNummer} — {p.bezeichnung}</Typography>
                            <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                              ({p.faktor}× {formatEuro(p.gebuehrEinfach)})
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{formatEuro(p.betrag)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell>VV 7002 Auslagenpauschale</TableCell>
                        <TableCell align="right">{formatEuro(rvgSummen.auslagenPauschale)}</TableCell>
                      </TableRow>
                      {anrechnung > 0 && (
                        <TableRow>
                          <TableCell sx={{ color: 'error.main' }}>./. Anrechnung § 15a RVG</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>− {formatEuro(anrechnung)}</TableCell>
                        </TableRow>
                      )}
                    </>
                  : honorarPositionen.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Typography variant="body2">{p.beschreibung || '(ohne Bezeichnung)'}</Typography>
                          {p.einheit !== 'pauschale' && (
                            <Typography variant="caption" color="text.secondary">
                              {p.menge} {p.einheit === 'stunden' ? 'h' : 'Stk.'} × {formatEuro(p.einzelpreis)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{formatEuro(p.betrag)}</TableCell>
                      </TableRow>
                    ))
                }

                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Zwischensumme (netto)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatEuro(rechnungsTyp === 'rvg' ? rvgSummen.zwischensumme : honorarNetto)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>19 % Umsatzsteuer</TableCell>
                  <TableCell align="right">
                    {formatEuro(rechnungsTyp === 'rvg' ? rvgSummen.mwstBetrag : honorarMwst)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '1rem' }}>Gesamtbetrag (brutto)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem' }}>
                    {formatEuro(rechnungsTyp === 'rvg' ? rvgSummen.gesamtBetrag : honorarGesamt)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">Abbrechen</Button>
        <Box sx={{ flexGrow: 1 }} />
        {schritt > 0 && (
          <Button onClick={() => setSchritt((s) => s - 1)}>Zurück</Button>
        )}
        {schritt < schritte.length - 1 && (
          <Button
            variant="contained"
            onClick={() => setSchritt((s) => s + 1)}
            disabled={schritt === 1 ? !schritt1Valid : schritt === 2 ? !schritt2Valid : false}
          >
            Weiter
          </Button>
        )}
        {schritt === schritte.length - 1 && (
          <Button
            variant="contained"
            onClick={handleSpeichern}
            disabled={!schritt1Valid || !schritt2Valid}
          >
            {initial ? 'Speichern' : 'Rechnung erstellen'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
