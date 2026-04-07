import { useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

interface Props {
  kennzeichen: string;
  size?: 'small' | 'medium';
}

/** Deutsches Kfz-Kennzeichen als visuelles Schild */
export default function KennzeichenSchild({ kennzeichen, size = 'medium' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(kennzeichen.toUpperCase()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  const isSmall = size === 'small';
  const height = isSmall ? 28 : 38;
  const fontSize = isSmall ? '0.7rem' : '1rem';
  const stripWidth = isSmall ? 20 : 26;
  const dFontSize = isSmall ? '0.6rem' : '0.8rem';

  return (
    <Tooltip title={copied ? 'Kopiert!' : 'Kennzeichen kopieren'} placement="top">
    <Box
      onClick={handleCopy}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        height,
        border: '2px solid #1a1a1a',
        borderRadius: '4px',
        overflow: 'hidden',
        bgcolor: '#ffffff',
        boxShadow: copied ? '0 0 0 2px #1976d2' : '0 1px 4px rgba(0,0,0,0.18)',
        userSelect: 'none',
        flexShrink: 0,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* EU-Streifen (blau) — nur D */}
      <Box
        sx={{
          width: stripWidth,
          height: '100%',
          bgcolor: '#003399',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: '#ffffff',
            fontSize: dFontSize,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '0.05em',
          }}
        >
          D
        </Typography>
      </Box>

      {/* Kennzeichen-Text */}
      <Box
        sx={{
          px: isSmall ? 1 : 1.5,
          display: 'flex',
          alignItems: 'center',
          height: '100%',
        }}
      >
        <Box
          component="span"
          sx={{
            fontSize,
            fontWeight: 900,
            // FE-Schrift Annäherung: DIN Alternate (macOS built-in) → Arial Narrow als Fallback
            fontFamily: '"DIN Alternate", "DIN 1451 Engschrift", "Arial Narrow", "Helvetica Neue", Arial, sans-serif',
            letterSpacing: '0.12em',
            // Horizontale Stauchung wie FE-Schrift (~85% Breite)
            display: 'inline-block',
            transform: 'scaleX(0.88)',
            transformOrigin: 'left center',
            color: '#000000',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            // Leichter Umriss für Plattenoptik
            WebkitTextStroke: '0.3px #000',
          }}
        >
          {kennzeichen.toUpperCase()}
        </Box>
      </Box>
    </Box>
    </Tooltip>
  );
}
