/** DESIGN.md — Jurisprudence UI (Kern-Token) */
export const tokens = {
  background: '#f9f9ff',
  surface: '#f9f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f3ff',
  surfaceContainerHigh: '#dee8ff',
  surfaceVariant: '#d8e3fb',
  onSurface: '#111c2d',
  onSurfaceVariant: '#434655',
  primary: '#004ac6',
  primaryDim: '#003ea8',
  onPrimary: '#ffffff',
  outlineVariant: '#c3c6d7',
  inverseSurface: '#263143',
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',
} as const;

/** Dark-Mode Token-Set */
export const darkTokens = {
  background: '#0d1117',
  surface: '#0d1117',
  surfaceContainerLowest: '#161b27',
  surfaceContainerLow: '#1c2336',
  surfaceContainerHigh: '#253047',
  surfaceVariant: '#2c3954',
  onSurface: '#e2e8f5',
  onSurfaceVariant: '#9daec8',
  primary: '#7eb2ff',
  primaryDim: '#5b96f5',
  onPrimary: '#00296e',
  outlineVariant: '#3a4d68',
  inverseSurface: '#d0d9ed',
  error: '#ff8a8a',
  errorContainer: '#5c1010',
  onErrorContainer: '#ffc5c5',
} as const;

/** Breiterer Typ für die Theme-Funktion — erlaubt Light- und Dark-Tokens */
export type ThemeTokens = {
  [K in keyof typeof tokens]: string;
};
