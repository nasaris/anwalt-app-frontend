import type { ThemeTokens } from './tokens';

export type JuristPalette = ThemeTokens;

declare module '@mui/material/styles' {
  interface Palette {
    jurist: JuristPalette;
  }
  interface PaletteOptions {
    jurist?: Partial<JuristPalette>;
  }
}

export {};
