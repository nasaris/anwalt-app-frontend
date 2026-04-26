/**
 * RVG-Rechner — interaktiver Gebührenrechner
 *
 * Optionen:
 *  - Streitwert / Gegenstandswert
 *  - Rechtsstand (Anlage-2-Version)
 *  - MwSt.-Satz (19 % / 0 %)
 *  - Außergerichtliche Vertretung (VV 2300)
 *  - Gerichtliche Vertretung 1. Instanz (VV 3100 + 3104)
 *    └─ 2. Instanz / Berufung (VV 3200 + 3202)
 *       └─ 3. Instanz / Revision (VV 3206 + 3210)
 *  - Einigungsgebühr (VV 1000 / 1003 / 1004)
 *  - Anzahl Mandanten (VV 1008 Mehrvertretungszuschlag)
 *  - Anzahl Gegner (informatorisch)
 *  - Anrechnung § 15a RVG
 */
import { useMemo, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useRvgTabelleStore } from '../../store/rvgTabelleStore';
import {
  getGebuehrEinfach,
  berechnePosition,
  berechneAuslagenPauschale,
  berechneFaktorMitMehrvertretung,
  berechneAnrechnung,
  formatEuro,
  VV_POSITIONEN,
} from '../../utils/rvgBerechnung';

interface RechnerPosition {
  vvNummer: string;
  bezeichnung: string;
  faktor: number;
  gebuehrEinfach: number;
  betrag: number;
  info?: string;
}

export default function RvgRechner() {
  const { tabellen, aktiveVersion, setAktiv } = useRvgTabelleStore();

  // ── Eingaben ─────────────────────────────────────────────
  const [streitwertStr, setStreitwertStr] = useState('');
  const [mwstSatz, setMwstSatz] = useState<0 | 0.19>(0.19);
  const [anzahlMandanten, setAnzahlMandanten] = useState(1);
  const [anzahlGegner, setAnzahlGegner] = useState(1);

  // Tätigkeitsbereiche
  const [ausserg, setAusserg] = useState(true);
  const [aussergFaktorStr, setAussergFaktorStr] = useState('1.3');
  const [gericht1, setGericht1] = useState(false);
  const [instanz2, setInstanz2] = useState(false);
  const [instanz3, setInstanz3] = useState(false);
  const [mitTermin1, setMitTermin1] = useState(true);
  const [mitTermin2, setMitTermin2] = useState(true);
  const [mitTermin3, setMitTermin3] = useState(true);

  // Einigungsgebühr
  const [einigung, setEinigung] = useState(false);
  const [einigungTyp, setEinigungTyp] = useState<'1000' | '1003' | '1004'>('1000');

  // Anrechnung § 15a
  const [mitAnrechnung, setMitAnrechnung] = useState(false);

  // ── Berechnungen ─────────────────────────────────────────
  const tabelle = useMemo(
    () => tabellen.find((t) => t.version === aktiveVersion) ?? tabellen[0],
    [tabellen, aktiveVersion],
  );

  const streitwert = useMemo(() => {
    const v = parseFloat(streitwertStr.replace(/\./g, '').replace(',', '.'));
    return isNaN(v) ? 0 : v;
  }, [streitwertStr]);

  const gebuehrEinfach = useMemo(
    () => getGebuehrEinfach(streitwert, tabelle?.eintraege),
    [streitwert, tabelle],
  );

  const aussergFaktor = useMemo(() => {
    const v = parseFloat(aussergFaktorStr.replace(',', '.'));
    return isNaN(v) ? 1.3 : Math.min(Math.max(v, 0.5), 2.5);
  }, [aussergFaktorStr]);

  const positionen = useMemo<RechnerPosition[]>(() => {
    if (streitwert <= 0 || !tabelle) return [];
    const ge = gebuehrEinfach;
    const list: RechnerPosition[] = [];

    // Außergerichtlich (VV 2300)
    if (ausserg) {
      const faktor = berechneFaktorMitMehrvertretung(aussergFaktor, anzahlMandanten);
      const def = VV_POSITIONEN['2300']!;
      list.push({
        vvNummer: '2300',
        bezeichnung: def.bezeichnung,
        faktor,
        gebuehrEinfach: ge,
        betrag: berechnePosition(faktor, ge),
        info:
          anzahlMandanten > 1
            ? `inkl. VV 1008 Mehrvertretung (${anzahlMandanten} Mandanten)`
            : undefined,
      });
    }

    // 1. Instanz (VV 3100 + optional 3104)
    if (gericht1) {
      const faktor3100 = berechneFaktorMitMehrvertretung(1.3, anzahlMandanten);
      list.push({
        vvNummer: '3100',
        bezeichnung: VV_POSITIONEN['3100']!.bezeichnung,
        faktor: faktor3100,
        gebuehrEinfach: ge,
        betrag: berechnePosition(faktor3100, ge),
        info:
          anzahlMandanten > 1
            ? `inkl. VV 1008 Mehrvertretung (${anzahlMandanten} Mandanten)`
            : undefined,
      });
      if (mitTermin1) {
        list.push({
          vvNummer: '3104',
          bezeichnung: VV_POSITIONEN['3104']!.bezeichnung,
          faktor: 1.2,
          gebuehrEinfach: ge,
          betrag: berechnePosition(1.2, ge),
        });
      }
    }

    // 2. Instanz (VV 3200 + optional 3202)
    if (instanz2) {
      const faktor3200 = berechneFaktorMitMehrvertretung(1.6, anzahlMandanten);
      list.push({
        vvNummer: '3200',
        bezeichnung: VV_POSITIONEN['3200']!.bezeichnung,
        faktor: faktor3200,
        gebuehrEinfach: ge,
        betrag: berechnePosition(faktor3200, ge),
        info:
          anzahlMandanten > 1
            ? `inkl. VV 1008 Mehrvertretung (${anzahlMandanten} Mandanten)`
            : undefined,
      });
      if (mitTermin2) {
        list.push({
          vvNummer: '3202',
          bezeichnung: VV_POSITIONEN['3202']!.bezeichnung,
          faktor: 1.2,
          gebuehrEinfach: ge,
          betrag: berechnePosition(1.2, ge),
        });
      }
    }

    // 3. Instanz (VV 3206 + optional 3210)
    if (instanz3) {
      const faktor3206 = berechneFaktorMitMehrvertretung(1.6, anzahlMandanten);
      list.push({
        vvNummer: '3206',
        bezeichnung: VV_POSITIONEN['3206']!.bezeichnung,
        faktor: faktor3206,
        gebuehrEinfach: ge,
        betrag: berechnePosition(faktor3206, ge),
        info:
          anzahlMandanten > 1
            ? `inkl. VV 1008 Mehrvertretung (${anzahlMandanten} Mandanten)`
            : undefined,
      });
      if (mitTermin3) {
        list.push({
          vvNummer: '3210',
          bezeichnung: VV_POSITIONEN['3210']!.bezeichnung,
          faktor: 1.5,
          gebuehrEinfach: ge,
          betrag: berechnePosition(1.5, ge),
        });
      }
    }

    // Einigungsgebühr
    if (einigung) {
      const def = VV_POSITIONEN[einigungTyp]!;
      list.push({
        vvNummer: einigungTyp,
        bezeichnung: def.bezeichnung,
        faktor: def.standardFaktor,
        gebuehrEinfach: ge,
        betrag: berechnePosition(def.standardFaktor, ge),
      });
    }

    return list;
  }, [
    streitwert, tabelle, gebuehrEinfach, anzahlMandanten,
    ausserg, aussergFaktor, gericht1, mitTermin1,
    instanz2, mitTermin2, instanz3, mitTermin3,
    einigung, einigungTyp,
  ]);

  const anrechnungBetrag = useMemo(() => {
    if (!mitAnrechnung) return 0;
    const pos2300 = positionen.find((p) => p.vvNummer === '2300');
    if (!pos2300) return 0;
    return berechneAnrechnung(pos2300.betrag, gebuehrEinfach);
  }, [mitAnrechnung, positionen, gebuehrEinfach]);

  const gebuehrenSumme = useMemo(
    () => positionen.reduce((s, p) => s + p.betrag, 0),
    [positionen],
  );

  const auslagenPauschale = useMemo(
    () => berechneAuslagenPauschale(gebuehrenSumme),
    [gebuehrenSumme],
  );

  const zwischensumme = useMemo(
    () => Math.round((gebuehrenSumme + auslagenPauschale - anrechnungBetrag) * 100) / 100,
    [gebuehrenSumme, auslagenPauschale, anrechnungBetrag],
  );

  const mwstBetrag = useMemo(
    () => Math.round(zwischensumme * mwstSatz * 100) / 100,
    [zwischensumme, mwstSatz],
  );

  const gesamtBetrag = useMemo(
    () => Math.round((zwischensumme + mwstBetrag) * 100) / 100,
    [zwischensumme, mwstBetrag],
  );

  const hatAussergUndGericht =
    ausserg && gericht1 && positionen.some((p) => p.vvNummer === '2300');

  return (
    <Box>
      <Grid container spacing={3}>
        {/* ── Linke Spalte: Eingaben ─────────────────── */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>
              Berechnungsgrundlage
            </Typography>

            {/* Streitwert */}
            <TextField
              label="Streitwert / Gegenstandswert"
              value={streitwertStr}
              onChange={(e) => setStreitwertStr(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: <InputAdornment position="end">€</InputAdornment>,
              }}
              helperText={
                streitwert > 0
                  ? `1,0-Gebühr: ${formatEuro(gebuehrEinfach)}`
                  : ' '
              }
            />

            {/* Rechtsstand */}
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Rechtsstand</InputLabel>
              <Select
                value={aktiveVersion}
                label="Rechtsstand"
                onChange={(e) => setAktiv(e.target.value)}
              >
                {[...tabellen]
                  .sort((a, b) => b.gueltigAb.localeCompare(a.gueltigAb))
                  .map((t) => (
                    <MenuItem key={t.version} value={t.version}>
                      {t.bezeichnung}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {/* MwSt */}
            <FormControl fullWidth size="small" sx={{ mb: 2.5 }}>
              <InputLabel>MwSt.-Satz</InputLabel>
              <Select
                value={mwstSatz}
                label="MwSt.-Satz"
                onChange={(e) => setMwstSatz(e.target.value as 0 | 0.19)}
              >
                <MenuItem value={0.19}>19 %</MenuItem>
                <MenuItem value={0}>0 % (steuerbefreit)</MenuItem>
              </Select>
            </FormControl>

            <Divider sx={{ mb: 2 }} />

            {/* Tätigkeitsbereiche */}
            <Typography variant="subtitle2" mb={1}>
              Tätigkeitsbereiche
            </Typography>

            {/* Außergerichtlich */}
            <Box sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={ausserg}
                    onChange={(e) => setAusserg(e.target.checked)}
                  />
                }
                label="Außergerichtliche Vertretung"
              />
              {ausserg && (
                <Box sx={{ ml: 4, mt: 0.5 }}>
                  <TextField
                    label="Faktor VV 2300"
                    value={aussergFaktorStr}
                    onChange={(e) => setAussergFaktorStr(e.target.value)}
                    size="small"
                    sx={{ width: 130 }}
                    helperText="0,5 – 2,5"
                  />
                </Box>
              )}
            </Box>

            {/* Gerichtlich 1. Instanz */}
            <Box sx={{ mb: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={gericht1}
                    onChange={(e) => {
                      setGericht1(e.target.checked);
                      if (!e.target.checked) {
                        setInstanz2(false);
                        setInstanz3(false);
                      }
                    }}
                  />
                }
                label="Gerichtliche Vertretung"
              />
              {gericht1 && (
                <Box sx={{ ml: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={mitTermin1}
                        onChange={(e) => setMitTermin1(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">Terminsgebühr (VV 3104)</Typography>}
                  />
                </Box>
              )}

              {/* 2. Instanz */}
              {gericht1 && (
                <Box sx={{ ml: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={instanz2}
                        onChange={(e) => {
                          setInstanz2(e.target.checked);
                          if (!e.target.checked) setInstanz3(false);
                        }}
                      />
                    }
                    label={<Typography variant="body2">2. Instanz (Berufung)</Typography>}
                  />
                  {instanz2 && (
                    <Box sx={{ ml: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={mitTermin2}
                            onChange={(e) => setMitTermin2(e.target.checked)}
                          />
                        }
                        label={<Typography variant="body2">Terminsgebühr (VV 3202)</Typography>}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* 3. Instanz */}
              {instanz2 && (
                <Box sx={{ ml: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={instanz3}
                        onChange={(e) => setInstanz3(e.target.checked)}
                      />
                    }
                    label={<Typography variant="body2">3. Instanz (Revision)</Typography>}
                  />
                  {instanz3 && (
                    <Box sx={{ ml: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={mitTermin3}
                            onChange={(e) => setMitTermin3(e.target.checked)}
                          />
                        }
                        label={<Typography variant="body2">Terminsgebühr (VV 3210)</Typography>}
                      />
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            {/* Einigungsgebühr */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={einigung}
                    onChange={(e) => setEinigung(e.target.checked)}
                  />
                }
                label="Einigungsgebühr"
              />
              {einigung && (
                <Box sx={{ ml: 4 }}>
                  <FormControl size="small" sx={{ width: 280 }}>
                    <InputLabel>Typ</InputLabel>
                    <Select
                      value={einigungTyp}
                      label="Typ"
                      onChange={(e) =>
                        setEinigungTyp(e.target.value as '1000' | '1003' | '1004')
                      }
                    >
                      <MenuItem value="1000">VV 1000 — Außergerichtlich (1,5)</MenuItem>
                      <MenuItem value="1003">VV 1003 — 1. Instanz (1,0)</MenuItem>
                      <MenuItem value="1004">VV 1004 — Berufung/Revision (1,3)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Parteien */}
            <Typography variant="subtitle2" mb={1}>
              Parteien
            </Typography>
            <Stack direction="row" spacing={2} mb={2}>
              <TextField
                label="Anzahl Mandanten"
                type="number"
                value={anzahlMandanten}
                onChange={(e) =>
                  setAnzahlMandanten(Math.max(1, parseInt(e.target.value) || 1))
                }
                size="small"
                sx={{ width: 160 }}
                inputProps={{ min: 1, max: 20 }}
                helperText="VV 1008 ab 2"
              />
              <TextField
                label="Anzahl Gegner"
                type="number"
                value={anzahlGegner}
                onChange={(e) =>
                  setAnzahlGegner(Math.max(1, parseInt(e.target.value) || 1))
                }
                size="small"
                sx={{ width: 160 }}
                inputProps={{ min: 1, max: 20 }}
                helperText="informatorisch"
              />
            </Stack>

            {/* Anrechnung § 15a */}
            {hatAussergUndGericht && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={mitAnrechnung}
                    onChange={(e) => setMitAnrechnung(e.target.checked)}
                  />
                }
                label={
                  <Box component="span" display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="body2">Anrechnung § 15a RVG</Typography>
                    <Tooltip title="Hälftige Anrechnung der Geschäftsgebühr (VV 2300) auf die Verfahrensgebühr (VV 3100), maximal 0,75 × 1,0-Gebühr.">
                      <InfoOutlinedIcon fontSize="small" color="action" sx={{ cursor: 'help' }} />
                    </Tooltip>
                  </Box>
                }
              />
            )}
          </Paper>
        </Grid>

        {/* ── Rechte Spalte: Ergebnis ───────────────── */}
        <Grid size={{ xs: 12, md: 7 }}>
          {streitwert <= 0 ? (
            <Box
              sx={{
                height: '100%',
                minHeight: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography color="text.disabled">
                Bitte Streitwert eingeben, um die Gebühren zu berechnen.
              </Typography>
            </Box>
          ) : (
            <Paper sx={{ p: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Gebührenübersicht
                </Typography>
                <Stack direction="row" gap={1}>
                  <Chip
                    label={tabelle?.bezeichnung ?? '—'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    label={`1,0-Gebühr: ${formatEuro(gebuehrEinfach)}`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Stack>

              {positionen.length === 0 ? (
                <Alert severity="info">
                  Bitte mindestens einen Tätigkeitsbereich auswählen.
                </Alert>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>VV-Nr.</TableCell>
                        <TableCell>Bezeichnung</TableCell>
                        <TableCell align="right">Faktor</TableCell>
                        <TableCell align="right">1,0-Gebühr</TableCell>
                        <TableCell align="right">Betrag</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {positionen.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {p.vvNummer}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{p.bezeichnung}</Typography>
                            {p.info && (
                              <Typography variant="caption" color="primary.main">
                                {p.info}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {p.faktor.toFixed(1).replace('.', ',')}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatEuro(p.gebuehrEinfach)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={600}>
                              {formatEuro(p.betrag)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}

                      {/* Auslagenpauschale */}
                      <TableRow sx={{ '& td': { borderTop: '1px solid', borderColor: 'divider' } }}>
                        <TableCell>7002</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            Pauschale Post/Telekommunikation
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            20 % der Gebühren, max. 20,00 €
                          </Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatEuro(auslagenPauschale)}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {/* Anrechnung */}
                      {anrechnungBetrag > 0 && (
                        <TableRow>
                          <TableCell />
                          <TableCell>
                            <Typography variant="body2" color="error.main">
                              ./. Anrechnung Geschäftsgebühr (§ 15a RVG)
                            </Typography>
                          </TableCell>
                          <TableCell />
                          <TableCell />
                          <TableCell align="right">
                            <Typography variant="body2" color="error.main" fontWeight={600}>
                              − {formatEuro(anrechnungBetrag)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Zwischensumme */}
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" fontWeight={700}>
                            Zwischensumme (netto)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>
                            {formatEuro(zwischensumme)}
                          </Typography>
                        </TableCell>
                      </TableRow>

                      {/* MwSt */}
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2">
                            {mwstSatz === 0.19 ? '19 %' : '0 %'} Umsatzsteuer
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{formatEuro(mwstBetrag)}</Typography>
                        </TableCell>
                      </TableRow>

                      {/* Gesamtbetrag */}
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body1" fontWeight={800}>
                            Gesamtbetrag (brutto)
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight={800} color="primary.main">
                            {formatEuro(gesamtBetrag)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  {/* Mehrvertretungshinweis */}
                  {anzahlMandanten > 1 && (
                    <Alert severity="info" sx={{ mt: 2 }} icon={<InfoOutlinedIcon />}>
                      <Typography variant="body2">
                        <strong>VV 1008 Mehrvertretung:</strong> Für{' '}
                        {anzahlMandanten} Mandanten wurde der Faktor um{' '}
                        {((anzahlMandanten - 1) * 0.3).toFixed(1)} erhöht
                        (max. 2,0).
                      </Typography>
                    </Alert>
                  )}

                  {/* Gegner-Hinweis */}
                  {anzahlGegner > 1 && (
                    <Alert severity="warning" sx={{ mt: 1 }} icon={<InfoOutlinedIcon />}>
                      <Typography variant="body2">
                        <strong>Hinweis:</strong> Die Anzahl der Gegner ({anzahlGegner})
                        beeinflusst nicht automatisch die Gebührenhöhe, kann aber einen
                        höheren Faktor bei VV 2300 rechtfertigen.
                      </Typography>
                    </Alert>
                  )}
                </>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
