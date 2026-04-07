import { Chip, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { fristDringlichkeit, formatVerbleibendeTage, verbleibendeTage } from '../../utils/fristBerechnung';

interface FristBadgeProps {
  fristEnde: string;
  label?: string;
  size?: 'small' | 'medium';
}

export default function FristBadge({ fristEnde, label, size = 'small' }: FristBadgeProps) {
  const dringlichkeit = fristDringlichkeit(fristEnde);
  const tage = verbleibendeTage(fristEnde);
  const text = label ?? formatVerbleibendeTage(tage);

  const config = {
    kritisch: {
      color: 'error' as const,
      icon: <ErrorIcon fontSize="small" />,
    },
    warnung: {
      color: 'warning' as const,
      icon: <WarningAmberIcon fontSize="small" />,
    },
    normal: {
      color: 'success' as const,
      icon: <AccessTimeIcon fontSize="small" />,
    },
    abgelaufen: {
      color: 'default' as const,
      icon: <CheckCircleOutlineIcon fontSize="small" />,
    },
  };

  const { color, icon } = config[dringlichkeit];

  return (
    <Tooltip title={`Frist: ${new Date(fristEnde).toLocaleDateString('de-DE')}`}>
      <Chip
        icon={icon}
        label={text}
        color={color}
        size={size}
        variant={dringlichkeit === 'kritisch' ? 'filled' : 'outlined'}
      />
    </Tooltip>
  );
}
