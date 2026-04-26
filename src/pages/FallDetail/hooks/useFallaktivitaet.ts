import { useState, useMemo } from 'react';
import type { Fall, Schriftverkehr } from '../../../types';
import type { UploadedDatei } from '../../../store/dokumenteStore';
import type { Dokument } from '../../../store/dokumenteStore';
import type { AufgabeRechtsgebiet } from '../../../store/aufgabenStore';
import { useAufgabenStore } from '../../../store/aufgabenStore';
import { buildFallaktivitaetTimeline, type FallaktivitaetZeile } from '../../../utils/fallAktivitaetTimeline';
import { faelleApi } from '../../../api/faelle';

export type FallAktivitaetFilter = 'alle' | 'notiz' | 'anruf' | 'phase_status' | 'wiedervorlage' | 'schriftverkehr' | 'upload' | 'pdf';
export type FallAktivitaetTyp = Exclude<FallAktivitaetFilter, 'alle'>;

export const FALL_AKTIVITAET_FILTER_LABEL: Record<FallAktivitaetFilter, string> = {
  alle: 'Alle',
  notiz: 'Notizen',
  anruf: 'Anrufe',
  phase_status: 'Phase/Status',
  wiedervorlage: 'Wiedervorlagen',
  schriftverkehr: 'Schriftverkehr',
  upload: 'Uploads',
  pdf: 'Dokumente',
};

export const FALL_AKTIVITAET_TYPEN: FallAktivitaetTyp[] = [
  'notiz', 'anruf', 'phase_status', 'wiedervorlage', 'schriftverkehr', 'upload', 'pdf',
];

export function filterVonFallAktivitaet(z: FallaktivitaetZeile): FallAktivitaetFilter {
  if (z.quelle === 'schriftverkehr') return 'schriftverkehr';
  if (z.quelle === 'upload') return 'upload';
  if (z.quelle === 'pdf') return 'pdf';
  if (z.quelle === 'legacy_notiz') return 'notiz';
  if (z.gespeichertTyp === 'notiz') return 'notiz';
  if (z.gespeichertTyp === 'anruf') return 'anruf';
  if (z.gespeichertTyp === 'wiedervorlage') return 'wiedervorlage';
  if (z.gespeichertTyp === 'phase_geaendert' || z.gespeichertTyp === 'status_geaendert') return 'phase_status';
  return 'alle';
}

export function useFallaktivitaet(
  fall: Fall | null,
  setFall: (f: Fall) => void,
  schriftverkehr: Schriftverkehr[],
  uploadsForFall: UploadedDatei[],
  dokumentePdfForFall: Dokument[],
) {
  const getPhaseLabelStore = useAufgabenStore((s) => s.getPhaseLabel);
  const [aktivitaetDialog, setAktivitaetDialog] = useState<'notiz' | 'anruf' | null>(null);
  const [aktivitaetBetreff, setAktivitaetBetreff] = useState('');
  const [aktivitaetDraft, setAktivitaetDraft] = useState('');
  const [timelineNotizErledigtAufgabeId, setTimelineNotizErledigtAufgabeId] = useState<string | null>(null);
  const [aktivitaetBearbeitenId, setAktivitaetBearbeitenId] = useState<string | null>(null);
  const [aktivitaetLoeschenDialog, setAktivitaetLoeschenDialog] = useState<{ id: string; titel: string } | null>(null);
  const [aktivitaetLesen, setAktivitaetLesen] = useState<{ titel: string; text: string } | null>(null);
  const [fallAktivitaetSuche, setFallAktivitaetSuche] = useState('');
  const [fallAktivitaetFilter, setFallAktivitaetFilter] = useState<Set<FallAktivitaetTyp>>(() => new Set());
  const [fallaktivitaetOpen, setFallaktivitaetOpen] = useState(false);

  const fallAktivitaetZeilen = useMemo(() => {
    if (!fall) return [];
    return buildFallaktivitaetTimeline({
      fall,
      schriftverkehr,
      uploads: uploadsForFall,
      dokumentePdf: dokumentePdfForFall,
      getPhaseLabel: (rg, nummer) => getPhaseLabelStore(rg as AufgabeRechtsgebiet, nummer),
    });
  }, [fall, schriftverkehr, uploadsForFall, dokumentePdfForFall, getPhaseLabelStore]);

  const fallAktivitaetZeilenGefiltert = useMemo(() => {
    const listByTyp =
      fallAktivitaetFilter.size === 0
        ? fallAktivitaetZeilen
        : fallAktivitaetZeilen.filter((z) => fallAktivitaetFilter.has(filterVonFallAktivitaet(z) as FallAktivitaetTyp));
    const q = fallAktivitaetSuche.trim().toLowerCase();
    if (!q) return listByTyp;
    return listByTyp.filter((z) => {
      const datumStr = new Date(z.zeitpunkt)
        .toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
        .toLowerCase();
      const haystack = `${z.titel} ${z.beschreibung ?? ''} ${datumStr}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [fallAktivitaetZeilen, fallAktivitaetSuche, fallAktivitaetFilter]);

  const openAktivitaetDialog = (typ: 'notiz' | 'anruf') => {
    setTimelineNotizErledigtAufgabeId(null);
    setAktivitaetBearbeitenId(null);
    setAktivitaetBetreff('');
    setAktivitaetDraft('');
    setAktivitaetDialog(typ);
  };

  const closeAktivitaetDialog = () => {
    setAktivitaetDialog(null);
    setAktivitaetBetreff('');
    setAktivitaetDraft('');
    setTimelineNotizErledigtAufgabeId(null);
    setAktivitaetBearbeitenId(null);
  };

  const handleAktivitaetSpeichern = async () => {
    if (!fall || !aktivitaetDialog || !aktivitaetBetreff.trim() || !aktivitaetDraft.trim()) return;

    if (aktivitaetBearbeitenId) {
      const updated = await faelleApi.updateAktivitaet(fall.id, aktivitaetBearbeitenId, {
        titel: aktivitaetBetreff.trim(),
        beschreibung: aktivitaetDraft.trim(),
      });
      setFall(updated);
      setAktivitaetDraft('');
      setAktivitaetBetreff('');
      setAktivitaetDialog(null);
      setAktivitaetBearbeitenId(null);
      setTimelineNotizErledigtAufgabeId(null);
      return;
    }

    const pendingTimelineAufgabeId = timelineNotizErledigtAufgabeId;
    const updated = await faelleApi.addAktivitaet(fall.id, {
      typ: aktivitaetDialog === 'anruf' ? 'anruf' : 'notiz',
      titel: aktivitaetBetreff.trim(),
      beschreibung: aktivitaetDraft.trim(),
    });
    setFall(updated);
    setAktivitaetDraft('');
    setAktivitaetBetreff('');
    setAktivitaetDialog(null);
    setTimelineNotizErledigtAufgabeId(null);
    if (pendingTimelineAufgabeId && aktivitaetDialog === 'notiz') {
      useAufgabenStore.getState().markiereAufgabeErledigt(fall.id, pendingTimelineAufgabeId);
    }
  };

  const handleAktivitaetBearbeitenAusListe = (z: FallaktivitaetZeile) => {
    if (!fall || !z.gespeichertAktivitaetId) return;
    const a = fall.aktivitaeten?.find((x) => x.id === z.gespeichertAktivitaetId);
    if (!a || (a.typ !== 'notiz' && a.typ !== 'anruf')) return;
    setTimelineNotizErledigtAufgabeId(null);
    setAktivitaetBearbeitenId(a.id);
    setAktivitaetBetreff(a.titel);
    setAktivitaetDraft(a.beschreibung ?? '');
    setAktivitaetDialog(a.typ === 'anruf' ? 'anruf' : 'notiz');
  };

  const handleAktivitaetLoeschenAusListe = (z: FallaktivitaetZeile) => {
    if (!z.gespeichertAktivitaetId) return;
    setAktivitaetLoeschenDialog({ id: z.gespeichertAktivitaetId, titel: z.titel });
  };

  const handleAktivitaetLoeschenBestaetigt = async () => {
    if (!fall || !aktivitaetLoeschenDialog) return;
    try {
      const updated = await faelleApi.deleteAktivitaet(fall.id, aktivitaetLoeschenDialog.id);
      setFall(updated);
    } finally {
      setAktivitaetLoeschenDialog(null);
    }
  };

  return {
    aktivitaetDialog,
    setAktivitaetDialog,
    aktivitaetBetreff,
    setAktivitaetBetreff,
    aktivitaetDraft,
    setAktivitaetDraft,
    timelineNotizErledigtAufgabeId,
    setTimelineNotizErledigtAufgabeId,
    aktivitaetBearbeitenId,
    setAktivitaetBearbeitenId,
    aktivitaetLoeschenDialog,
    setAktivitaetLoeschenDialog,
    aktivitaetLesen,
    setAktivitaetLesen,
    fallAktivitaetSuche,
    setFallAktivitaetSuche,
    fallAktivitaetFilter,
    setFallAktivitaetFilter,
    fallaktivitaetOpen,
    setFallaktivitaetOpen,
    fallAktivitaetZeilen,
    fallAktivitaetZeilenGefiltert,
    openAktivitaetDialog,
    closeAktivitaetDialog,
    handleAktivitaetSpeichern,
    handleAktivitaetBearbeitenAusListe,
    handleAktivitaetLoeschenAusListe,
    handleAktivitaetLoeschenBestaetigt,
  };
}
