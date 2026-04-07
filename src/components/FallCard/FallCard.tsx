import { Card, CardContent, CardActionArea, Typography, Box, Chip, Stack } from '@mui/material';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WorkIcon from '@mui/icons-material/Work';
import { useNavigate } from 'react-router-dom';
import type { Fall } from '../../types';
import FristBadge from '../FristBadge/FristBadge';

/** Einheitliche Kachelgröße (Fälle-Grid) */
const CARD_HEIGHT_PX = 220;

const STATUS_COLORS = {
  aktiv: 'primary',
  abgeschlossen: 'default',
  klage: 'error',
  einigung: 'success',
  frist_abgelaufen: 'warning',
} as const;

const STATUS_LABELS = {
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  klage: 'Klage',
  einigung: 'Einigung',
  frist_abgelaufen: 'Frist abgelaufen',
};

interface FallCardProps {
  fall: Fall;
}

export default function FallCard({ fall }: FallCardProps) {
  const navigate = useNavigate();
  const isVR = fall.rechtsgebiet === 'verkehrsrecht';

  const hasFrist = Boolean(fall.arbeitsrecht?.fristEnde);
  const hasWv = Boolean(fall.wiedervorlage && fall.status === 'aktiv');

  return (
    <Card
      elevation={1}
      sx={{
        height: CARD_HEIGHT_PX,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '4px solid',
        borderColor: isVR ? 'info.main' : 'secondary.main',
        borderRadius: 2,
        overflow: 'hidden',
        '&:hover': {
          boxShadow: (t) => t.shadows[4],
        },
      }}
    >
      <CardActionArea
        onClick={() => navigate(`/faelle/${fall.id}`)}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'flex-start',
        }}
      >
        <CardContent
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            pt: 2,
            pb: 2,
            px: 2,
            '&:last-child': { pb: 2 },
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1} mb={1}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
              {isVR ? (
                <DirectionsCarIcon color="info" fontSize="small" sx={{ flexShrink: 0 }} />
              ) : (
                <WorkIcon color="secondary" fontSize="small" sx={{ flexShrink: 0 }} />
              )}
              <Typography variant="subtitle2" fontWeight={700} noWrap title={fall.aktenzeichen}>
                {fall.aktenzeichen}
              </Typography>
            </Box>
            <Chip
              label={STATUS_LABELS[fall.status]}
              color={STATUS_COLORS[fall.status]}
              size="small"
              sx={{ flexShrink: 0, maxWidth: '42%' }}
            />
          </Stack>

          <Typography
            variant="caption"
            color="text.secondary"
            display="-webkit-box"
            sx={{
              mb: 1,
              overflow: 'hidden',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
              lineHeight: 1.35,
              minHeight: '2.7em',
            }}
          >
            {isVR ? 'Verkehrsrecht' : 'Arbeitsrecht'} — Phase {fall.phase}
            {fall.arbeitsrecht?.falltyp && ` · ${fall.arbeitsrecht.falltyp}`}
          </Typography>

          <Box
            sx={{
              mt: 'auto',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.75,
              alignItems: 'center',
              minHeight: hasFrist || hasWv ? 32 : 0,
            }}
          >
            {hasFrist && fall.arbeitsrecht?.fristEnde && (
              <FristBadge fristEnde={fall.arbeitsrecht.fristEnde} label="KSchG-Frist" />
            )}
            {hasWv && fall.wiedervorlage && (
              <FristBadge fristEnde={fall.wiedervorlage} label="Wiedervorlage" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
