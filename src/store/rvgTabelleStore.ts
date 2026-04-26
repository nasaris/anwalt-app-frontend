/**
 * rvgTabelleStore — versionierte RVG Anlage-2-Gebührentabellen
 *
 * Die aktive Tabelle wird für alle Gebührenberechnungen verwendet.
 * Neue Tabellen (z. B. nach einer Gesetzesänderung) können in den
 * Einstellungen hinterlegt und als aktiv gesetzt werden.
 */
import { create } from 'zustand';
import type { RvgTabelle, RvgTabelleEintrag } from '../types';

// ── Eingebettete Standardtabelle (Stand BGBl. 2025 I Nr. 109) ──
export const STANDARD_TABELLE_2025: RvgTabelleEintrag[] = [
  { bis: 500,    gebuehr: 51.50 },
  { bis: 1000,   gebuehr: 93.00 },
  { bis: 1500,   gebuehr: 134.50 },
  { bis: 2000,   gebuehr: 176.00 },
  { bis: 3000,   gebuehr: 235.50 },
  { bis: 4000,   gebuehr: 295.00 },
  { bis: 5000,   gebuehr: 354.50 },
  { bis: 6000,   gebuehr: 414.00 },
  { bis: 7000,   gebuehr: 473.50 },
  { bis: 8000,   gebuehr: 533.00 },
  { bis: 9000,   gebuehr: 592.50 },
  { bis: 10000,  gebuehr: 652.00 },
  { bis: 13000,  gebuehr: 707.00 },
  { bis: 16000,  gebuehr: 762.00 },
  { bis: 19000,  gebuehr: 817.00 },
  { bis: 22000,  gebuehr: 872.00 },
  { bis: 25000,  gebuehr: 927.00 },
  { bis: 30000,  gebuehr: 1013.00 },
  { bis: 35000,  gebuehr: 1099.00 },
  { bis: 40000,  gebuehr: 1185.00 },
  { bis: 45000,  gebuehr: 1271.00 },
  { bis: 50000,  gebuehr: 1357.00 },
  { bis: 65000,  gebuehr: 1456.50 },
  { bis: 80000,  gebuehr: 1556.00 },
  { bis: 95000,  gebuehr: 1655.50 },
  { bis: 110000, gebuehr: 1755.00 },
  { bis: 125000, gebuehr: 1854.50 },
  { bis: 140000, gebuehr: 1954.00 },
  { bis: 155000, gebuehr: 2053.50 },
  { bis: 170000, gebuehr: 2153.00 },
  { bis: 185000, gebuehr: 2252.50 },
  { bis: 200000, gebuehr: 2352.00 },
  { bis: 230000, gebuehr: 2492.00 },
  { bis: 260000, gebuehr: 2632.00 },
  { bis: 290000, gebuehr: 2772.00 },
  { bis: 320000, gebuehr: 2912.00 },
  { bis: 350000, gebuehr: 3052.00 },
  { bis: 380000, gebuehr: 3192.00 },
  { bis: 410000, gebuehr: 3332.00 },
  { bis: 440000, gebuehr: 3472.00 },
  { bis: 470000, gebuehr: 3612.00 },
  { bis: 500000, gebuehr: 3752.00 },
];

const STANDARD_VERSION = '2025-06-01';

const STANDARD_RVG_TABELLE: RvgTabelle = {
  version: STANDARD_VERSION,
  bezeichnung: 'ab 01.06.2025',
  gueltigAb: '2025-06-01',
  eintraege: STANDARD_TABELLE_2025,
};

interface RvgTabelleStore {
  tabellen: RvgTabelle[];
  aktiveVersion: string;

  getAktiv: () => RvgTabelle;
  addTabelle: (t: RvgTabelle) => void;
  updateTabelle: (version: string, updates: Partial<Omit<RvgTabelle, 'version'>>) => void;
  deleteTabelle: (version: string) => void;
  setAktiv: (version: string) => void;

  // Bulk-Hydration aus Settings
  setFromSettings: (tabellen: RvgTabelle[], aktiveVersion: string) => void;
}

export const useRvgTabelleStore = create<RvgTabelleStore>((set, get) => ({
  tabellen: [STANDARD_RVG_TABELLE],
  aktiveVersion: STANDARD_VERSION,

  getAktiv: () => {
    const { tabellen, aktiveVersion } = get();
    return tabellen.find((t) => t.version === aktiveVersion) ?? STANDARD_RVG_TABELLE;
  },

  addTabelle: (t) =>
    set((s) => {
      // Überschreibt bestehende Version falls gleiche version ID
      const ohne = s.tabellen.filter((x) => x.version !== t.version);
      return { tabellen: [...ohne, t] };
    }),

  updateTabelle: (version, updates) =>
    set((s) => ({
      tabellen: s.tabellen.map((t) =>
        t.version === version ? { ...t, ...updates } : t,
      ),
    })),

  deleteTabelle: (version) =>
    set((s) => {
      // Standard-Tabelle darf nicht gelöscht werden
      if (version === STANDARD_VERSION) return s;
      const tabellen = s.tabellen.filter((t) => t.version !== version);
      const aktiveVersion =
        s.aktiveVersion === version ? STANDARD_VERSION : s.aktiveVersion;
      return { tabellen, aktiveVersion };
    }),

  setAktiv: (version) => set({ aktiveVersion: version }),

  setFromSettings: (tabellen, aktiveVersion) => {
    // Standardtabelle immer einschließen
    const hatStandard = tabellen.some((t) => t.version === STANDARD_VERSION);
    const merged = hatStandard
      ? tabellen
      : [STANDARD_RVG_TABELLE, ...tabellen];
    set({ tabellen: merged, aktiveVersion });
  },
}));
