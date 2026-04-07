/**
 * DSGVO-Hinweis:
 * - Keine externen Dienste (kein Google Fonts CDN, kein Analytics)
 * - Schriftarten: self-hosted via @fontsource (bundled, kein Request an Dritte)
 * - MSW interceptiert alle /api/* Calls — kein echter Server erforderlich
 * - Beim Wechsel zum Backend: enableMocking() entfernen + VITE_API_URL in .env setzen
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

async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser');
    return worker.start({
      onUnhandledRequest: 'bypass',
    });
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
