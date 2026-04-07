import { alpha, createTheme } from '@mui/material/styles';
import { tokens } from './tokens';

const inter = '"Inter", system-ui, sans-serif';
const manrope = '"Manrope", "Inter", system-ui, sans-serif';

const ghostBorder = `1px solid ${alpha(tokens.outlineVariant, 0.15)}`;

export const juristTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.primary,
      dark: tokens.primaryDim,
      light: '#7a7979',
      contrastText: tokens.onPrimary,
    },
    secondary: {
      main: '#5f5f5f',
      contrastText: tokens.onPrimary,
    },
    error: {
      main: tokens.error,
      light: tokens.errorContainer,
      dark: '#782232',
    },
    background: {
      default: tokens.background,
      paper: tokens.surfaceContainerLowest,
    },
    text: {
      primary: tokens.onSurface,
      secondary: tokens.onSurfaceVariant,
    },
    divider: alpha(tokens.onSurface, 0.06),
    jurist: { ...tokens },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: inter,
    h1: {
      fontFamily: manrope,
      fontWeight: 800,
      letterSpacing: '-0.02em',
      color: tokens.onSurface,
    },
    h2: {
      fontFamily: manrope,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: tokens.onSurface,
    },
    h3: {
      fontFamily: manrope,
      fontWeight: 700,
      color: tokens.onSurface,
    },
    h4: {
      fontFamily: manrope,
      fontWeight: 700,
      color: tokens.onSurface,
    },
    h5: {
      fontFamily: manrope,
      fontWeight: 600,
      color: tokens.onSurface,
    },
    h6: {
      fontFamily: manrope,
      fontWeight: 600,
      color: tokens.onSurface,
    },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, color: tokens.onSurfaceVariant },
    body1: { fontWeight: 400 },
    body2: { color: tokens.onSurfaceVariant },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
    overline: {
      fontFamily: inter,
      fontWeight: 700,
      fontSize: '0.625rem',
      letterSpacing: '0.2em',
      lineHeight: 1.6,
      color: alpha(tokens.onSurfaceVariant, 0.85),
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.background,
          color: tokens.onSurface,
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 9999,
          paddingInline: 20,
          paddingBlock: 10,
        },
        containedPrimary: {
          background: `linear-gradient(180deg, ${tokens.primary} 0%, ${tokens.primaryDim} 100%)`,
          color: tokens.onPrimary,
          '&:hover': {
            background: `linear-gradient(180deg, ${alpha(tokens.primary, 0.92)} 0%, ${alpha(
              tokens.primaryDim,
              0.95
            )} 100%)`,
          },
          /* MUI setzt bei disabled zusätzlich opacity — auf dunklem Verlauf + graue Schrift = kaum Kontrast */
          '&.Mui-disabled': {
            opacity: 1,
            cursor: 'not-allowed',
            backgroundImage: 'none',
            backgroundColor: tokens.surfaceContainerHigh,
            color: alpha(tokens.onSurface, 0.5),
            '& .MuiButton-endIcon, & .MuiButton-startIcon': {
              color: alpha(tokens.onSurface, 0.45),
            },
          },
        },
        containedSecondary: {
          '&.Mui-disabled': {
            opacity: 1,
            cursor: 'not-allowed',
            backgroundColor: tokens.surfaceContainerHigh,
            color: alpha(tokens.onSurface, 0.5),
            '& .MuiButton-endIcon, & .MuiButton-startIcon': {
              color: alpha(tokens.onSurface, 0.45),
            },
          },
        },
        outlined: {
          borderColor: alpha(tokens.outlineVariant, 0.35),
          '&:hover': {
            borderColor: alpha(tokens.outlineVariant, 0.55),
            backgroundColor: alpha(tokens.surfaceContainerLow, 0.6),
          },
        },
        text: {
          color: tokens.onSurfaceVariant,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          fontWeight: 600,
          fontSize: '0.7rem',
        },
        colorWarning: {
          backgroundColor: alpha('#ed6c02', 0.12),
          color: '#8a4a00',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 9999,
          color: tokens.onSurfaceVariant,
          '&:hover': {
            backgroundColor: alpha(tokens.surfaceContainerHigh, 0.85),
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: tokens.surfaceContainerLow,
          '& fieldset': {
            border: 'none',
          },
          '&:hover fieldset': {
            border: 'none',
          },
          '&.Mui-focused': {
            backgroundColor: tokens.surfaceContainerLowest,
            boxShadow: `0 0 0 1px ${alpha(tokens.outlineVariant, 0.15)}`,
          },
          '&.Mui-focused fieldset': {
            border: 'none',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${alpha(tokens.onSurface, 0.04)}`,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          backgroundColor: alpha(tokens.surfaceContainerLowest, 0.92),
          backdropFilter: 'blur(20px)',
          border: ghostBorder,
        },
      },
    },
  },
});
