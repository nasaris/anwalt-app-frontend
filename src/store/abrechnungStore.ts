import { create } from 'zustand';
import type { Abrechnung } from '../types';

interface AbrechnungStore {
  abrechnungen: Abrechnung[];

  // CRUD
  addAbrechnung: (a: Abrechnung) => void;
  updateAbrechnung: (id: string, updates: Partial<Abrechnung>) => void;
  deleteAbrechnung: (id: string) => void;

  // Bulk (für Persistenz-Hydration)
  setAbrechnungen: (abrechnungen: Abrechnung[]) => void;

  // Hilfsfunktionen
  getByFallId: (fallId: string) => Abrechnung[];
  naechsteRechnungsNummer: (jahr?: number) => string;
}

export const useAbrechnungStore = create<AbrechnungStore>((set, get) => ({
  abrechnungen: [],

  addAbrechnung: (a) =>
    set((s) => ({ abrechnungen: [...s.abrechnungen, a] })),

  updateAbrechnung: (id, updates) =>
    set((s) => ({
      abrechnungen: s.abrechnungen.map((a) =>
        a.id === id ? { ...a, ...updates } : a,
      ),
    })),

  deleteAbrechnung: (id) =>
    set((s) => ({
      abrechnungen: s.abrechnungen.filter((a) => a.id !== id),
    })),

  setAbrechnungen: (abrechnungen) => set({ abrechnungen }),

  getByFallId: (fallId) =>
    get().abrechnungen.filter((a) => a.fallId === fallId),

  naechsteRechnungsNummer: (jahr) => {
    const y = jahr ?? new Date().getFullYear();
    const vorjahr = get().abrechnungen.filter((a) =>
      a.rechnungsNummer.startsWith(`${y}-`),
    );
    const maxNr = vorjahr.reduce((max, a) => {
      const parts = a.rechnungsNummer.split('-');
      const nr = parseInt(parts[parts.length - 1] ?? '0', 10);
      return Math.max(max, nr);
    }, 0);
    return `${y}-${String(maxNr + 1).padStart(3, '0')}`;
  },
}));
