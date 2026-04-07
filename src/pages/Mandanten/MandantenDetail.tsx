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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import { mandantenApi } from '../../api/mandanten';
import { faelleApi } from '../../api/faelle';
import type { Mandant, Fall } from '../../types';

export default function MandantenDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mandant, setMandant] = useState<Mandant | null>(null);
  const [faelle, setFaelle] = useState<Fall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([mandantenApi.getById(id), faelleApi.getAll()]).then(([m, alle]) => {
      setMandant(m);
      setFaelle(alle.filter((f) => f.mandantId === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (!mandant) return <Alert severity="error">Mandant nicht gefunden.</Alert>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component="button" variant="body2" underline="hover" onClick={() => navigate('/mandanten')}>
          Mandanten
        </Link>
        <Typography variant="body2" color="text.primary">
          {mandant.vorname} {mandant.nachname}
        </Typography>
      </Breadcrumbs>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          {mandant.vorname} {mandant.nachname}
        </Typography>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => navigate('/mandanten')}>
          Zurück
        </Button>
      </Stack>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Kontaktdaten</Typography>
            <Stack spacing={1.5}>
              <InfoRow label="E-Mail" value={mandant.email} />
              <InfoRow label="Telefon" value={mandant.telefon} />
              <InfoRow label="Adresse" value={`${mandant.adresse.strasse}, ${mandant.adresse.plz} ${mandant.adresse.ort}`} />
              <Divider />
              <InfoRow
                label="RSV"
                value={mandant.rsv
                  ? `${mandant.rsvGesellschaft ?? 'Ja'} — Nr. ${mandant.rsvNummer ?? '—'}`
                  : 'Keine Rechtsschutzversicherung'}
              />
              {mandant.rsv && (
                <Chip label="RSV vorhanden" color="success" size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
              )}
              <Divider />
              <InfoRow label="Angelegt am" value={new Date(mandant.erstelltAm).toLocaleDateString('de-DE')} />
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={1}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={600}>Fälle</Typography>
              <Button
                size="small"
                startIcon={<FolderIcon />}
                variant="outlined"
                onClick={() => navigate('/faelle/neu')}
              >
                Neuer Fall
              </Button>
            </Box>
            <Divider />
            {faelle.length === 0 ? (
              <Box p={3} textAlign="center">
                <Typography color="text.secondary">Keine Fälle für diesen Mandanten.</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Aktenzeichen</TableCell>
                      <TableCell>Rechtsgebiet</TableCell>
                      <TableCell>Phase</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {faelle.map((f) => (
                      <TableRow
                        key={f.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/faelle/${f.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {f.aktenzeichen}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={f.rechtsgebiet === 'verkehrsrecht' ? 'VR' : 'AR'}
                            size="small"
                            color={f.rechtsgebiet === 'verkehrsrecht' ? 'info' : 'secondary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>Phase {f.phase}</TableCell>
                        <TableCell>
                          <Chip
                            label={f.status}
                            size="small"
                            color={f.status === 'aktiv' ? 'primary' : 'default'}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>{label}:</Typography>
      <Typography variant="body2" fontWeight={500}>{value}</Typography>
    </Box>
  );
}
