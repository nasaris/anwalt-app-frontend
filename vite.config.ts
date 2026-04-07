import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * DSGVO-Konfiguration:
 * - Content-Security-Policy: Keine externen Quellen erlaubt
 * - Fonts werden lokal geladen (kein Google Fonts CDN)
 * - Kein Tracking, keine Drittanbieter
 */
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // CSP: Alles nur von gleicher Origin erlaubt (DSGVO-konform)
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",  // 'unsafe-inline' für Vite HMR in dev
        "style-src 'self' 'unsafe-inline'",    // MUI emotion styles brauchen inline
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    },
    proxy: {
      // Für echtes Backend: VITE_API_URL setzen
      // '/api': { target: process.env.VITE_API_URL, changeOrigin: true }
    },
  },
});
