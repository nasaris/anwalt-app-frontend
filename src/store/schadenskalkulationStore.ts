import { create } from 'zustand';
import type { Schadenskalkulation } from '../types';

interface SchadenskalkulationStore {
  kalkulationen: Schadenskalkulation[];
  addKalkulation: (k: Schadenskalkulation) => void;
  updateKalkulation: (id: string, updates: Partial<Schadenskalkulation>) => void;
  deleteKalkulation: (id: string) => void;
  getByFallId: (fallId: string) => Schadenskalkulation[];
  setKalkulationen: (k: Schadenskalkulation[]) => void;
}

export const useSchadenskalkulationStore = create<SchadenskalkulationStore>((set, get) => ({
  kalkulationen: [],

  addKalkulation: (k) =>
    set((s) => ({ kalkulationen: [...s.kalkulationen, k] })),

  updateKalkulation: (id, updates) =>
    set((s) => ({
      kalkulationen: s.kalkulationen.map((k) =>
        k.id === id ? { ...k, ...updates } : k,
      ),
    })),

  deleteKalkulation: (id) =>
    set((s) => ({ kalkulationen: s.kalkulationen.filter((k) => k.id !== id) })),

  getByFallId: (fallId) =>
    get().kalkulationen.filter((k) => k.fallId === fallId),

  setKalkulationen: (kalkulationen) => set({ kalkulationen }),
}));
