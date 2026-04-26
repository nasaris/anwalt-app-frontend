import type { ReactElement } from 'react';
import {
  Avatar,
  Box,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneIcon from '@mui/icons-material/Phone';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PublishedWithChangesIcon from '@mui/icons-material/PublishedWithChanges';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import type { FallaktivitaetZeile } from '../../../utils/fallAktivitaetTimeline';

interface Props {
  zeile: FallaktivitaetZeile;
  onVolltext?: (zeile: FallaktivitaetZeile) => void;
  onBearbeiten?: (zeile: FallaktivitaetZeile) => void;
  onLoeschen?: (zeile: FallaktivitaetZeile) => void;
}

interface IconConfig {
  icon: ReactElement;
  bg: string;
  color: string;
}

function getIconConfig(z: FallaktivitaetZeile): IconConfig {
  if (z.quelle === 'schriftverkehr') {
    return { icon: <MailOutlineIcon sx={{ fontSize: 16 }} />, bg: '#EFF6FF', color: '#2563EB' };
  }
  if (z.quelle === 'upload') {
    return { icon: <FileUploadIcon sx={{ fontSize: 16 }} />, bg: '#F0FDF4', color: '#16A34A' };
  }
  if (z.quelle === 'pdf') {
    return { icon: <PictureAsPdfIcon sx={{ fontSize: 16 }} />, bg: '#FFF1F2', color: '#E11D48' };
  }
  if (z.quelle === 'legacy_notiz') {
    return { icon: <EditNoteIcon sx={{ fontSize: 16 }} />, bg: '#FFF7ED', color: '#EA580C' };
  }
  if (z.quelle === 'gespeichert') {
    switch (z.gespeichertTyp) {
      case 'notiz':
        return { icon: <EditNoteIcon sx={{ fontSize: 16 }} />, bg: '#FFF7ED', color: '#EA580C' };
      case 'anruf':
        return { icon: <PhoneIcon sx={{ fontSize: 16 }} />, bg: '#EFF6FF', color: '#2563EB' };
      case 'phase_geaendert':
        return { icon: <SwapHorizIcon sx={{ fontSize: 16 }} />, bg: '#FAF5FF', color: '#7C3AED' };
      case 'status_geaendert':
        return { icon: <PublishedWithChangesIcon sx={{ fontSize: 16 }} />, bg: '#FFFBEB', color: '#D97706' };
      case 'wiedervorlage':
        return { icon: <EventAvailableIcon sx={{ fontSize: 16 }} />, bg: '#F0FDF4', color: '#16A34A' };
      default:
        return { icon: <EditNoteIcon sx={{ fontSize: 16 }} />, bg: '#F8FAFC', color: '#64748B' };
    }
  }
  return { icon: <EditNoteIcon sx={{ fontSize: 16 }} />, bg: '#F8FAFC', color: '#64748B' };
}

function formatZeitpunkt(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffTage = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const zeit = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    if (diffTage === 0) return `Heute, ${zeit}`;
    if (diffTage === 1) return `Gestern, ${zeit}`;
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) + `, ${zeit}`;
  } catch {
    return iso;
  }
}

export default function FallaktivitaetListenZeile({ zeile: z, onVolltext, onBearbeiten, onLoeschen }: Props) {
  const { icon, bg, color } = getIconConfig(z);

  const textNurImDialog =
    z.quelle === 'legacy_notiz' ||
    (z.quelle === 'gespeichert' && (z.gespeichertTyp === 'notiz' || z.gespeichertTyp === 'anruf'));
  const klickbar = Boolean(textNurImDialog && z.beschreibung?.trim() && onVolltext);
  const kannBearbeiten = Boolean(z.gespeichertAktivitaetId && onBearbeiten && onLoeschen);

  const isNotizZitat =
    z.quelle === 'gespeichert' && z.gespeichertTyp === 'notiz' && z.beschreibung?.trim();

  const content = (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      {/* Icon-Avatar */}
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: bg,
          color,
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        {icon}
      </Avatar>

      {/* Text-Block */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {/* Titel + Datum */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ lineHeight: 1.4, flex: 1, minWidth: 0 }}
          >
            {z.titel}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap', flexShrink: 0, mt: 0.15, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatZeitpunkt(z.zeitpunkt)}
          </Typography>
        </Stack>

        {/* Beschreibung */}
        {z.beschreibung?.trim() && (
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{
              mt: 0.4,
              lineHeight: 1.55,
              ...(textNurImDialog ? {
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical' as const,
                wordBreak: 'break-word' as const,
              } : {}),
              ...(isNotizZitat ? {
                fontStyle: 'italic',
                '&::before': { content: '"\u201e"' },
                '&::after': { content: '"\u201c"' },
              } : {}),
            }}
          >
            {z.beschreibung.trim()}
          </Typography>
        )}
      </Box>

      {/* Aktions-Buttons (Bearbeiten / Löschen) */}
      {kannBearbeiten && (
        <Stack direction="row" spacing={0.25} flexShrink={0} sx={{ mt: -0.25 }}>
          <Tooltip title="Bearbeiten">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onBearbeiten?.(z); }}
              sx={{ opacity: 0, '.MuiBox-root:hover &': { opacity: 1 }, transition: 'opacity .15s' }}
            >
              <EditOutlinedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Löschen">
            <IconButton
              size="small"
              color="error"
              onClick={(e) => { e.stopPropagation(); onLoeschen?.(z); }}
              sx={{ opacity: 0, '.MuiBox-root:hover &': { opacity: 1 }, transition: 'opacity .15s' }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Stack>
  );

  const cardSx = {
    px: 1.5,
    py: 1.25,
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    cursor: klickbar ? 'pointer' : 'default',
    transition: 'background-color .15s',
    '&:hover': klickbar ? { bgcolor: 'action.hover' } : {},
    position: 'relative' as const,
    '&:hover .action-btn': { opacity: 1 },
  };

  if (klickbar) {
    return (
      <Box
        sx={cardSx}
        onClick={() => onVolltext?.(z)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onVolltext?.(z); }}
      >
        {content}
      </Box>
    );
  }

  return <Box sx={cardSx}>{content}</Box>;
}
