import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BriefDaten } from '../utils/briefDruck';

export interface Dokument {
  id: string;
  fallId: string;
  dateiname: string;        // z.B. "Brief_AZ-VR-001_25-03-2026.pdf"
  betreff: string;
  datum: string;            // ISO date
  erstelltAm: string;       // ISO date
  empfaengerName?: string;
  empfaengerEmail?: string;
  briefDaten: BriefDaten;   // zum erneuten Herunterladen
}

export type DateiKategorie =
  | 'gutachten'
  | 'rechnung'
  | 'rechnung_werkstatt'
  | 'messwerk'
  | 'foto'
  | 'sonstiges'
  | string;

export interface UploadedDatei {
  id: string;
  fallId: string;
  dateiname: string;
  dateityp: string;         // MIME type
  groesse: number;          // bytes
  hochgeladenAm: string;    // ISO date
  kategorie: DateiKategorie;
  /** Für Inline-Vorschau im Dialog (optional, v. a. bei älteren Einträgen nicht vorhanden) */
  dataUrl?: string;
}

interface DokumenteStore {
  dokumente: Dokument[];
  addDokument: (dok: Omit<Dokument, 'id' | 'erstelltAm'>) => Dokument;
  deleteDokument: (id: string) => void;
  getDokumenteByFall: (fallId: string) => Dokument[];

  uploadedDateien: UploadedDatei[];
  addUploadedDateien: (dateien: Omit<UploadedDatei, 'id' | 'hochgeladenAm'>[]) => UploadedDatei[];
  deleteUploadedDatei: (id: string) => void;
  getUploadedDateienByFall: (fallId: string) => UploadedDatei[];
}

export const useDokumenteStore = create<DokumenteStore>()(
  persist(
    (set, get) => ({
      dokumente: [],
      addDokument: (dok) => {
        const newDok: Dokument = {
          ...dok,
          id: crypto.randomUUID(),
          erstelltAm: new Date().toISOString(),
        };
        set((s) => ({ dokumente: [newDok, ...s.dokumente] }));
        return newDok;
      },
      deleteDokument: (id) =>
        set((s) => ({ dokumente: s.dokumente.filter((d) => d.id !== id) })),
      getDokumenteByFall: (fallId) =>
        get().dokumente.filter((d) => d.fallId === fallId),

      uploadedDateien: [],
      addUploadedDateien: (dateien) => {
        const now = new Date().toISOString();
        const neu = dateien.map((d) => ({ ...d, id: crypto.randomUUID(), hochgeladenAm: now }));
        set((s) => ({ uploadedDateien: [...neu, ...s.uploadedDateien] }));
        return neu;
      },
      deleteUploadedDatei: (id) =>
        set((s) => ({ uploadedDateien: s.uploadedDateien.filter((d) => d.id !== id) })),
      getUploadedDateienByFall: (fallId) =>
        get().uploadedDateien.filter((d) => d.fallId === fallId),
    }),
    { name: 'anwalt-dokumente' },
  ),
);
