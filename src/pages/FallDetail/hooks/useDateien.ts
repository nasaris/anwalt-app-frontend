import { useState, useEffect, useRef, useMemo } from 'react';
import type { Fall } from '../../../types';
import type { DateiKategorie, Dokument, UploadedDatei } from '../../../store/dokumenteStore';
import { uploadsApi } from '../../../api/uploads';
import { erzeugeBriefPdfBlob } from '../../../utils/briefDruck';
import type { KanzleiDaten } from '../../../store/kanzleiStore';

export type DateiFilterTyp = 'pdf' | 'bild' | 'word' | 'excel' | 'text' | 'sonstige';
export const DATEI_FILTER_LABEL: Record<DateiFilterTyp, string> = {
  pdf: 'PDF',
  bild: 'Bilder',
  word: 'Word',
  excel: 'Excel',
  text: 'Text',
  sonstige: 'Sonstige',
};

export type DateiBrowserEintrag =
  | { kind: 'upload'; id: string; dateiname: string; dateityp: string; datum: string; groesse?: number; upload: UploadedDatei }
  | { kind: 'akte'; id: string; dateiname: string; dateityp: string; datum: string; dokument: Dokument };

export function dateiFilterTyp(dateiname: string, mime?: string): DateiFilterTyp {
  const name = dateiname.toLowerCase();
  const m = (mime ?? '').toLowerCase();
  if (m.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (m.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'bild';
  if (m.includes('word') || /\.(doc|docx)$/i.test(name)) return 'word';
  if (m.includes('sheet') || m.includes('excel') || /\.(xls|xlsx|csv)$/i.test(name)) return 'excel';
  if (m.startsWith('text/') || /\.(txt|md|rtf)$/i.test(name)) return 'text';
  return 'sonstige';
}

export function normalizeUploadTag(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '_');
}

const DEFAULT_UPLOAD_TAGS = ['gutachten', 'rechnung', 'rechnung_werkstatt', 'messwerk', 'foto', 'sonstiges'] as const;

export function useDateien(
  fall: Fall | null,
  kanzlei: KanzleiDaten,
  dokumentePdfForFall: Dokument[],
) {
  const uploadDialogInputRef = useRef<HTMLInputElement>(null);
  const [uploadsForFall, setUploadsForFall] = useState<UploadedDatei[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [uploadTagOptions, setUploadTagOptions] = useState<string[]>([...DEFAULT_UPLOAD_TAGS]);
  const [uploadTag, setUploadTag] = useState<DateiKategorie>('sonstiges');
  const [uploadTagNeu, setUploadTagNeu] = useState('');
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [docsTab, setDocsTab] = useState<'akte' | 'uploads'>('uploads');
  const [docsTypeFilter, setDocsTypeFilter] = useState<Set<DateiFilterTyp>>(() => new Set());
  const [uploadsViewMode, setUploadsViewMode] = useState<'liste' | 'kacheln'>('liste');
  const [dokumentVorschau, setDokumentVorschau] = useState<{
    titel: string;
    src?: string;
    mime?: string;
    ephemeral?: boolean;
    hinweis?: string;
  } | null>(null);
  const [uploadPreviewIds, setUploadPreviewIds] = useState<string[]>([]);
  const [uploadPreviewIndex, setUploadPreviewIndex] = useState<number>(-1);
  const [dokumentVorschauListeOpen, setDokumentVorschauListeOpen] = useState(false);
  const [dateiBrowserSuche, setDateiBrowserSuche] = useState('');
  const [dateiBrowserViewMode, setDateiBrowserViewMode] = useState<'liste' | 'kacheln'>('liste');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('anwalt-upload-tags');
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[];
      if (!Array.isArray(parsed)) return;
      const sanitized = parsed.map((x) => normalizeUploadTag(String(x))).filter(Boolean);
      const merged = Array.from(new Set([...DEFAULT_UPLOAD_TAGS, ...sanitized]));
      setUploadTagOptions(merged);
    } catch {
      // ignore invalid localStorage
    }
  }, []);

  useEffect(() => {
    try {
      const customOnly = uploadTagOptions.filter(
        (x) => !DEFAULT_UPLOAD_TAGS.includes(x as (typeof DEFAULT_UPLOAD_TAGS)[number]),
      );
      localStorage.setItem('anwalt-upload-tags', JSON.stringify(customOnly));
    } catch {
      // ignore storage failures
    }
  }, [uploadTagOptions]);

  useEffect(() => {
    if (!fall?.id) return;
    let cancelled = false;
    void uploadsApi
      .list(fall.id)
      .then((rows) => { if (!cancelled) setUploadsForFall(rows); })
      .catch(() => { if (!cancelled) setUploadsForFall([]); });
    return () => { cancelled = true; };
  }, [fall?.id]);

  const closeDokumentVorschau = () => {
    setDokumentVorschauListeOpen(false);
    setDokumentVorschau((prev) => {
      if (prev?.ephemeral && prev.src) URL.revokeObjectURL(prev.src);
      return null;
    });
  };

  const openDokumentVorschau = (dok: Dokument) => {
    setUploadPreviewIds([]);
    setUploadPreviewIndex(-1);
    setDokumentVorschauListeOpen(false);
    setDokumentVorschau((prev) => {
      if (prev?.ephemeral && prev.src) URL.revokeObjectURL(prev.src);
      const { blob } = erzeugeBriefPdfBlob(dok.briefDaten, kanzlei);
      return { titel: dok.dateiname, src: URL.createObjectURL(blob), mime: 'application/pdf', ephemeral: true };
    });
  };

  const openUploadVorschau = (u: UploadedDatei, orderIds?: string[], index?: number) => {
    if (!fall) return;
    setDokumentVorschauListeOpen(false);
    const ids = orderIds ?? uploadPreviewIds;
    const idx = typeof index === 'number' ? index : ids.findIndex((id) => id === u.id);
    if (ids.length > 0) {
      setUploadPreviewIds(ids);
      setUploadPreviewIndex(idx >= 0 ? idx : 0);
    }
    setDokumentVorschau((prev) => {
      if (prev?.ephemeral && prev.src) URL.revokeObjectURL(prev.src);
      return {
        titel: u.dateiname,
        src: `${uploadsApi.contentUrl(fall.id, u.id)}?v=${Date.now()}`,
        mime: u.dateityp,
      };
    });
  };

  const handleUploadPreviewStep = (delta: -1 | 1) => {
    if (uploadPreviewIds.length === 0) return;
    const nextIndex = uploadPreviewIndex + delta;
    if (nextIndex < 0 || nextIndex >= uploadPreviewIds.length) return;
    const targetId = uploadPreviewIds[nextIndex];
    const target = uploadsForFall.find((u) => u.id === targetId);
    if (!target) return;
    openUploadVorschau(target, uploadPreviewIds, nextIndex);
  };

  const openDateiBrowser = () => {
    setDateiBrowserSuche('');
    setDokumentVorschauListeOpen(true);
    setDokumentVorschau((prev) => {
      if (prev?.ephemeral && prev.src) URL.revokeObjectURL(prev.src);
      return { titel: 'Alle Dateien' };
    });
  };

  const resetUploadDialog = () => {
    setUploadDialogOpen(false);
    setUploadQueue([]);
    setUploadTag('sonstiges');
    setUploadTagNeu('');
    setIsDragOverUpload(false);
  };

  const openUploadDialog = (initialTag?: DateiKategorie) => {
    const normalized = normalizeUploadTag(String(initialTag ?? 'sonstiges'));
    if (normalized && !uploadTagOptions.includes(normalized)) {
      setUploadTagOptions((prev) => [...prev, normalized]);
    }
    setUploadTag((normalized || 'sonstiges') as DateiKategorie);
    setUploadDialogOpen(true);
  };

  const enqueueUploadFiles = (files: File[]) => {
    if (!files.length) return;
    setUploadQueue((prev) => {
      const next = [...prev];
      for (const f of files) {
        const exists = next.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified);
        if (!exists) next.push(f);
      }
      return next;
    });
  };

  const handleUploadTagAdd = () => {
    const normalized = normalizeUploadTag(uploadTagNeu);
    if (!normalized) return;
    setUploadTagOptions((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setUploadTag(normalized as DateiKategorie);
    setUploadTagNeu('');
  };

  const handleUploadSave = () => {
    if (!fall || uploadQueue.length === 0) return;
    void (async () => {
      const created = await Promise.all(uploadQueue.map((file) => uploadsApi.upload(fall.id, file, uploadTag)));
      setUploadsForFall((prev) => [...created, ...prev]);
      resetUploadDialog();
    })();
  };

  const dateiBrowserEintraege = useMemo<DateiBrowserEintrag[]>(() => {
    const uploads = uploadsForFall.map((u) => ({
      kind: 'upload' as const,
      id: `upload-${u.id}`,
      dateiname: u.dateiname,
      dateityp: u.dateityp,
      datum: u.hochgeladenAm,
      groesse: u.groesse,
      upload: u,
    }));
    const akte = dokumentePdfForFall.map((d) => ({
      kind: 'akte' as const,
      id: `akte-${d.id}`,
      dateiname: d.dateiname,
      dateityp: 'application/pdf',
      datum: d.datum,
      dokument: d,
    }));
    return [...uploads, ...akte].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime());
  }, [uploadsForFall, dokumentePdfForFall]);

  const dateiBrowserGefiltert = useMemo(() => {
    const q = dateiBrowserSuche.trim().toLowerCase();
    if (!q) return dateiBrowserEintraege;
    return dateiBrowserEintraege.filter((x) => x.dateiname.toLowerCase().includes(q));
  }, [dateiBrowserEintraege, dateiBrowserSuche]);

  return {
    uploadDialogInputRef,
    uploadsForFall,
    setUploadsForFall,
    uploadDialogOpen,
    setUploadDialogOpen,
    uploadQueue,
    setUploadQueue,
    uploadTagOptions,
    uploadTag,
    setUploadTag,
    uploadTagNeu,
    setUploadTagNeu,
    isDragOverUpload,
    setIsDragOverUpload,
    docsTab,
    setDocsTab,
    docsTypeFilter,
    setDocsTypeFilter,
    uploadsViewMode,
    setUploadsViewMode,
    dokumentVorschau,
    setDokumentVorschau,
    uploadPreviewIds,
    setUploadPreviewIds,
    uploadPreviewIndex,
    setUploadPreviewIndex,
    dokumentVorschauListeOpen,
    setDokumentVorschauListeOpen,
    dateiBrowserSuche,
    setDateiBrowserSuche,
    dateiBrowserViewMode,
    setDateiBrowserViewMode,
    dateiBrowserEintraege,
    dateiBrowserGefiltert,
    closeDokumentVorschau,
    openDokumentVorschau,
    openUploadVorschau,
    handleUploadPreviewStep,
    openDateiBrowser,
    resetUploadDialog,
    openUploadDialog,
    enqueueUploadFiles,
    handleUploadTagAdd,
    handleUploadSave,
  };
}
