import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KanzleiDaten {
  kanzleiName: string;
  anwaltName: string;      // z.B. "Rechtsanwalt Max Mustermann"
  anwaltTitel: string;     // z.B. "Rechtsanwalt"
  strasse: string;
  plzOrt: string;
  telefon: string;
  fax: string;
  email: string;
  website: string;
  bankName: string;
  iban: string;
  bic: string;
  steuernummer: string;
  ustIdNr: string;
  unterschriftBild?: string;  // base64 data URL (PNG)
  // Profil-Felder
  anwaltVorname?: string;
  anwaltNachname?: string;
  anwaltEmail?: string;       // persönliche E-Mail (vs. Kanzlei-E-Mail)
  anwaltTelefon?: string;     // direkte Durchwahl
  zulassungsnummer?: string;  // Zulassungsnummer Rechtsanwaltskammer
  spezialisierungen?: string[]; // z.B. ["Verkehrsrecht", "Arbeitsrecht"]
  /** Briefkopf (PDF): ÖPNV-Linien, z. B. „58, 68, 132“ */
  briefkopfOepnvLinien?: string;
  /** Briefkopf (PDF): Haltestelle, z. B. „(Haltestelle Baldeplatz)“ */
  briefkopfOepnvHaltestelle?: string;
}

const DEFAULTS: KanzleiDaten = {
  kanzleiName: 'Rechtsanwaltskanzlei [Name]',
  anwaltName: 'Rechtsanwalt [Vorname Nachname]',
  anwaltTitel: 'Rechtsanwalt',
  strasse: 'Musterstraße 1',
  plzOrt: '12345 Musterstadt',
  telefon: '+49 (0) 000 000000',
  fax: '+49 (0) 000 000001',
  email: 'kanzlei@example.de',
  website: 'www.example.de',
  bankName: '',
  iban: '',
  bic: '',
  steuernummer: '',
  ustIdNr: '',
};

interface KanzleiStore {
  daten: KanzleiDaten;
  setDaten: (d: Partial<KanzleiDaten>) => void;
}

export const useKanzleiStore = create<KanzleiStore>()(
  persist(
    (set) => ({
      daten: DEFAULTS,
      setDaten: (d) => set((s) => ({ daten: { ...s.daten, ...d } })),
    }),
    { name: 'kanzlei-einstellungen' }
  )
);
