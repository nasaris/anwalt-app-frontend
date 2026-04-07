import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Stack,
  Alert,
  Breadcrumbs,
  Link,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
} from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WorkIcon from '@mui/icons-material/Work';
import BalanceIcon from '@mui/icons-material/Balance';
import type { Rechtsgebiet } from '../../types';
import VerkehrsrechtForm from './VerkehrsrechtForm';
import ArbeitsrechtForm from './ArbeitsrechtForm';
import ZivilrechtForm from './ZivilrechtForm';
import DokumenteUploadStep, { type PendingFile } from './DokumenteUploadStep';
import { useDokumenteStore } from '../../store/dokumenteStore';

// VR: 0 Rechtsgebiet → 1 Dokumente → 2 Falldetails → 3 Fertig
// AR/ZR: 0 Rechtsgebiet → 1 Falldetails → 2 Fertig
const STEPS_VR = ['Rechtsgebiet wählen', 'Dokumente hochladen', 'Falldetails', 'Fertig'];
const STEPS_AR = ['Rechtsgebiet wählen', 'Falldetails', 'Fertig'];

export default function FallNeu() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [rechtsgebiet, setRechtsgebiet] = useState<Rechtsgebiet | null>(null);
  const [savedFallId, setSavedFallId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const addUploadedDateien = useDokumenteStore((s) => s.addUploadedDateien);

  const isVR = rechtsgebiet === 'verkehrsrecht';
  const steps = isVR ? STEPS_VR : STEPS_AR;

  const handleSaved = (id: string) => {
    setSavedFallId(id);
    // Jetzt die gesammelten Dateien mit der echten fallId speichern
    if (pendingFiles.length > 0) {
      addUploadedDateien(
        pendingFiles.map((p) => ({
          fallId: id,
          dateiname: p.file.name,
          dateityp: p.file.type || 'application/octet-stream',
          groesse: p.file.size,
          kategorie: p.kategorie,
        }))
      );
    }
    setActiveStep(isVR ? 3 : 2);
  };

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link
          component="button"
          variant="body2"
          underline="hover"
          onClick={() => navigate('/faelle')}
        >
          Fälle
        </Link>
        <Typography variant="body2" color="text.primary">
          Neuer Fall
        </Typography>
      </Breadcrumbs>

      <Typography variant="h5" fontWeight={700} mb={3}>
        Neuen Fall anlegen
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Schritt 0 — Rechtsgebiet */}
      {activeStep === 0 && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" mb={3}>
            Welches Rechtsgebiet betrifft dieser Fall?
          </Typography>
          <ToggleButtonGroup
            value={rechtsgebiet}
            exclusive
            onChange={(_, val) => val && setRechtsgebiet(val)}
            sx={{ gap: 2, flexWrap: 'wrap' }}
          >
            <ToggleButton
              value="verkehrsrecht"
              sx={{
                p: 3,
                flexDirection: 'column',
                gap: 1,
                minWidth: 180,
                border: '2px solid !important',
                borderColor:
                  rechtsgebiet === 'verkehrsrecht' ? 'primary.main !important' : 'grey.300 !important',
              }}
            >
              <DirectionsCarIcon sx={{ fontSize: 40 }} color="info" />
              <Typography variant="subtitle1" fontWeight={600}>
                Verkehrsrecht
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Schadensersatz nach Verkehrsunfall
              </Typography>
            </ToggleButton>
            <ToggleButton
              value="arbeitsrecht"
              sx={{
                p: 3,
                flexDirection: 'column',
                gap: 1,
                minWidth: 180,
                border: '2px solid !important',
                borderColor:
                  rechtsgebiet === 'arbeitsrecht' ? 'secondary.main !important' : 'grey.300 !important',
              }}
            >
              <WorkIcon sx={{ fontSize: 40 }} color="secondary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Arbeitsrecht
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Kündigung, Abmahnung, Lohn u.v.m.
              </Typography>
            </ToggleButton>
            <ToggleButton
              value="zivilrecht"
              sx={{
                p: 3,
                flexDirection: 'column',
                gap: 1,
                minWidth: 180,
                border: '2px solid !important',
                borderColor:
                  rechtsgebiet === 'zivilrecht' ? 'success.main !important' : 'grey.300 !important',
              }}
            >
              <BalanceIcon sx={{ fontSize: 40, color: rechtsgebiet === 'zivilrecht' ? 'success.main' : 'action.active' }} />
              <Typography variant="subtitle1" fontWeight={600}>
                Zivilrecht
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Forderungen, Verträge, Klage
              </Typography>
            </ToggleButton>
          </ToggleButtonGroup>

          <Stack direction="row" spacing={2} mt={4}>
            <Button variant="outlined" onClick={() => navigate('/faelle')}>
              Abbrechen
            </Button>
            <Button
              variant="contained"
              disabled={!rechtsgebiet}
              onClick={() => setActiveStep(1)}
            >
              Weiter
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Schritt 1 (VR) — Dokumente hochladen */}
      {activeStep === 1 && isVR && (
        <DokumenteUploadStep
          onBack={() => setActiveStep(0)}
          onWeiter={(files) => {
            setPendingFiles(files);
            setActiveStep(2);
          }}
        />
      )}

      {/* Schritt 1 (AR/ZR) / Schritt 2 (VR) — Falldetails */}
      {activeStep === 1 && rechtsgebiet === 'arbeitsrecht' && (
        <ArbeitsrechtForm onBack={() => setActiveStep(0)} onSaved={handleSaved} />
      )}
      {activeStep === 1 && rechtsgebiet === 'zivilrecht' && (
        <ZivilrechtForm onBack={() => setActiveStep(0)} onSaved={handleSaved} />
      )}
      {activeStep === 2 && rechtsgebiet === 'verkehrsrecht' && (
        <VerkehrsrechtForm onBack={() => setActiveStep(1)} onSaved={handleSaved} />
      )}

      {/* Fertig */}
      {((isVR && activeStep === 3) || (!isVR && activeStep === 2)) && savedFallId && (
        <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            Fall wurde erfolgreich angelegt!
            {pendingFiles.length > 0 && ` ${pendingFiles.length} Dokument${pendingFiles.length !== 1 ? 'e' : ''} wurden zur Akte hinzugefügt.`}
          </Alert>
          <Grid container spacing={2} justifyContent="center">
            <Grid>
              <Button variant="contained" onClick={() => navigate(`/faelle/${savedFallId}`)}>
                Zum Fall
              </Button>
            </Grid>
            <Grid>
              <Button variant="outlined" onClick={() => navigate('/faelle/neu')}>
                Weiteren Fall anlegen
              </Button>
            </Grid>
            <Grid>
              <Button onClick={() => navigate('/faelle')}>Zur Fallübersicht</Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
