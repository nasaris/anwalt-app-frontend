import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
  Skeleton,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BadgeIcon from '@mui/icons-material/Badge';
import { parteienApi } from '../../api/parteien';
import { faelleApi } from '../../api/faelle';
import { mandantenApi } from '../../api/mandanten';
import type { Partei, Fall, Mandant } from '../../types';
import {
  VR_ROLLE_LABEL,
  parteiIdInFallVerkehrsrecht,
} from '../../utils/verkehrsParteienHelpers';
import ParteiDialog from '../../components/ParteiDialog/ParteiDialog';

const TYP_LABELS: Record<string, string> = {
  gutachter: 'Gutachter / Sachverständiger',
  werkstatt: 'Werkstatt',
  versicherung: 'Versicherung',
  gegenseite: 'Gegenseite / Arbeitgeber',
  gericht: 'Gericht',
};

const TYP_COLORS: Record<string, 'default' | 'info' | 'warning' | 'error' | 'secondary' | 'primary'> = {
  gutachter: 'info',
  werkstatt: 'warning',
  versicherung: 'primary',
  gegenseite: 'error',
  gericht: 'secondary',
};

const RG_LABELS: Record<string, string> = {
  verkehrsrecht: 'Verkehrsrecht',
  arbeitsrecht: 'Arbeitsrecht',
  zivilrecht: 'Zivilrecht',
};

const STATUS_COLORS: Record<string, 'primary' | 'default' | 'success' | 'warning'> = {
  aktiv: 'primary',
  einigung: 'success',
  klage: 'warning',
  abgeschlossen: 'default',
};

function parteiInitialen(p: Partei): string {
  const parts = p.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return p.name.slice(0, 2).toUpperCase();
}

function fallBezugLabel(f: Fall, parteiId: string): string {
  const rollen: string[] = [];
  const vr = f.verkehrsrecht;
  const ar = f.arbeitsrecht;
  const zr = f.zivilrecht;
  if (vr?.beteiligteParteien?.length) {
    for (const e of vr.beteiligteParteien) {
      if (e.parteiId === parteiId) {
        rollen.push(VR_ROLLE_LABEL[e.rolle] ?? e.rolle);
      }
    }
  } else if (vr) {
    if (vr.versicherungId === parteiId) rollen.push('Versicherung');
    if (vr.gutachterId === parteiId) rollen.push('Gutachter');
    if (vr.werkstattId === parteiId) rollen.push('Werkstatt');
  }
  if (ar?.gegenseiteId === parteiId) rollen.push('Gegenseite');
  if (ar?.gerichtId === parteiId) rollen.push('Gericht');
  if (zr?.gegenseiteId === parteiId) rollen.push('Gegenseite');
  if (zr?.gerichtId === parteiId) rollen.push('Gericht');
  return rollen.join(', ') || '—';
}

export default function ParteiDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [partei, setPartei] = useState<Partei | null>(null);
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [mandantenMap, setMandantenMap] = useState<Record<string, Mandant>>({});
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([parteienApi.getById(id), faelleApi.getAll()]).then(async ([p, alle]) => {
      setPartei(p);
      const zugehoerig = alle.filter((f) => {
        const vr = f.verkehrsrecht;
        const ar = f.arbeitsrecht;
        const zr = f.zivilrecht;
        return (
          parteiIdInFallVerkehrsrecht(vr, id) ||
          ar?.gegenseiteId === id ||
          ar?.gerichtId === id ||
          zr?.gegenseiteId === id ||
          zr?.gerichtId === id
        );
      });
      setFaelle(zugehoerig);

      // Mandanten für die Fälle laden
      const mandantIds = [...new Set(zugehoerig.map((f) => f.mandantId))];
      if (mandantIds.length > 0) {
        const mandanten = await Promise.all(mandantIds.map((mid) => mandantenApi.getById(mid)));
        const map: Record<string, Mandant> = {};
        mandanten.forEach((m) => { map[m.id] = m; });
        setMandantenMap(map);
      }

      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
      </Box>
    );
  }

  if (!partei) return <Alert severity="error">Partei nicht gefunden.</Alert>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/parteien')}>
          Parteien
        </Link>
        <Typography variant="body2" color="text.primary">{partei.name}</Typography>
      </Breadcrumbs>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}>
            {parteiInitialen(partei)}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{partei.name}</Typography>
            <Chip
              label={TYP_LABELS[partei.typ] ?? partei.typ}
              color={TYP_COLORS[partei.typ] ?? 'default'}
              size="small"
              variant="outlined"
              sx={{ mt: 0.5, fontWeight: 700, fontSize: '0.7rem' }}
            />
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Bearbeiten">
            <IconButton onClick={() => setEditOpen(true)}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/parteien')}>
            Zurück
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* Kontaktdaten */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={1} sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Kontaktdaten</Typography>
            <Stack spacing={1.5}>
              {partei.telefon && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{partei.telefon}</Typography>
                </Stack>
              )}
              {partei.email && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{partei.email}</Typography>
                </Stack>
              )}
              {partei.adresse && (
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                  <Typography variant="body2">
                    {partei.adresse.strasse}<br />
                    {partei.adresse.plz} {partei.adresse.ort}
                  </Typography>
                </Stack>
              )}
              {!partei.telefon && !partei.email && !partei.adresse && (
                <Typography variant="body2" color="text.secondary">Keine Kontaktdaten hinterlegt.</Typography>
              )}

              {(partei.gutachterNr || partei.schadensnummer) && (
                <>
                  <Divider />
                  {partei.gutachterNr && (
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <BadgeIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Gutachter-Nr.</Typography>
                        <Typography variant="body2" fontWeight={600}>{partei.gutachterNr}</Typography>
                      </Box>
                    </Stack>
                  )}
                  {partei.schadensnummer && (
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <BadgeIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Schadensnummer</Typography>
                        <Typography variant="body2" fontWeight={600}>{partei.schadensnummer}</Typography>
                      </Box>
                    </Stack>
                  )}
                </>
              )}

              {partei.erstelltAm && (
                <>
                  <Divider />
                  <InfoRow label="Angelegt" value={new Date(partei.erstelltAm).toLocaleDateString('de-DE')} />
                </>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Zugehörige Fälle */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={1}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>
                Zugehörige Fälle
                {faelle.length > 0 && (
                  <Chip label={faelle.length} size="small" sx={{ ml: 1, fontWeight: 700 }} />
                )}
              </Typography>
            </Box>
            <Divider />
            {faelle.length === 0 ? (
              <Box p={3} textAlign="center">
                <Typography color="text.secondary">Diese Partei ist keinem Fall zugeordnet.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
                      <TableCell>Aktenzeichen</TableCell>
                      <TableCell>Mandant</TableCell>
                      <TableCell>Rechtsgebiet</TableCell>
                      <TableCell>Rolle</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {faelle.map((f) => {
                      const mandant = mandantenMap[f.mandantId];
                      return (
                        <TableRow
                          key={f.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/faelle/${f.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {f.aktenzeichen}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {mandant ? `${mandant.vorname} ${mandant.nachname}` : f.mandantId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={RG_LABELS[f.rechtsgebiet] ?? f.rechtsgebiet}
                              size="small"
                              variant="outlined"
                              color={f.rechtsgebiet === 'verkehrsrecht' ? 'info' : f.rechtsgebiet === 'arbeitsrecht' ? 'secondary' : 'default'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {fallBezugLabel(f, partei.id)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={f.status}
                              size="small"
                              variant="outlined"
                              color={STATUS_COLORS[f.status] ?? 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      <ParteiDialog
        open={editOpen}
        partei={partei}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setPartei(updated);
          setEditOpen(false);
        }}
      />
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>{label}:</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  );
}
