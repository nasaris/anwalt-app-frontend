import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  StepConnector,
  stepConnectorClasses,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Rechtsgebiet, VRPhase, ARPhase } from '../../types';

const VR_PHASEN = [
  {
    label: 'Phase 1 — Eingang & Fallanlage',
    beschreibung: 'E-Mail-Eingang, Parteien anlegen, Fallanlage mit Pflichtfeldern',
  },
  {
    label: 'Phase 2 — Schriftverkehr Versicherung',
    beschreibung: 'Schadensanzeige, Gutachten, Reparaturrechnung, Anwaltskostenrechnung',
  },
  {
    label: 'Phase 3 — Kürzungsschreiben & Stellungnahme',
    beschreibung: 'Kürzung prüfen, Stellungnahme erstellen (Gutachten, Werkstatt, RVG)',
  },
  {
    label: 'Phase 4 — Ablehnung & Klageerhebung',
    beschreibung: 'Mandant informieren, Vorschussrechnung, Klageschrift',
  },
];

const AR_PHASEN = [
  {
    label: 'Phase 1 — Eingang & Fallanlage',
    beschreibung: 'Mandatsanfrage, RSV prüfen, Mandant anlegen, Falltyp bestimmen',
  },
  {
    label: 'Phase 2 — Außergerichtlicher Versuch',
    beschreibung: 'Schreiben an Gegenseite, Wiedervorlage, ggf. Einigung',
  },
  {
    label: 'Phase 3 — Gerichtliches Verfahren',
    beschreibung: 'Klageschrift, Güteverhandlung, Kammertermin, Urteil',
  },
];

/** Connector: dezente Linie zwischen den Schritten */
const JuristConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 18,
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 2,
  },
}));

interface PhaseTimelineProps {
  rechtsgebiet: Rechtsgebiet;
  aktuellePhase: VRPhase | ARPhase;
  vertikal?: boolean;
}

export default function PhaseTimeline({
  rechtsgebiet,
  aktuellePhase,
  vertikal = false,
}: PhaseTimelineProps) {
  const phasen = rechtsgebiet === 'verkehrsrecht' ? VR_PHASEN : AR_PHASEN;
  const activeStep = aktuellePhase - 1;

  if (vertikal) {
    return (
      <Stepper activeStep={activeStep} orientation="vertical">
        {phasen.map((phase, i) => (
          <Step key={phase.label} completed={i < activeStep}>
            <StepLabel
              sx={{
                '& .MuiStepLabel-label': {
                  fontWeight: i === activeStep ? 700 : 400,
                  color:
                    i === activeStep
                      ? 'primary.main'
                      : i < activeStep
                        ? 'success.main'
                        : 'text.secondary',
                },
              }}
            >
              {phase.label}
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {phase.beschreibung}
              </Typography>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        py: 1,
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<JuristConnector />}
        sx={{
          width: '100%',
          minWidth: { xs: 520, sm: '100%' },
          px: { xs: 0.5, sm: 0 },
          '& .MuiStepLabel-label': {
            display: 'block',
            mt: 0.75,
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
            lineHeight: 1.35,
            textAlign: 'center',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
          },
          '& .MuiStepLabel-label.Mui-active': {
            fontWeight: 700,
            color: 'text.primary',
          },
          '& .MuiStepLabel-label.Mui-completed': {
            fontWeight: 500,
            color: 'success.main',
          },
          '& .MuiStepLabel-label:not(.Mui-active):not(.Mui-completed)': {
            color: 'text.secondary',
            fontWeight: 400,
          },
          '& .MuiStepIcon-root': {
            width: 36,
            height: 36,
          },
          '& .MuiStepIcon-root.Mui-active': {
            color: 'primary.main',
          },
          '& .MuiStepIcon-root.Mui-completed': {
            color: 'success.main',
          },
        }}
      >
        {phasen.map((phase, i) => (
          <Step key={phase.label} completed={i < activeStep}>
            <StepLabel>{phase.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
