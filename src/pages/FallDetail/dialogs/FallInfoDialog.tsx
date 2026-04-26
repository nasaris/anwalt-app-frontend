import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { Fall } from '../../../types';
import KennzeichenSchild from '../../../components/KennzeichenSchild/KennzeichenSchild';

const FALLTYP_LABELS: Record<string, string> = {
  // Arbeitsrecht
  kuendigung: 'Kündigung',
  abmahnung: 'Abmahnung',
  aufhebung: 'Aufhebungsvertrag',
  lohn: 'Lohn-/Gehaltsforderung',
  mobbing: 'Mobbing / Versetzung',
  versetzung: 'Versetzung',
  // Insolvenzrecht
  regelinsolvenz: 'Regelinsolvenz',
  verbraucherinsolvenz: 'Verbraucherinsolvenz',
  eigenverwaltung: 'Eigenverwaltung (§ 270 InsO)',
  planinsolvenz: 'Insolvenzplan',
  // Wettbewerbsrecht
  einstw_verfuegung: 'Einstweilige Verfügung',
  hauptsacheklage: 'Hauptsacheklage',
  schutzschrift: 'Schutzschrift',
  // Erbrecht
  pflichtteil: 'Pflichtteilsanspruch',
  testament_anfechtung: 'Testament / Erbvertrag anfechten',
  erbschein: 'Erbschein beantragen',
  erbauseinandersetzung: 'Erbauseinandersetzung',
  nachlasspflege: 'Nachlasspflege / -verwaltung',
  // Gemeinsam
  sonstiges: 'Sonstiges',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}:</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  );
}

function optionalValue(value?: string | number | null): string {
  if (value == null) return '—';
  const text = String(value).trim();
  return text.length > 0 ? text : '—';
}

interface Props {
  open: boolean;
  fall: Fall;
  maxPhaseNummer: number;
  onClose: () => void;
}

export default function FallInfoDialog({ open, fall, maxPhaseNummer, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Fallinformationen — Details</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <InfoRow label="Aktenzeichen" value={fall.aktenzeichen} />
          <InfoRow
            label="Rechtsgebiet"
            value={{
              verkehrsrecht: 'Verkehrsrecht',
              arbeitsrecht: 'Arbeitsrecht',
              zivilrecht: 'Zivilrecht',
              insolvenzrecht: 'Insolvenzrecht',
              wettbewerbsrecht: 'Wettbewerbsrecht',
              erbrecht: 'Erbrecht',
            }[fall.rechtsgebiet] ?? fall.rechtsgebiet}
          />
          <InfoRow label="Phase" value={`Phase ${fall.phase} von ${maxPhaseNummer}`} />
          <InfoRow label="Status" value={fall.status} />
          <InfoRow label="Angelegt am" value={new Date(fall.erstelltAm).toLocaleDateString('de-DE')} />

          {fall.verkehrsrecht && (
            <>
              <Divider />
              <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Verkehrsrecht
              </Typography>
              <InfoRow
                label="Abrechnungsart"
                value={fall.verkehrsrecht.abrechnungsart === 'fiktiv' ? 'Fiktiv (Gutachtenwert netto)' : 'Konkret (Reparaturrechnung)'}
              />
              <InfoRow
                label="Anspruchsinhaber"
                value={{ mandant: 'Mandant / Eigentümer', leasing: 'Leasinggeber', bank: 'Finanzierende Bank' }[fall.verkehrsrecht.anspruchsinhaber]}
              />
              <InfoRow
                label="Schadenshöhe"
                value={
                  fall.verkehrsrecht.schadenshoehe != null
                    ? fall.verkehrsrecht.schadenshoehe.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
              <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>Fahrzeug:</Typography>
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1}>
                  <KennzeichenSchild kennzeichen={fall.verkehrsrecht.fahrzeug.kennzeichen ?? ''} />
                  <Typography variant="body2">
                    {optionalValue(fall.verkehrsrecht.fahrzeug.typ)} ({optionalValue(fall.verkehrsrecht.fahrzeug.baujahr)})
                  </Typography>
                </Stack>
              </Stack>
              <InfoRow
                label="Erstzulassung"
                value={
                  fall.verkehrsrecht.fahrzeug.erstzulassung
                    ? new Date(fall.verkehrsrecht.fahrzeug.erstzulassung).toLocaleDateString('de-DE')
                    : '—'
                }
              />
              <InfoRow label="Polizeilich aufgenommen" value={fall.verkehrsrecht.polizeiAufnahme ? 'Ja' : 'Nein'} />
              <InfoRow
                label="Polizei-AZ"
                value={fall.verkehrsrecht.polizeiAufnahme ? optionalValue(fall.verkehrsrecht.polizeiAktenzeichen) : '—'}
              />
              <InfoRow label="Staatsanwaltschaft (StA)" value={fall.verkehrsrecht.staatsanwaltschaftFall ? 'Ja' : 'Nein'} />
              <InfoRow
                label="Justiz-AZ"
                value={fall.verkehrsrecht.staatsanwaltschaftFall ? optionalValue(fall.verkehrsrecht.justizAktenzeichen) : '—'}
              />
            </>
          )}

          {fall.arbeitsrecht && (
            <>
              <Divider />
              <Typography variant="caption" color="secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Arbeitsrecht
              </Typography>
              <InfoRow label="Falltyp" value={FALLTYP_LABELS[fall.arbeitsrecht.falltyp] ?? fall.arbeitsrecht.falltyp} />
              <InfoRow
                label="Kündigungsdatum"
                value={fall.arbeitsrecht.kuendigungsdatum ? new Date(fall.arbeitsrecht.kuendigungsdatum).toLocaleDateString('de-DE') : '—'}
              />
              <InfoRow
                label="KSchG-Fristende"
                value={fall.arbeitsrecht.fristEnde ? new Date(fall.arbeitsrecht.fristEnde).toLocaleDateString('de-DE') : '—'}
              />
              <InfoRow
                label="Lohnrückstand"
                value={
                  fall.arbeitsrecht.lohnrueckstand != null
                    ? fall.arbeitsrecht.lohnrueckstand.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
            </>
          )}

          {fall.zivilrecht && (
            <>
              <Divider />
              <Typography variant="caption" color="success.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Zivilrecht
              </Typography>
              <InfoRow label="Falltyp" value={FALLTYP_LABELS[fall.zivilrecht.falltyp] ?? fall.zivilrecht.falltyp} />
              <InfoRow label="Gegenseite" value={optionalValue(fall.zivilrecht.gegenseite)} />
              <InfoRow
                label="Forderungsbetrag"
                value={
                  fall.zivilrecht.forderungsbetrag != null
                    ? fall.zivilrecht.forderungsbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
              <InfoRow
                label="Streitwert"
                value={
                  fall.zivilrecht.streitwert != null
                    ? fall.zivilrecht.streitwert.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
              <InfoRow
                label="Mahnfrist bis"
                value={fall.zivilrecht.mahnfristEnde ? new Date(fall.zivilrecht.mahnfristEnde).toLocaleDateString('de-DE') : '—'}
              />
              <InfoRow
                label="Klage eingereicht"
                value={fall.zivilrecht.klageEingereichtAm ? new Date(fall.zivilrecht.klageEingereichtAm).toLocaleDateString('de-DE') : '—'}
              />
            </>
          )}

          {fall.insolvenzrecht && (
            <>
              <Divider />
              <Typography variant="caption" color="warning.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Insolvenzrecht
              </Typography>
              <InfoRow label="Art des Verfahrens" value={FALLTYP_LABELS[fall.insolvenzrecht.falltyp] ?? fall.insolvenzrecht.falltyp} />
              <InfoRow label="Schuldner" value={optionalValue(fall.insolvenzrecht.schuldner)} />
              <InfoRow
                label="Forderungsbetrag"
                value={
                  fall.insolvenzrecht.forderungsbetrag != null
                    ? fall.insolvenzrecht.forderungsbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
              <InfoRow label="Insolvenzgericht" value={optionalValue(fall.insolvenzrecht.insolvenzgericht)} />
              <InfoRow label="Insolvenz-AZ (Gericht)" value={optionalValue(fall.insolvenzrecht.insolvenzAktenzeichen)} />
              <InfoRow
                label="Antragsdatum"
                value={fall.insolvenzrecht.antragsdatum ? new Date(fall.insolvenzrecht.antragsdatum).toLocaleDateString('de-DE') : '—'}
              />
              <InfoRow
                label="Eröffnungsdatum"
                value={fall.insolvenzrecht.eroeffnungsdatum ? new Date(fall.insolvenzrecht.eroeffnungsdatum).toLocaleDateString('de-DE') : '—'}
              />
            </>
          )}

          {fall.wettbewerbsrecht && (
            <>
              <Divider />
              <Typography variant="caption" color="error.main" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Wettbewerbsrecht
              </Typography>
              <InfoRow label="Falltyp" value={FALLTYP_LABELS[fall.wettbewerbsrecht.falltyp] ?? fall.wettbewerbsrecht.falltyp} />
              <InfoRow label="Gegenseite / Verletzer" value={optionalValue(fall.wettbewerbsrecht.gegenseite)} />
              <InfoRow label="Verletzungshandlung" value={optionalValue(fall.wettbewerbsrecht.verletzungshandlung)} />
              <InfoRow
                label="Streitwert"
                value={
                  fall.wettbewerbsrecht.streitwert != null
                    ? fall.wettbewerbsrecht.streitwert.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
              <InfoRow
                label="Datum der Abmahnung"
                value={fall.wettbewerbsrecht.abmahnungsdatum ? new Date(fall.wettbewerbsrecht.abmahnungsdatum).toLocaleDateString('de-DE') : '—'}
              />
              <InfoRow
                label="Fristsetzung bis"
                value={fall.wettbewerbsrecht.fristsetzung ? new Date(fall.wettbewerbsrecht.fristsetzung).toLocaleDateString('de-DE') : '—'}
              />
            </>
          )}

          {fall.erbrecht && (
            <>
              <Divider />
              <Typography variant="caption" color="info.dark" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Erbrecht
              </Typography>
              <InfoRow label="Falltyp" value={FALLTYP_LABELS[fall.erbrecht.falltyp] ?? fall.erbrecht.falltyp} />
              <InfoRow label="Erblasser" value={optionalValue(fall.erbrecht.erblasser)} />
              <InfoRow
                label="Todesdatum"
                value={fall.erbrecht.todesdatum ? new Date(fall.erbrecht.todesdatum).toLocaleDateString('de-DE') : '—'}
              />
              <InfoRow
                label="Forderungsbetrag"
                value={
                  fall.erbrecht.forderungsbetrag != null
                    ? fall.erbrecht.forderungsbetrag.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                    : '—'
                }
              />
              <InfoRow label="Nachlassgericht" value={optionalValue(fall.erbrecht.nachlassgericht)} />
              <InfoRow label="Nachlassgericht-AZ" value={optionalValue(fall.erbrecht.nachlassAktenzeichen)} />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}
