/**
 * Axios-Instanz — zentraler HTTP-Client
 *
 * DSGVO: Basis-URL aus Umgebungsvariable, kein Logging von Response-Daten.
 *
 * Lokales Setup (Seite z. B. localhost:5173, API in VITE_API_URL auf localhost:8787):
 * immer relative URLs (`/api/…`) — gleicher Origin wie die App, Vite proxyt (vite.config.ts).
 * So bleibt connect-src 'self' gültig und es gibt keine CSP-Verstöße gegen einen zweiten Port.
 *
 * Nur wenn Frontend und API wirklich auf demselben Origin liegen oder die API ein anderer
 * Host ist, wird VITE_API_URL verwendet.
 */
import axios from 'axios';

/** @see https://vitejs.dev/guide/env-and-mode.html — nicht in jedem Kontext zuverlässig. */
function normalizeLocalhost(hostname: string): string {
  if (hostname === 'localhost' || hostname === '127.0.0.1') return '__local__';
  return hostname;
}

/**
 * Erzwingt Same-Origin-Pfade für typisches lokales Dev/Preview (unterschiedliche Ports),
 * unabhängig von `import.meta.env.DEV` und eingebettetem VITE_API_URL.
 */
function resolveApiBaseURL(): string {
  const envUrl = (import.meta.env.VITE_API_URL ?? '').trim();
  if (!envUrl) return '';

  if (typeof window === 'undefined') {
    return envUrl;
  }

  try {
    const page = new URL(window.location.href);
    const api = new URL(envUrl);
    const sameLoopback =
      normalizeLocalhost(page.hostname) === normalizeLocalhost(api.hostname);
    if (sameLoopback && api.port !== page.port) {
      return '';
    }
  } catch {
    return envUrl;
  }

  return envUrl;
}

const baseURL = resolveApiBaseURL();

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Für HttpOnly-Cookie-Auth im echten Backend
});

export default client;
