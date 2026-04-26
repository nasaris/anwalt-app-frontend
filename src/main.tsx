/**
 * DSGVO-Hinweis:
 * - Keine externen Dienste (kein Google Fonts CDN, kein Analytics)
 * - Schriftarten: self-hosted via @fontsource (bundled, kein Request an Dritte)
 * - API läuft lokal (SQLite) im Backend
 */
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
