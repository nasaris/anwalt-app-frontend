import { alpha, createTheme } from '@mui/material/styles';
import { tokens, darkTokens, type ThemeTokens } from './tokens';

const inter = '"Inter", system-ui, sans-serif';

function buildTheme(t: ThemeTokens, mode: 'light' | 'dark') {
  const ghostBorder = `1px solid ${alpha(t.outlineVariant, 0.2)}`;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        dark: t.primaryDim,
        light: mode === 'dark' ? '#a8ceff' : '#2563eb',
        contrastText: t.onPrimary,
      },
      secondary: {
        main: mode === 'dark' ? '#8a9fc2' : '#515f74',
        contrastText: t.onPrimary,
      },
      error: {
        main: t.error,
        light: t.errorContainer,
        dark: mode === 'dark' ? '#c44' : '#782232',
      },
      background: {
        default: t.background,
        paper: t.surfaceContainerLowest,
      },
      text: {
        primary: t.onSurface,
        secondary: t.onSurfaceVariant,
      },
      divider: alpha(t.onSurface, mode === 'dark' ? 0.1 : 0.06),
      action: {
        hover: t.surfaceContainerLow,
        selected: alpha(t.primary, mode === 'dark' ? 0.14 : 0.08),
        disabledBackground: alpha(t.onSurface, 0.1),
      },
      jurist: { ...t },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: inter,
      h1: { fontFamily: inter, fontWeight: 600, fontSize: '24px', lineHeight: '32px', letterSpacing: '-0.02em', color: t.onSurface },
      h2: { fontFamily: inter, fontWeight: 600, fontSize: '18px', lineHeight: '28px', letterSpacing: '-0.01em', color: t.onSurface },
      h3: { fontFamily: inter, fontWeight: 600, fontSize: '16px', lineHeight: '24px', color: t.onSurface },
      h4: { fontFamily: inter, fontWeight: 700, color: t.onSurface },
      h5: { fontFamily: inter, fontWeight: 600, color: t.onSurface },
      h6: { fontFamily: inter, fontWeight: 600, color: t.onSurface },
      subtitle1: { fontWeight: 500 },
      subtitle2: { fontWeight: 500, color: t.onSurfaceVariant },
      body1: { fontWeight: 400, fontSize: '14px', lineHeight: '20px' },
      body2: { color: t.onSurfaceVariant, fontSize: '13px', lineHeight: '18px' },
      button: { fontWeight: 600, textTransform: 'none' },
      overline: { fontFamily: inter, fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', lineHeight: '16px', color: alpha(t.onSurfaceVariant, 0.85) },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.background,
            color: t.onSurface,
            colorScheme: mode,
          },
          '::selection': {
            backgroundColor: alpha(t.primary, 0.25),
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: 'none', overflow: 'hidden' },
          rounded: { borderRadius: 12 },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { borderRadius: 9999, paddingInline: 16, paddingBlock: 8 },
          containedPrimary: {
            background: t.primary,
            color: t.onPrimary,
            '&:hover': { background: alpha(t.primary, 0.88) },
            '&.Mui-disabled': {
              opacity: 1,
              cursor: 'not-allowed',
              backgroundImage: 'none',
              backgroundColor: t.surfaceContainerHigh,
              color: alpha(t.onSurface, 0.5),
              '& .MuiButton-endIcon, & .MuiButton-startIcon': { color: alpha(t.onSurface, 0.45) },
            },
          },
          containedSecondary: {
            '&.Mui-disabled': {
              opacity: 1,
              cursor: 'not-allowed',
              backgroundColor: t.surfaceContainerHigh,
              color: alpha(t.onSurface, 0.5),
              '& .MuiButton-endIcon, & .MuiButton-startIcon': { color: alpha(t.onSurface, 0.45) },
            },
          },
          outlined: {
            borderColor: alpha(t.outlineVariant, 0.45),
            '&:hover': {
              borderColor: alpha(t.outlineVariant, 0.7),
              backgroundColor: alpha(t.surfaceContainerLow, 0.6),
            },
          },
          text: { color: t.onSurfaceVariant },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 9999, fontWeight: 600, fontSize: '0.7rem' },
          colorWarning: {
            backgroundColor: alpha('#ed6c02', mode === 'dark' ? 0.2 : 0.12),
            color: mode === 'dark' ? '#ffa552' : '#8a4a00',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            color: t.onSurfaceVariant,
            '&:hover': { backgroundColor: alpha(t.surfaceContainerHigh, mode === 'dark' ? 0.6 : 0.85) },
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: t.surfaceContainerLowest,
            '& fieldset': { borderColor: alpha(t.outlineVariant, mode === 'dark' ? 0.5 : 0.9) },
            '&:hover fieldset': { borderColor: alpha(t.outlineVariant, mode === 'dark' ? 0.8 : 1) },
            '&.Mui-focused': {
              backgroundColor: t.surfaceContainerLowest,
              boxShadow: `0 0 0 1px ${alpha(t.primary, 0.35)}`,
            },
            '&.Mui-focused fieldset': { borderColor: t.primary },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${alpha(t.onSurface, mode === 'dark' ? 0.08 : 0.04)}` },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            backgroundColor: mode === 'dark'
              ? alpha(t.surfaceContainerLowest, 0.96)
              : alpha(t.surfaceContainerLowest, 0.92),
            backdropFilter: 'blur(20px)',
            border: ghostBorder,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: { backgroundImage: 'none' },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: t.surfaceContainerLow,
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': { color: t.primary },
            '&.Mui-checked + .MuiSwitch-track': { backgroundColor: alpha(t.primary, 0.7) },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: mode === 'dark' ? alpha(t.surfaceContainerHigh, 0.95) : alpha(t.inverseSurface, 0.9),
            color: mode === 'dark' ? t.onSurface : '#fff',
            fontSize: '0.72rem',
            borderRadius: 6,
          },
        },
      },
    },
  });
}

export const juristTheme = buildTheme(tokens as ThemeTokens, 'light');
export const juristDarkTheme = buildTheme(darkTokens as ThemeTokens, 'dark');
export function createJuristTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? juristDarkTheme : juristTheme;
}
