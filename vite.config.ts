import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * DSGVO-Konfiguration:
 * - Content-Security-Policy: Keine externen Quellen erlaubt
 * - Fonts werden lokal geladen (kein Google Fonts CDN)
 * - Kein Tracking, keine Drittanbieter
 *
 * Lokales Backend: Anfragen gehen über denselben Origin (/api → Proxy),
 * damit connect-src 'self' ausreicht (kein zweiter Host in der CSP nötig).
 * Optional weiterhin direktes Backend über VITE_API_URL=http://localhost:8787.
 */
const DEV_BACKEND = 'http://127.0.0.1:8787';

const securityHeaders = {
  // CSP: gleiche Origin + optional direktes Backend (falls VITE_API_URL gesetzt)
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // 'unsafe-inline' für Vite HMR in dev
    "style-src 'self' 'unsafe-inline'", // MUI emotion styles brauchen inline
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' ws: wss: http://localhost:8787 http://127.0.0.1:8787",
    "frame-src 'self' blob:",
    "frame-ancestors 'self'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer',
} as const;

const apiProxy = {
  '/api': {
    target: DEV_BACKEND,
    changeOrigin: true,
  },
} as const;

export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders,
    proxy: apiProxy,
  },
  preview: {
    headers: securityHeaders,
    proxy: apiProxy,
  },
});
