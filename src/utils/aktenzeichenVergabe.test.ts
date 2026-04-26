import { describe, expect, it } from 'vitest';
import { naechstesAktenzeichen, parseLaufnummerNachLetztemSlash } from './aktenzeichenVergabe';

describe('parseLaufnummerNachLetztemSlash', () => {
  it('liest die Endnummer', () => {
    expect(parseLaufnummerNachLetztemSlash('VR/2025/010')).toBe(10);
    expect(parseLaufnummerNachLetztemSlash('AR/2026/009')).toBe(9);
  });

  it('ignoriert ungeeignete Werte', () => {
    expect(parseLaufnummerNachLetztemSlash('')).toBeNull();
    expect(parseLaufnummerNachLetztemSlash('ohne-slash')).toBeNull();
  });
});

describe('naechstesAktenzeichen', () => {
  it('zählt rechtsübergreifend nach dem letzten Slash', () => {
    const next = naechstesAktenzeichen(['VR/2025/010', 'AR/2025/042', 'ZR/2025/103'], 'verkehrsrecht', 2026);
    expect(next).toBe('VR/2026/104');
  });

  it('startet bei 001 ohne Bestand', () => {
    expect(naechstesAktenzeichen([], 'zivilrecht', 2026)).toBe('ZR/2026/001');
  });
});
