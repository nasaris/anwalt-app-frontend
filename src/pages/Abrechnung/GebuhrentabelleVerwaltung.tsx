/**
 * GebührentabelleVerwaltung — Anlage-2-Tabellen verwalten
 *
 * Neue Rechtsstandversionen können hier hinterlegt werden.
 * Die aktive Version wird für alle Gebührenberechnungen verwendet.
 */
import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRvgTabelleStore, STANDARD_TABELLE_2025 } from '../../store/rvgTabelleStore';
import { formatEuro } from '../../utils/rvgBerechnung';
import type { RvgTabelle, RvgTabelleEintrag } from '../../types';

/** Parst eine CSV-artige Eingabe: "500;51.50\n1000;93.00\n..." */
function parseTabelle(text: string): RvgTabelleEintrag[] | null {
  const lines = text
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const result: RvgTabelleEintrag[] = [];
  for (const line of lines) {
    // Trennzeichen: Semikolon, Tab, oder mehrere Leerzeichen
    const parts = line.split(/[;\t]+|\s{2,}/).map((p) => p.trim().replace(',', '.'));
    const bis = parseFloat(parts[0] ?? '');
    const gebuehr = parseFloat(parts[1] ?? '');
    if (isNaN(bis) || isNaN(gebuehr)) return null;
    result.push({ bis, gebuehr });
  }

  if (result.length === 0) return null;
  return result.sort((a, b) => a.bis - b.bis);
}

const TEMPLATE = STANDARD_TABELLE_2025.map((e) => `${e.bis}\t${e.gebuehr.toFixed(2)}`).join('\n');

export default function GebuhrentabelleVerwaltung() {
  const { tabellen, aktiveVersion, addTabelle, deleteTabelle, setAktiv } =
    useRvgTabelleStore();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [neueVersion, setNeueVersion] = useState('');
  const [neueBezeichnung, setNeueBezeichnung] = useState('');
  const [neueGueltigAb, setNeueGueltigAb] = useState('');
  const [csvText, setCsvText] = useState(TEMPLATE);
  const [fehler, setFehler] = useState('');

  function handleHinzufuegen() {
    if (!neueVersion.trim() || !neueBezeichnung.trim() || !neueGueltigAb) {
      setFehler('Bitte alle Felder ausfüllen.');
      return;
    }
    const eintraege = parseTabelle(csvText);
    if (!eintraege) {
      setFehler('Tabelle konnte nicht geparst werden. Format: "bis\\tgebühr" pro Zeile.');
      return;
    }
    const tabelle: RvgTabelle = {
      version: neueVersion.trim(),
      bezeichnung: neueBezeichnung.trim(),
      gueltigAb: neueGueltigAb,
      eintraege,
    };
    addTabelle(tabelle);
    setAktiv(tabelle.version);
    setDialogOpen(false);
    setFehler('');
    setNeueVersion('');
    setNeueBezeichnung('');
    setNeueGueltigAb('');
    setCsvText(TEMPLATE);
  }

  const sortedTabellen = [...tabellen].sort((a, b) =>
    b.gueltigAb.localeCompare(a.gueltigAb),
  );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Anlage-2-Gebührentabellen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Neue Rechtsstand-Versionen hinterlegen — die aktive Version gilt für alle
            Gebührenberechnungen und den RVG-Rechner.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Neue Version
        </Button>
      </Stack>

      <RadioGroup
        value={aktiveVersion}
        onChange={(e) => setAktiv(e.target.value)}
      >
        {sortedTabellen.map((t) => {
          const istAktiv = t.version === aktiveVersion;
          return (
            <Accordion key={t.version} disableGutters elevation={0}
              sx={{ border: '1px solid', borderColor: istAktiv ? 'primary.main' : 'divider', mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" gap={2} flex={1} mr={1}>
                  <FormControlLabel
                    value={t.version}
                    control={<Radio size="small" />}
                    label=""
                    sx={{ m: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Box flex={1}>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {t.bezeichnung}
                      </Typography>
                      {istAktiv && (
                        <Chip
                          label="Aktiv"
                          size="small"
                          color="primary"
                          icon={<CheckCircleIcon />}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Gültig ab {new Date(t.gueltigAb).toLocaleDateString('de-DE')} ·{' '}
                      {t.eintraege.length} Stufen ·{' '}
                      bis {formatEuro(t.eintraege[t.eintraege.length - 1]?.bis ?? 0)} GW
                    </Typography>
                  </Box>
                  {t.version !== '2025-06-01' && (
                    <Tooltip title="Version löschen">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTabelle(t.version);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>Gegenstandswert bis</TableCell>
                      <TableCell align="right">1,0-Gebühr</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {t.eintraege.map((e, i) => (
                      <TableRow key={i} hover>
                        <TableCell>
                          {formatEuro(e.bis)}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            {formatEuro(e.gebuehr)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          Über {formatEuro(t.eintraege[t.eintraege.length - 1]?.bis ?? 500000)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="caption" color="text.secondary">
                          + 1.400 € je angefangene 500.000 €
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </RadioGroup>

      {/* Dialog: Neue Version */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Neue Rechtsstand-Version hinzufügen</DialogTitle>
        <DialogContent dividers>
          {fehler && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {fehler}
            </Alert>
          )}
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Version / Schlüssel"
                value={neueVersion}
                onChange={(e) => setNeueVersion(e.target.value)}
                placeholder="z. B. 2027-01-01"
                size="small"
                fullWidth
                helperText="Eindeutiger Bezeichner (ISO-Datum empfohlen)"
              />
              <TextField
                label="Anzeigebezeichnung"
                value={neueBezeichnung}
                onChange={(e) => setNeueBezeichnung(e.target.value)}
                placeholder="z. B. ab 01.01.2027"
                size="small"
                fullWidth
              />
              <TextField
                label="Gültig ab"
                type="date"
                value={neueGueltigAb}
                onChange={(e) => setNeueGueltigAb(e.target.value)}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tabelle (Anlage 2)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Format: eine Zeile pro Stufe, Trennung durch Tab oder Semikolon.
                Erste Spalte: Gegenstandswert bis (€), zweite Spalte: 1,0-Gebühr (€).
              </Typography>
              <TextField
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                multiline
                rows={15}
                fullWidth
                size="small"
                inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                placeholder="500&#9;51.50&#10;1000&#9;93.00&#10;..."
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleHinzufuegen}>
            Hinzufügen & Aktivieren
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
