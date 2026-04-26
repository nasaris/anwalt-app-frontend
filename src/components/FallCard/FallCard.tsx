import { Card, CardContent, CardActionArea, Typography, Box, Chip, Stack } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BalanceIcon from '@mui/icons-material/Balance';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import GavelIcon from '@mui/icons-material/Gavel';
import WorkIcon from '@mui/icons-material/Work';
import { useNavigate } from 'react-router-dom';
import type { Fall } from '../../types';
import { effektiveWvIso } from '../../utils/fallWvAnzeige';
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

const RECHTSGEBIET_ICON_COLOR: Record<Fall['rechtsgebiet'], string> = {
  verkehrsrecht: 'info.main',
  arbeitsrecht: 'secondary.main',
  zivilrecht: 'success.main',
  insolvenzrecht: 'warning.main',
  wettbewerbsrecht: 'error.main',
  erbrecht: 'primary.dark',
};

interface FallCardProps {
  fall: Fall;
  naechsteWvByFallId?: Record<string, string>;
}

export default function FallCard({ fall, naechsteWvByFallId = {} }: FallCardProps) {
  const navigate = useNavigate();
  const iconColor = RECHTSGEBIET_ICON_COLOR[fall.rechtsgebiet];
  const rechtsgebietIcon = {
    verkehrsrecht: <DirectionsCarIcon fontSize="small" sx={{ flexShrink: 0, color: iconColor }} />,
    arbeitsrecht: <WorkIcon fontSize="small" sx={{ flexShrink: 0, color: iconColor }} />,
    zivilrecht: <BalanceIcon fontSize="small" sx={{ flexShrink: 0, color: iconColor }} />,
    insolvenzrecht: <AccountBalanceIcon fontSize="small" sx={{ flexShrink: 0, color: iconColor }} />,
    wettbewerbsrecht: <GavelIcon fontSize="small" sx={{ flexShrink: 0, color: iconColor }} />,
    erbrecht: <FamilyRestroomIcon fontSize="small" sx={{ flexShrink: 0, color: iconColor }} />,
  }[fall.rechtsgebiet];

  const wvEff = effektiveWvIso(fall, naechsteWvByFallId);
  const hasFrist = Boolean(fall.arbeitsrecht?.fristEnde);
  const hasWv = Boolean(wvEff);

  return (
    <Card
      elevation={1}
      sx={{
        height: CARD_HEIGHT_PX,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '4px solid',
        borderColor: iconColor,
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
              {rechtsgebietIcon}
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
            {{
              verkehrsrecht: 'Verkehrsrecht',
              arbeitsrecht: 'Arbeitsrecht',
              zivilrecht: 'Zivilrecht',
              insolvenzrecht: 'Insolvenzrecht',
              wettbewerbsrecht: 'Wettbewerbsrecht',
              erbrecht: 'Erbrecht',
            }[fall.rechtsgebiet] ?? fall.rechtsgebiet} — Phase {fall.phase}
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
            {hasWv && wvEff && (
              <FristBadge fristEnde={wvEff} label="Wiedervorlage" />
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
