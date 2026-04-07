/**
 * Axios-Instanz — zentraler HTTP-Client
 *
 * DSGVO: Basis-URL aus Umgebungsvariable, kein Logging von Response-Daten.
 * Beim Wechsel zum echten Backend: VITE_API_URL in .env setzen.
 */
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Für HttpOnly-Cookie-Auth im echten Backend
});

export default client;
