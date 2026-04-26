import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material';
import type {
  Abrechnungsart,
  Anspruchsinhaber,
  ARFalltyp,
  ERFalltyp,
  Fall,
  IRFalltyp,
  WBFalltyp,
  ZRFalltyp,
} from '../../../types';
import { STATUS_OPTIONEN } from '../hooks/useEditFallForm';

interface Props {
  open: boolean;
  fall: Fall;
  neuerStatus: string;
  onNeuerStatusChange: (v: string) => void;
  // VR
  vrAbrechnungsart: Abrechnungsart;
  onVrAbrechnungsartChange: (v: Abrechnungsart) => void;
  vrAnspruchsinhaber: Anspruchsinhaber;
  onVrAnspruchsinhaberChange: (v: Anspruchsinhaber) => void;
  vrKennzeichen: string;
  onVrKennzeichenChange: (v: string) => void;
  vrFahrzeugTyp: string;
  onVrFahrzeugTypChange: (v: string) => void;
  vrBaujahr: number;
  onVrBaujahrChange: (v: number) => void;
  vrErstzulassung: string;
  onVrErstzulassungChange: (v: string) => void;
  vrSchadenshoehe: string;
  onVrSchadenhoheChange: (v: string) => void;
  vrGutachtenwert: string;
  onVrGutachtenwertChange: (v: string) => void;
  vrReparaturkosten: string;
  onVrReparaturkostenChange: (v: string) => void;
  vrNutzungsausfall: string;
  onVrNutzungsausfallChange: (v: string) => void;
  vrMietwagen: string;
  onVrMietwagenChange: (v: string) => void;
  vrPolizeiAufnahme: 'ja' | 'nein';
  onVrPolizeiAufnahmeChange: (v: 'ja' | 'nein') => void;
  vrPolizeiAz: string;
  onVrPolizeiAzChange: (v: string) => void;
  vrStaFall: 'ja' | 'nein';
  onVrStaFallChange: (v: 'ja' | 'nein') => void;
  vrJustizAz: string;
  onVrJustizAzChange: (v: string) => void;
  // AR
  arFalltyp: ARFalltyp;
  onArFalltypChange: (v: ARFalltyp) => void;
  arKuendigungsdatum: string;
  onArKuendigungsdatumChange: (v: string) => void;
  arFristEnde: string;
  onArFristEndeChange: (v: string) => void;
  arLohnrueckstand: string;
  onArLohnrueckstandChange: (v: string) => void;
  // ZR
  zrFalltyp: ZRFalltyp;
  onZrFalltypChange: (v: ZRFalltyp) => void;
  zrGegenseite: string;
  onZrGegenseiteChange: (v: string) => void;
  zrForderungsbetrag: string;
  onZrForderungsbetragChange: (v: string) => void;
  zrStreitwert: string;
  onZrStreitwertChange: (v: string) => void;
  zrMahnfristEnde: string;
  onZrMahnfristEndeChange: (v: string) => void;
  zrKlageEingereichtAm: string;
  onZrKlageEingereichtAmChange: (v: string) => void;
  // IR
  irFalltyp: IRFalltyp;
  onIrFalltypChange: (v: IRFalltyp) => void;
  irSchuldner: string;
  onIrSchuldnerChange: (v: string) => void;
  irForderungsbetrag: string;
  onIrForderungsbetragChange: (v: string) => void;
  irInsolvenzgericht: string;
  onIrInsolvenzgerichtChange: (v: string) => void;
  irInsolvenzAktenzeichen: string;
  onIrInsolvenzAktenzeichenChange: (v: string) => void;
  irAntragsdatum: string;
  onIrAntragsdatumChange: (v: string) => void;
  irEroeffnungsdatum: string;
  onIrEroeffnungsdatumChange: (v: string) => void;
  // WB
  wbFalltyp: WBFalltyp;
  onWbFalltypChange: (v: WBFalltyp) => void;
  wbGegenseite: string;
  onWbGegenseiteChange: (v: string) => void;
  wbVerletzungshandlung: string;
  onWbVerletzungshandlungChange: (v: string) => void;
  wbAbmahnungsdatum: string;
  onWbAbmahnungsdatumChange: (v: string) => void;
  wbFristsetzung: string;
  onWbFristsetzungChange: (v: string) => void;
  wbStreitwert: string;
  onWbStreitwertChange: (v: string) => void;
  // ER
  erFalltyp: ERFalltyp;
  onErFalltypChange: (v: ERFalltyp) => void;
  erErblasser: string;
  onErErblasserChange: (v: string) => void;
  erTodesdatum: string;
  onErTodesdatumChange: (v: string) => void;
  erNachlassgericht: string;
  onErNachlassgerichtChange: (v: string) => void;
  erNachlassAktenzeichen: string;
  onErNachlassAktenzeichenChange: (v: string) => void;
  erForderungsbetrag: string;
  onErForderungsbetragChange: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function EditFallDialog({
  open, fall, neuerStatus, onNeuerStatusChange, onClose, onSave,
  vrAbrechnungsart, onVrAbrechnungsartChange,
  vrAnspruchsinhaber, onVrAnspruchsinhaberChange,
  vrKennzeichen, onVrKennzeichenChange,
  vrFahrzeugTyp, onVrFahrzeugTypChange,
  vrBaujahr, onVrBaujahrChange,
  vrErstzulassung, onVrErstzulassungChange,
  vrSchadenshoehe, onVrSchadenhoheChange,
  vrGutachtenwert, onVrGutachtenwertChange,
  vrReparaturkosten, onVrReparaturkostenChange,
  vrNutzungsausfall, onVrNutzungsausfallChange,
  vrMietwagen, onVrMietwagenChange,
  vrPolizeiAufnahme, onVrPolizeiAufnahmeChange,
  vrPolizeiAz, onVrPolizeiAzChange,
  vrStaFall, onVrStaFallChange,
  vrJustizAz, onVrJustizAzChange,
  arFalltyp, onArFalltypChange,
  arKuendigungsdatum, onArKuendigungsdatumChange,
  arFristEnde, onArFristEndeChange,
  arLohnrueckstand, onArLohnrueckstandChange,
  zrFalltyp, onZrFalltypChange,
  zrGegenseite, onZrGegenseiteChange,
  zrForderungsbetrag, onZrForderungsbetragChange,
  zrStreitwert, onZrStreitwertChange,
  zrMahnfristEnde, onZrMahnfristEndeChange,
  zrKlageEingereichtAm, onZrKlageEingereichtAmChange,
  irFalltyp, onIrFalltypChange,
  irSchuldner, onIrSchuldnerChange,
  irForderungsbetrag, onIrForderungsbetragChange,
  irInsolvenzgericht, onIrInsolvenzgerichtChange,
  irInsolvenzAktenzeichen, onIrInsolvenzAktenzeichenChange,
  irAntragsdatum, onIrAntragsdatumChange,
  irEroeffnungsdatum, onIrEroeffnungsdatumChange,
  wbFalltyp, onWbFalltypChange,
  wbGegenseite, onWbGegenseiteChange,
  wbVerletzungshandlung, onWbVerletzungshandlungChange,
  wbAbmahnungsdatum, onWbAbmahnungsdatumChange,
  wbFristsetzung, onWbFristsetzungChange,
  wbStreitwert, onWbStreitwertChange,
  erFalltyp, onErFalltypChange,
  erErblasser, onErErblasserChange,
  erTodesdatum, onErTodesdatumChange,
  erNachlassgericht, onErNachlassgerichtChange,
  erNachlassAktenzeichen, onErNachlassAktenzeichenChange,
  erForderungsbetrag, onErForderungsbetragChange,
}: Props) {
  const [tab, setTab] = useState(0);

  const isVR = fall.rechtsgebiet === 'verkehrsrecht';
  const isAR = fall.rechtsgebiet === 'arbeitsrecht';
  const isZR = fall.rechtsgebiet === 'zivilrecht';
  const isIR = fall.rechtsgebiet === 'insolvenzrecht';
  const isWB = fall.rechtsgebiet === 'wettbewerbsrecht';
  const isER = fall.rechtsgebiet === 'erbrecht';

  const vrTabs = ['Allgemein', 'Fahrzeug & Schaden', 'Polizei / StA'];
  const arTabs = ['Allgemein', 'Arbeitsrecht'];
  const zrTabs = ['Allgemein', 'Zivilrecht'];
  const irTabs = ['Allgemein', 'Insolvenzrecht'];
  const wbTabs = ['Allgemein', 'Wettbewerbsrecht'];
  const erTabs = ['Allgemein', 'Erbrecht'];
  const tabs = isVR ? vrTabs : isAR ? arTabs : isZR ? zrTabs : isIR ? irTabs : isWB ? wbTabs : isER ? erTabs : ['Allgemein'];

  const handleClose = () => {
    setTab(0);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 0 }}>Fall bearbeiten</DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map((label) => (
          <Tab key={label} label={label} sx={{ minHeight: 44, fontSize: '0.8rem' }} />
        ))}
      </Tabs>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* ── Tab 0: Allgemein ─────────────────────────────── */}
        {tab === 0 && (
          <Stack spacing={2}>
            <TextField label="Aktenzeichen" value={fall.aktenzeichen} fullWidth disabled />
            <TextField
              label="Eröffnet"
              value={new Date(fall.erstelltAm).toLocaleDateString('de-DE')}
              fullWidth
              disabled
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={neuerStatus} onChange={(e) => onNeuerStatusChange(e.target.value)} label="Status">
                {STATUS_OPTIONEN.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        )}

        {/* ── VR Tab 1: Fahrzeug & Schaden ─────────────────── */}
        {isVR && tab === 1 && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Abrechnungsart</InputLabel>
              <Select
                value={vrAbrechnungsart}
                onChange={(e) => onVrAbrechnungsartChange(e.target.value as Abrechnungsart)}
                label="Abrechnungsart"
              >
                <MenuItem value="konkret">Konkret (Reparaturrechnung)</MenuItem>
                <MenuItem value="fiktiv">Fiktiv (Gutachtenwert netto)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Anspruchsinhaber</InputLabel>
              <Select
                value={vrAnspruchsinhaber}
                onChange={(e) => onVrAnspruchsinhaberChange(e.target.value as Anspruchsinhaber)}
                label="Anspruchsinhaber"
              >
                <MenuItem value="mandant">Mandant / Eigentümer</MenuItem>
                <MenuItem value="leasing">Leasinggeber</MenuItem>
                <MenuItem value="bank">Finanzierende Bank</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Kennzeichen"
              value={vrKennzeichen}
              onChange={(e) => onVrKennzeichenChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Fahrzeugtyp"
              value={vrFahrzeugTyp}
              onChange={(e) => onVrFahrzeugTypChange(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Baujahr"
                type="number"
                value={vrBaujahr}
                onChange={(e) => onVrBaujahrChange(Number(e.target.value || 0))}
                fullWidth
              />
              <TextField
                label="Erstzulassung"
                type="date"
                value={vrErstzulassung}
                onChange={(e) => onVrErstzulassungChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              label="Schadenshöhe gesamt (€) — vorläufig"
              type="number"
              value={vrSchadenshoehe}
              onChange={(e) => onVrSchadenhoheChange(e.target.value)}
              fullWidth
              helperText="Für Textvorlagen / Briefköpfe"
            />

            {/* Schadenpositionen je nach Abrechnungsart */}
            {vrAbrechnungsart === 'fiktiv' ? (
              <TextField
                label="Gutachtenwert netto (€)"
                type="number"
                value={vrGutachtenwert}
                onChange={(e) => onVrGutachtenwertChange(e.target.value)}
                fullWidth
                helperText="Wiederbeschaffungswert oder Nettoreparaturkosten lt. Gutachten"
                InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
              />
            ) : (
              <TextField
                label="Reparaturkosten brutto (€)"
                type="number"
                value={vrReparaturkosten}
                onChange={(e) => onVrReparaturkostenChange(e.target.value)}
                fullWidth
                helperText="Reparaturrechnung (brutto inkl. MwSt.)"
                InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
              />
            )}

            <Stack direction="row" spacing={2}>
              <TextField
                label="Nutzungsausfall (€)"
                type="number"
                value={vrNutzungsausfall}
                onChange={(e) => onVrNutzungsausfallChange(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
              />
              <TextField
                label="Mietwagenkosten (€)"
                type="number"
                value={vrMietwagen}
                onChange={(e) => onVrMietwagenChange(e.target.value)}
                fullWidth
                InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
              />
            </Stack>
          </Stack>
        )}

        {/* ── VR Tab 2: Polizei / StA ───────────────────────── */}
        {isVR && tab === 2 && (
          <Stack spacing={2.5}>
            <FormControl>
              <FormLabel>Unfall polizeilich aufgenommen?</FormLabel>
              <RadioGroup
                row
                value={vrPolizeiAufnahme}
                onChange={(e) => onVrPolizeiAufnahmeChange(e.target.value as 'ja' | 'nein')}
              >
                <FormControlLabel value="ja" control={<Radio />} label="Ja" />
                <FormControlLabel value="nein" control={<Radio />} label="Nein" />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Polizei-Aktenzeichen"
              fullWidth
              value={vrPolizeiAz}
              onChange={(e) => onVrPolizeiAzChange(e.target.value)}
              disabled={vrPolizeiAufnahme !== 'ja'}
              helperText={vrPolizeiAufnahme !== 'ja' ? 'Nur wenn Unfall aufgenommen' : undefined}
            />
            <Box sx={{ pt: 1 }}>
              <FormControl>
                <FormLabel>Fall bei Staatsanwaltschaft (StA)?</FormLabel>
                <RadioGroup
                  row
                  value={vrStaFall}
                  onChange={(e) => onVrStaFallChange(e.target.value as 'ja' | 'nein')}
                >
                  <FormControlLabel value="ja" control={<Radio />} label="Ja" />
                  <FormControlLabel value="nein" control={<Radio />} label="Nein" />
                </RadioGroup>
              </FormControl>
            </Box>
            <TextField
              label="Justiz-Aktenzeichen"
              fullWidth
              value={vrJustizAz}
              onChange={(e) => onVrJustizAzChange(e.target.value)}
              disabled={vrStaFall !== 'ja'}
              helperText={vrStaFall !== 'ja' ? 'Nur wenn StA-Fall' : undefined}
            />
          </Stack>
        )}

        {/* ── AR Tab 1: Arbeitsrecht ────────────────────────── */}
        {isAR && tab === 1 && (
          <Stack spacing={2}>
            <TextField
              label="Falltyp"
              value={arFalltyp}
              onChange={(e) => onArFalltypChange(e.target.value as ARFalltyp)}
              fullWidth
            />
            <TextField
              label="Kündigungsdatum"
              type="date"
              value={arKuendigungsdatum}
              onChange={(e) => onArKuendigungsdatumChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Frist Ende (KSchG)"
              type="date"
              value={arFristEnde}
              onChange={(e) => onArFristEndeChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Lohnrückstand (€)"
              type="number"
              value={arLohnrueckstand}
              onChange={(e) => onArLohnrueckstandChange(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {/* ── ZR Tab 1: Zivilrecht ─────────────────────────── */}
        {isZR && tab === 1 && (
          <Stack spacing={2}>
            <TextField
              label="Falltyp"
              value={zrFalltyp}
              onChange={(e) => onZrFalltypChange(e.target.value as ZRFalltyp)}
              fullWidth
            />
            <TextField
              label="Gegenseite"
              value={zrGegenseite}
              onChange={(e) => onZrGegenseiteChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Forderungsbetrag (€)"
              type="number"
              value={zrForderungsbetrag}
              onChange={(e) => onZrForderungsbetragChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Streitwert (€)"
              type="number"
              value={zrStreitwert}
              onChange={(e) => onZrStreitwertChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Mahnfrist Ende"
              type="date"
              value={zrMahnfristEnde}
              onChange={(e) => onZrMahnfristEndeChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Klage eingereicht am"
              type="date"
              value={zrKlageEingereichtAm}
              onChange={(e) => onZrKlageEingereichtAmChange(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        )}

        {/* ── IR Tab 1: Insolvenzrecht ──────────────────────── */}
        {isIR && tab === 1 && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Art des Verfahrens</InputLabel>
              <Select
                value={irFalltyp}
                onChange={(e) => onIrFalltypChange(e.target.value as IRFalltyp)}
                label="Art des Verfahrens"
              >
                <MenuItem value="regelinsolvenz">Regelinsolvenz</MenuItem>
                <MenuItem value="verbraucherinsolvenz">Verbraucherinsolvenz</MenuItem>
                <MenuItem value="eigenverwaltung">Eigenverwaltung (§ 270 InsO)</MenuItem>
                <MenuItem value="planinsolvenz">Insolvenzplan</MenuItem>
                <MenuItem value="sonstiges">Sonstiges</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Schuldner (Name / Firma)"
              value={irSchuldner}
              onChange={(e) => onIrSchuldnerChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Forderungsbetrag (€)"
              type="number"
              value={irForderungsbetrag}
              onChange={(e) => onIrForderungsbetragChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Insolvenzgericht"
              value={irInsolvenzgericht}
              onChange={(e) => onIrInsolvenzgerichtChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Insolvenz-Aktenzeichen (Gericht)"
              value={irInsolvenzAktenzeichen}
              onChange={(e) => onIrInsolvenzAktenzeichenChange(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Antragsdatum"
                type="date"
                value={irAntragsdatum}
                onChange={(e) => onIrAntragsdatumChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Eröffnungsdatum"
                type="date"
                value={irEroeffnungsdatum}
                onChange={(e) => onIrEroeffnungsdatumChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        )}

        {/* ── WB Tab 1: Wettbewerbsrecht ───────────────────── */}
        {isWB && tab === 1 && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Falltyp</InputLabel>
              <Select
                value={wbFalltyp}
                onChange={(e) => onWbFalltypChange(e.target.value as WBFalltyp)}
                label="Falltyp"
              >
                <MenuItem value="abmahnung">Abmahnung</MenuItem>
                <MenuItem value="einstw_verfuegung">Einstweilige Verfügung</MenuItem>
                <MenuItem value="hauptsacheklage">Hauptsacheklage</MenuItem>
                <MenuItem value="schutzschrift">Schutzschrift</MenuItem>
                <MenuItem value="sonstiges">Sonstiges</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Gegenseite / Verletzer"
              value={wbGegenseite}
              onChange={(e) => onWbGegenseiteChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Verletzungshandlung"
              value={wbVerletzungshandlung}
              onChange={(e) => onWbVerletzungshandlungChange(e.target.value)}
              fullWidth
              helperText="z.B. unlautere Werbung, Markenrechtsverletzung"
            />
            <TextField
              label="Streitwert (€)"
              type="number"
              value={wbStreitwert}
              onChange={(e) => onWbStreitwertChange(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Datum der Abmahnung"
                type="date"
                value={wbAbmahnungsdatum}
                onChange={(e) => onWbAbmahnungsdatumChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fristsetzung bis"
                type="date"
                value={wbFristsetzung}
                onChange={(e) => onWbFristsetzungChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </Stack>
        )}

        {/* ── ER Tab 1: Erbrecht ───────────────────────────── */}
        {isER && tab === 1 && (
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Falltyp</InputLabel>
              <Select
                value={erFalltyp}
                onChange={(e) => onErFalltypChange(e.target.value as ERFalltyp)}
                label="Falltyp"
              >
                <MenuItem value="pflichtteil">Pflichtteilsanspruch</MenuItem>
                <MenuItem value="testament_anfechtung">Testament / Erbvertrag anfechten</MenuItem>
                <MenuItem value="erbschein">Erbschein beantragen</MenuItem>
                <MenuItem value="erbauseinandersetzung">Erbauseinandersetzung</MenuItem>
                <MenuItem value="nachlasspflege">Nachlasspflege / -verwaltung</MenuItem>
                <MenuItem value="sonstiges">Sonstiges</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Erblasser (Name)"
              value={erErblasser}
              onChange={(e) => onErErblasserChange(e.target.value)}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Todesdatum"
                type="date"
                value={erTodesdatum}
                onChange={(e) => onErTodesdatumChange(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Forderungsbetrag (€)"
                type="number"
                value={erForderungsbetrag}
                onChange={(e) => onErForderungsbetragChange(e.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Nachlassgericht"
              value={erNachlassgericht}
              onChange={(e) => onErNachlassgerichtChange(e.target.value)}
              fullWidth
            />
            <TextField
              label="Nachlassgericht-Aktenzeichen"
              value={erNachlassAktenzeichen}
              onChange={(e) => onErNachlassAktenzeichenChange(e.target.value)}
              fullWidth
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Abbrechen</Button>
        <Button variant="contained" onClick={onSave}>Speichern</Button>
      </DialogActions>
    </Dialog>
  );
}
