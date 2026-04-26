import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Typography, Button } from '@mui/material';
import AppLayout from './components/Layout/AppLayout';
import { createJuristTheme } from './theme/juristTheme';
import { ColorModeProvider, useColorMode } from './theme/ColorModeContext';
import Dashboard from './pages/Dashboard/Dashboard';
import Faelle from './pages/Faelle/Faelle';
import FallDetail from './pages/FallDetail/FallDetail';
import FallNeu from './pages/FallNeu/FallNeu';
import Mandanten from './pages/Mandanten/Mandanten';
import MandantenDetail from './pages/Mandanten/MandantenDetail';
import Parteien from './pages/Parteien/Parteien';
import ParteiDetail from './pages/Parteien/ParteiDetail';
import Kalender from './pages/Kalender/Kalender';
import Einstellungen from './pages/Einstellungen/Einstellungen';
import Verwaltung from './pages/Verwaltung/Verwaltung';
import Abrechnung from './pages/Abrechnung/Abrechnung';
import { getSettings, putSettings } from './api/settings';
import { useKanzleiStore } from './store/kanzleiStore';
import { useAufgabenStore } from './store/aufgabenStore';
import { useVorlagenStore } from './store/vorlagenStore';
import { useDokumenteStore } from './store/dokumenteStore';
import { useAbrechnungStore } from './store/abrechnungStore';
import { useRvgTabelleStore } from './store/rvgTabelleStore';
import { useSchadenskalkulationStore } from './store/schadenskalkulationStore';
import type { Abrechnung as AbrechnungTyp, RvgTabelle, Schadenskalkulation } from './types';

type KanzleiState = { daten: unknown };
type AufgabenPersistSlice = Pick<
  ReturnType<typeof useAufgabenStore.getState>,
  | 'bundledSystemAufgaben'
  | 'bundledPhaseLabels'
  | 'customAufgaben'
  | 'deaktiviertIds'
  | 'erledigtProFall'
  | 'fallAufgabenMeta'
  | 'systemOverrides'
  | 'phasenNummern'
  | 'phaseLabelOverrides'
>;
type VorlagenPersistSlice = Pick<
  ReturnType<typeof useVorlagenStore.getState>,
  | 'bundledSystemTypen'
  | 'bundledSystemTextvorlagen'
  | 'bundledDefaultPhaseMapping'
  | 'typLabelOverrides'
  | 'typAktivOverrides'
  | 'typSystemOverrides'
  | 'removedSystemTypIds'
  | 'customTypen'
  | 'vorlagen'
  | 'systemVorlageOverrides'
  | 'removedSystemVorlageIds'
  | 'textBausteine'
  | 'phaseMappingOverrides'
>;
type DokumentePersistSlice = Pick<ReturnType<typeof useDokumenteStore.getState>, 'dokumente' | 'uploadedDateien'>;
type AbrechnungPersistSlice = { abrechnungen: AbrechnungTyp[] };
type RvgTabellePersistSlice = { tabellen: RvgTabelle[]; aktiveVersion: string };
type SchadenskalkulationPersistSlice = { kalkulationen: Schadenskalkulation[] };

function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number): T {
  let t: number | undefined;
  return ((...args: any[]) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), waitMs);
  }) as T;
}

function readPersistedState(name: string): unknown | null {
  try {
    const raw = window.localStorage.getItem(name);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: unknown } | unknown;
    if (parsed && typeof parsed === 'object' && 'state' in (parsed as any)) {
      return (parsed as any).state ?? null;
    }
    return parsed ?? null;
  } catch {
    return null;
  }
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <Box textAlign="center" py={10}>
      <Typography variant="h4" fontWeight={700} gutterBottom>404</Typography>
      <Typography color="text.secondary" gutterBottom>Seite nicht gefunden.</Typography>
      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
        Zum Dashboard
      </Button>
    </Box>
  );
}

function AppWithTheme() {
  const { mode } = useColorMode();
  const theme = createJuristTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppInner />
    </ThemeProvider>
  );
}

function AppInner() {
  useEffect(() => {
    let alive = true;

    async function hydrate() {
      const [kanzlei, aufgaben, vorlagen, dokumente, abrechnung, rvgTabellen, schadenskalkulation] = await Promise.all([
        getSettings<KanzleiState['daten']>('kanzlei'),
        getSettings<AufgabenPersistSlice>('aufgaben'),
        getSettings<VorlagenPersistSlice>('vorlagen'),
        getSettings<DokumentePersistSlice>('dokumente'),
        getSettings<AbrechnungPersistSlice>('abrechnung'),
        getSettings<RvgTabellePersistSlice>('rvgTabellen'),
        getSettings<SchadenskalkulationPersistSlice>('schadenskalkulation'),
      ]);
      if (!alive) return;

      // Einmalige Migration: alte zustand/persist-LocalStorage Werte ins Backend übernehmen
      const migrationFlag = 'anwalt-migration-settings-v1';
      const alreadyMigrated = window.localStorage.getItem(migrationFlag) === 'done';
      if (!alreadyMigrated) {
        const legacyKanzlei = readPersistedState('kanzlei-einstellungen') as { daten?: unknown } | null;
        const legacyAufgaben = readPersistedState('jurist-aufgaben') as Partial<AufgabenPersistSlice> | null;
        const legacyVorlagen = readPersistedState('jurist-vorlagen') as Partial<VorlagenPersistSlice> | null;
        const legacyDokumente = readPersistedState('anwalt-dokumente') as Partial<DokumentePersistSlice> | null;

        const writes: Promise<unknown>[] = [];
        if (!kanzlei && legacyKanzlei?.daten) writes.push(putSettings('kanzlei', legacyKanzlei.daten));
        if (!aufgaben && legacyAufgaben) {
          const curA = useAufgabenStore.getState();
          const payload: AufgabenPersistSlice = {
            bundledSystemAufgaben: curA.bundledSystemAufgaben,
            bundledPhaseLabels: curA.bundledPhaseLabels,
            customAufgaben: (legacyAufgaben.customAufgaben ?? []) as any,
            deaktiviertIds: (legacyAufgaben.deaktiviertIds ?? []) as any,
            erledigtProFall: (legacyAufgaben.erledigtProFall ?? {}) as any,
            fallAufgabenMeta: ((legacyAufgaben as { fallAufgabenMeta?: unknown }).fallAufgabenMeta ?? {}) as any,
            systemOverrides: (legacyAufgaben.systemOverrides ?? {}) as any,
            phasenNummern: (legacyAufgaben.phasenNummern ?? {}) as any,
            phaseLabelOverrides: (legacyAufgaben.phaseLabelOverrides ?? {}) as any,
          };
          writes.push(putSettings('aufgaben', payload));
        }
        if (!vorlagen && legacyVorlagen) {
          const curV = useVorlagenStore.getState();
          const payload: VorlagenPersistSlice = {
            bundledSystemTypen: curV.bundledSystemTypen,
            bundledSystemTextvorlagen: curV.bundledSystemTextvorlagen,
            bundledDefaultPhaseMapping: curV.bundledDefaultPhaseMapping,
            typLabelOverrides: (legacyVorlagen.typLabelOverrides ?? {}) as any,
            typAktivOverrides: (legacyVorlagen.typAktivOverrides ?? {}) as any,
            typSystemOverrides: (legacyVorlagen.typSystemOverrides ?? {}) as any,
            removedSystemTypIds: (legacyVorlagen.removedSystemTypIds ?? []) as any,
            customTypen: (legacyVorlagen.customTypen ?? []) as any,
            vorlagen: (legacyVorlagen.vorlagen ?? []) as any,
            systemVorlageOverrides: (legacyVorlagen.systemVorlageOverrides ?? {}) as any,
            removedSystemVorlageIds: (legacyVorlagen.removedSystemVorlageIds ?? []) as any,
            textBausteine: (legacyVorlagen.textBausteine ?? []) as any,
            phaseMappingOverrides: (legacyVorlagen.phaseMappingOverrides ?? {}) as any,
          };
          writes.push(putSettings('vorlagen', payload));
        }
        if (!dokumente && legacyDokumente) {
          const payload: DokumentePersistSlice = {
            dokumente: (legacyDokumente.dokumente ?? []) as any,
            uploadedDateien: (legacyDokumente.uploadedDateien ?? []) as any,
          };
          writes.push(putSettings('dokumente', payload));
        }

        if (writes.length > 0) {
          try {
            await Promise.all(writes);
            window.localStorage.removeItem('kanzlei-einstellungen');
            window.localStorage.removeItem('jurist-aufgaben');
            window.localStorage.removeItem('jurist-vorlagen');
            window.localStorage.removeItem('anwalt-dokumente');
            window.localStorage.setItem(migrationFlag, 'done');
          } catch {
            // Backend nicht erreichbar → nichts löschen, später erneut versuchen
          }
        } else {
          window.localStorage.setItem(migrationFlag, 'done');
        }
      }

      // Danach: Settings aus Backend anwenden (oder Fallback: alte LocalStorage Werte wenn Backend leer)
      const kFinal = kanzlei ?? ((readPersistedState('kanzlei-einstellungen') as any)?.daten ?? null);
      const aFinal = aufgaben ?? (readPersistedState('jurist-aufgaben') as any);
      const vFinal = vorlagen ?? (readPersistedState('jurist-vorlagen') as any);
      const dFinal = dokumente ?? (readPersistedState('anwalt-dokumente') as any);

      if (kFinal) useKanzleiStore.setState({ daten: kFinal as any });

      if (aFinal) {
        const incoming = aFinal as Partial<AufgabenPersistSlice>;
        const cur = useAufgabenStore.getState();
        useAufgabenStore.setState({
          ...(incoming as any),
          bundledSystemAufgaben:
            incoming.bundledSystemAufgaben && incoming.bundledSystemAufgaben.length > 0
              ? incoming.bundledSystemAufgaben
              : cur.bundledSystemAufgaben,
          bundledPhaseLabels:
            incoming.bundledPhaseLabels && Object.keys(incoming.bundledPhaseLabels).length > 0
              ? incoming.bundledPhaseLabels
              : cur.bundledPhaseLabels,
        });
      }

      if (vFinal) {
        const incoming = vFinal as Partial<VorlagenPersistSlice>;
        const cur = useVorlagenStore.getState();
        useVorlagenStore.setState({
          ...(incoming as any),
          bundledSystemTypen:
            incoming.bundledSystemTypen && incoming.bundledSystemTypen.length > 0
              ? incoming.bundledSystemTypen
              : cur.bundledSystemTypen,
          bundledSystemTextvorlagen:
            incoming.bundledSystemTextvorlagen && incoming.bundledSystemTextvorlagen.length > 0
              ? incoming.bundledSystemTextvorlagen
              : cur.bundledSystemTextvorlagen,
          bundledDefaultPhaseMapping:
            incoming.bundledDefaultPhaseMapping &&
            Object.keys(incoming.bundledDefaultPhaseMapping).length > 0
              ? incoming.bundledDefaultPhaseMapping
              : cur.bundledDefaultPhaseMapping,
        });
      }

      if (dFinal) useDokumenteStore.setState({ ...(dFinal as any) });

      if (abrechnung?.abrechnungen) {
        useAbrechnungStore.getState().setAbrechnungen(abrechnung.abrechnungen);
      }

      if (rvgTabellen?.tabellen && rvgTabellen.aktiveVersion) {
        useRvgTabelleStore.getState().setFromSettings(
          rvgTabellen.tabellen,
          rvgTabellen.aktiveVersion,
        );
      }

      if (schadenskalkulation?.kalkulationen) {
        useSchadenskalkulationStore.getState().setKalkulationen(schadenskalkulation.kalkulationen);
      }
    }

    void hydrate();

    const saveKanzlei = debounce(() => {
      const v = useKanzleiStore.getState().daten;
      void putSettings('kanzlei', v);
    }, 600);

    const saveAufgaben = debounce(() => {
      const s = useAufgabenStore.getState();
      const payload: AufgabenPersistSlice = {
        bundledSystemAufgaben: s.bundledSystemAufgaben,
        bundledPhaseLabels: s.bundledPhaseLabels,
        customAufgaben: s.customAufgaben,
        deaktiviertIds: s.deaktiviertIds,
        erledigtProFall: s.erledigtProFall,
        fallAufgabenMeta: s.fallAufgabenMeta,
        systemOverrides: s.systemOverrides,
        phasenNummern: s.phasenNummern,
        phaseLabelOverrides: s.phaseLabelOverrides,
      };
      void putSettings('aufgaben', payload);
    }, 600);

    const saveVorlagen = debounce(() => {
      const s = useVorlagenStore.getState();
      const payload: VorlagenPersistSlice = {
        bundledSystemTypen: s.bundledSystemTypen,
        bundledSystemTextvorlagen: s.bundledSystemTextvorlagen,
        bundledDefaultPhaseMapping: s.bundledDefaultPhaseMapping,
        typLabelOverrides: s.typLabelOverrides,
        typAktivOverrides: s.typAktivOverrides,
        typSystemOverrides: s.typSystemOverrides,
        removedSystemTypIds: s.removedSystemTypIds,
        customTypen: s.customTypen,
        vorlagen: s.vorlagen,
        systemVorlageOverrides: s.systemVorlageOverrides,
        removedSystemVorlageIds: s.removedSystemVorlageIds,
        textBausteine: s.textBausteine,
        phaseMappingOverrides: s.phaseMappingOverrides,
      };
      void putSettings('vorlagen', payload);
    }, 600);

    const saveDokumente = debounce(() => {
      const s = useDokumenteStore.getState();
      const payload: DokumentePersistSlice = {
        dokumente: s.dokumente,
        uploadedDateien: s.uploadedDateien,
      };
      void putSettings('dokumente', payload);
    }, 600);

    const saveAbrechnung = debounce(() => {
      const s = useAbrechnungStore.getState();
      const payload: AbrechnungPersistSlice = { abrechnungen: s.abrechnungen };
      void putSettings('abrechnung', payload);
    }, 600);

    const saveRvgTabellen = debounce(() => {
      const s = useRvgTabelleStore.getState();
      const payload: RvgTabellePersistSlice = {
        tabellen: s.tabellen,
        aktiveVersion: s.aktiveVersion,
      };
      void putSettings('rvgTabellen', payload);
    }, 600);

    const saveSchadenskalkulation = debounce(() => {
      const s = useSchadenskalkulationStore.getState();
      const payload: SchadenskalkulationPersistSlice = { kalkulationen: s.kalkulationen };
      void putSettings('schadenskalkulation', payload);
    }, 600);

    const unsubK = useKanzleiStore.subscribe(() => saveKanzlei());
    const unsubA = useAufgabenStore.subscribe(() => saveAufgaben());
    const unsubV = useVorlagenStore.subscribe(() => saveVorlagen());
    const unsubD = useDokumenteStore.subscribe(() => saveDokumente());
    const unsubAb = useAbrechnungStore.subscribe(() => saveAbrechnung());
    const unsubRvg = useRvgTabelleStore.subscribe(() => saveRvgTabellen());
    const unsubSk = useSchadenskalkulationStore.subscribe(() => saveSchadenskalkulation());

    return () => {
      alive = false;
      unsubK();
      unsubA();
      unsubV();
      unsubD();
      unsubAb();
      unsubRvg();
      unsubSk();
    };
  }, []);

  return (
    <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/faelle" element={<Faelle />} />
            <Route path="/faelle/neu" element={<FallNeu />} />
            <Route path="/faelle/:id" element={<FallDetail />} />
            <Route path="/mandanten" element={<Mandanten />} />
            <Route path="/mandanten/:id" element={<MandantenDetail />} />
            <Route path="/parteien" element={<Parteien />} />
            <Route path="/parteien/:id" element={<ParteiDetail />} />
            <Route path="/kalender" element={<Kalender />} />
            <Route path="/abrechnung" element={<Abrechnung />} />
            <Route path="/verwaltung" element={<Verwaltung />} />
            <Route path="/einstellungen" element={<Einstellungen />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}

export default function App() {
  return (
    <ColorModeProvider>
      <AppWithTheme />
    </ColorModeProvider>
  );
}
