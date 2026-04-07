import type { tokens } from './tokens';

export type JuristPalette = typeof tokens;

declare module '@mui/material/styles' {
  interface Palette {
    jurist: JuristPalette;
  }
  interface PaletteOptions {
    jurist?: Partial<JuristPalette>;
  }
}

export {};
