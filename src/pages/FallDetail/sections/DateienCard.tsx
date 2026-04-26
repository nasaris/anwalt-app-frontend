import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GridViewIcon from '@mui/icons-material/GridView';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import type { Dokument, UploadedDatei } from '../../../store/dokumenteStore';
import { uploadsApi } from '../../../api/uploads';
import { druckeBriefAlsPdf, erzeugeBriefPdfBlob } from '../../../utils/briefDruck';
import type { KanzleiDaten } from '../../../store/kanzleiStore';
import { dateiFilterTyp, DATEI_FILTER_LABEL, type DateiFilterTyp } from '../hooks/useDateien';

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`;
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

function FileTypeAvatar({ kind }: { kind: 'pdf' | 'doc' | 'image' | 'other' }) {
  const bg = kind === 'pdf' ? '#FEE2E2' : kind === 'doc' ? '#DBEAFE' : kind === 'image' ? '#FEF3C7' : '#E2E8F0';
  const color = kind === 'pdf' ? '#C62828' : kind === 'doc' ? '#1D4ED8' : kind === 'image' ? '#B45309' : '#475569';
  const Icon = kind === 'pdf' ? PictureAsPdfIcon : kind === 'image' ? ImageIcon : InsertDriveFileIcon;
  return (
    <Box
      sx={{
        width: 40, height: 40, flexShrink: 0,
        bgcolor: bg, color, borderRadius: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon sx={{ fontSize: 20 }} />
    </Box>
  );
}

function classifyFile(dateiname: string, mime?: string): 'pdf' | 'doc' | 'image' | 'other' {
  const name = dateiname.toLowerCase();
  if (name.endsWith('.pdf') || mime === 'application/pdf') return 'pdf';
  if (mime?.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|tiff?)$/i.test(name)) return 'image';
  if (/\.(docx?|odt|rtf|txt)$/i.test(name) || mime?.includes('word') || mime?.includes('text')) return 'doc';
  return 'other';
}

interface Props {
  fallId: string;
  kanzlei: KanzleiDaten;
  dokumente: Dokument[];
  uploads: UploadedDatei[];
  docsTab: 'akte' | 'uploads';
  docsTypeFilter: Set<DateiFilterTyp>;
  uploadsViewMode: 'liste' | 'kacheln';
  onTabChange: (tab: 'akte' | 'uploads') => void;
  onTypeFilterChange: (fn: (prev: Set<DateiFilterTyp>) => Set<DateiFilterTyp>) => void;
  onTypeFilterReset: () => void;
  onViewModeChange: (v: 'liste' | 'kacheln') => void;
  onSearch: () => void;
  onUploadOpen: () => void;
  onDokumentVorschau: (dok: Dokument) => void;
  onUploadVorschau: (u: UploadedDatei, orderIds: string[], idx: number) => void;
  onUploadDelete: (id: string) => void;
  onDokumentDelete: (id: string) => void;
}

export default function DateienCard({
  fallId, kanzlei, dokumente, uploads,
  docsTab, docsTypeFilter, uploadsViewMode,
  onTabChange, onTypeFilterChange, onTypeFilterReset, onViewModeChange,
  onSearch, onUploadOpen, onDokumentVorschau, onUploadVorschau, onUploadDelete, onDokumentDelete,
}: Props) {
  const docsView = dokumente.map((dok) => ({ dok, filterTyp: dateiFilterTyp(dok.dateiname, 'application/pdf') }));
  const uploadsView = uploads.map((u) => ({ u, filterTyp: dateiFilterTyp(u.dateiname, u.dateityp) }));
  const aktiveTypen: DateiFilterTyp[] = docsTab === 'akte'
    ? Array.from(new Set<DateiFilterTyp>(docsView.map((x) => x.filterTyp)))
    : Array.from(new Set<DateiFilterTyp>(uploadsView.map((x) => x.filterTyp)));
  const docsGefiltert = docsView.filter((x) => docsTypeFilter.size === 0 || docsTypeFilter.has(x.filterTyp));
  const uploadsGefiltert = uploadsView.filter((x) => docsTypeFilter.size === 0 || docsTypeFilter.has(x.filterTyp));

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2.5 },
        maxHeight: { xs: 'none', md: 840 },
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        borderColor: 'rgba(15, 23, 42, 0.08)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        mb={2}
        sx={{
          mx: { xs: -1.5, md: -2.5 },
          mt: { xs: -1.5, md: -2.5 },
          px: { xs: 1.5, md: 2.5 },
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <FolderOpenIcon color="primary" fontSize="small" />
          <Typography variant="h6" fontWeight={600}>Unterlagen</Typography>
          {(uploads.length + dokumente.length) > 0 && (
            <Chip label={uploads.length + dokumente.length} size="small" sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }} />
          )}
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ rowGap: 0.5, justifyContent: 'flex-end' }}>
          <Tooltip title="Listenansicht">
            <IconButton
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider', bgcolor: uploadsViewMode === 'liste' ? 'background.paper' : 'transparent' }}
              onClick={() => onViewModeChange('liste')}
            >
              <ViewListIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Kachelansicht">
            <IconButton
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider', bgcolor: uploadsViewMode === 'kacheln' ? 'background.paper' : 'transparent' }}
              onClick={() => onViewModeChange('kacheln')}
            >
              <GridViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Suchen">
            <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider' }} onClick={onSearch}>
              <SearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Datei hochladen">
            <IconButton size="small" sx={{ border: '1px solid', borderColor: 'divider' }} onClick={onUploadOpen}>
              <FileUploadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Tab-Leiste */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box sx={{ display: 'inline-flex', bgcolor: 'action.hover', borderRadius: '999px', p: 0.5 }}>
          {(['uploads', 'akte'] as const).map((tab) => (
            <Button
              key={tab}
              onClick={() => { onTabChange(tab); onTypeFilterReset(); }}
              size="small"
              sx={{
                borderRadius: '999px',
                bgcolor: docsTab === tab ? 'background.paper' : 'transparent',
                color: docsTab === tab ? 'text.primary' : 'text.secondary',
                fontWeight: docsTab === tab ? 700 : 500,
                boxShadow: docsTab === tab ? 1 : 0,
                px: 2, py: 0.75, minHeight: 'auto',
                '&:hover': { bgcolor: docsTab === tab ? 'background.paper' : 'action.selected' },
              }}
            >
              {tab === 'uploads' ? 'Unterlagen' : 'Briefakte'}
            </Button>
          ))}
        </Box>
      </Stack>

      {/* Filter-Chips */}
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        <Chip
          size="small"
          label={`Alle · ${docsTab === 'akte' ? dokumente.length : uploads.length}`}
          clickable
          color={docsTypeFilter.size === 0 ? 'primary' : 'default'}
          variant={docsTypeFilter.size === 0 ? 'filled' : 'outlined'}
          onClick={onTypeFilterReset}
        />
        {aktiveTypen.map((typ) => {
          const count = docsTab === 'akte'
            ? docsView.filter((x) => x.filterTyp === typ).length
            : uploadsView.filter((x) => x.filterTyp === typ).length;
          const active = docsTypeFilter.has(typ);
          return (
            <Chip
              key={typ}
              size="small"
              label={`${DATEI_FILTER_LABEL[typ]} · ${count}`}
              clickable
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              onClick={() => onTypeFilterChange((prev) => {
                const next = new Set(prev);
                if (next.has(typ)) next.delete(typ);
                else next.add(typ);
                return next;
              })}
            />
          );
        })}
      </Stack>

      {/* View-Toggle bleibt in Header */}

      <Box sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' }, pr: { xs: 0, md: 0.5 } }}>
        {/* Tab: Dokumente (Akte) */}
        {docsTab === 'akte' && (
          dokumente.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Noch keine Dokumente erstellt. PDF über „Schreiben erfassen → PDF erstellen" erzeugen.
            </Typography>
          ) : docsGefiltert.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Keine Dokumente für den gewählten Dateityp.</Typography>
          ) : (
            <Stack divider={<Divider />}>
              {docsGefiltert.map(({ dok }) => (
                <Stack
                  key={dok.id}
                  direction="row" alignItems="center" spacing={1.5}
                  sx={{ py: 1.25, cursor: 'pointer', '&:hover .doc-actions': { opacity: 1 } }}
                  onClick={() => onDokumentVorschau(dok)}
                >
                  <FileTypeAvatar kind="pdf" />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Tooltip title={dok.dateiname}>
                      <Typography variant="body2" fontWeight={600} noWrap>{dok.dateiname}</Typography>
                    </Tooltip>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      PDF · {formatDate(dok.datum)}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.25} className="doc-actions" sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 0.15s', flexShrink: 0 }}>
                    <Tooltip title="PDF herunterladen">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); druckeBriefAlsPdf(dok.briefDaten, kanzlei); }}>
                        <PictureAsPdfIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {dok.empfaengerEmail && (
                      <Tooltip title={`E-Mail an ${dok.empfaengerEmail}`}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const { blob, dateiname } = erzeugeBriefPdfBlob(dok.briefDaten, kanzlei);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = dateiname; a.click();
                            URL.revokeObjectURL(url);
                            const mailBody = `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie unser Schreiben vom ${new Date(dok.datum).toLocaleDateString('de-DE')} in der Angelegenheit:\n${dok.betreff}\n\nBitte beachten Sie den beigefügten PDF-Anhang.\n\nMit freundlichen Grüßen\n${kanzlei.anwaltName}\n${kanzlei.kanzleiName}`;
                            window.location.href = `mailto:${dok.empfaengerEmail}?subject=${encodeURIComponent(dok.betreff)}&body=${encodeURIComponent(mailBody)}`;
                          }}
                        >
                          <MailOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Aus Akte entfernen">
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDokumentDelete(dok.id); }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )
        )}

        {/* Tab: Hochgeladene Unterlagen */}
        {docsTab === 'uploads' && (
          uploads.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Keine hochgeladenen Dateien vorhanden.</Typography>
          ) : uploadsGefiltert.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Keine Uploads für den gewählten Dateityp.</Typography>
          ) : uploadsViewMode === 'kacheln' ? (
            <Grid container spacing={1.25}>
              {uploadsGefiltert.map(({ u }, idx) => {
                const isPdf = u.dateiname.toLowerCase().endsWith('.pdf') || u.dateityp === 'application/pdf';
                const isImage = u.dateityp.startsWith('image/');
                const orderIds = uploadsGefiltert.map((x) => x.u.id);
                return (
                  <Grid key={u.id} size={{ xs: 12, sm: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1, cursor: 'pointer' }} onClick={() => onUploadVorschau(u, orderIds, idx)}>
                      <Box sx={{ height: 128, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isImage ? (
                          <Box component="img" src={`${uploadsApi.contentUrl(fallId, u.id)}?thumb=1`} alt={u.dateiname} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : isPdf ? (
                          <PictureAsPdfIcon sx={{ color: '#C62828', fontSize: 42 }} />
                        ) : (
                          <InsertDriveFileIcon sx={{ color: 'text.secondary', fontSize: 42 }} />
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ mt: 0.75 }}>{u.dateiname}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {formatBytes(u.groesse)} · {formatDate(u.hochgeladenAm)}
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Stack divider={<Divider />}>
              {uploadsGefiltert.map(({ u }, idx) => {
                const kind = classifyFile(u.dateiname, u.dateityp);
                const orderIds = uploadsGefiltert.map((x) => x.u.id);
                return (
                  <Stack
                    key={u.id} direction="row" alignItems="center" spacing={1.5}
                    sx={{ py: 1.25, cursor: 'pointer', '&:hover .doc-actions': { opacity: 1 } }}
                    onClick={() => onUploadVorschau(u, orderIds, idx)}
                  >
                    <FileTypeAvatar kind={kind} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Tooltip title={u.dateiname}>
                        <Typography variant="body2" fontWeight={600} noWrap>{u.dateiname}</Typography>
                      </Tooltip>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                        {formatBytes(u.groesse)} · {formatDate(u.hochgeladenAm)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.25} className="doc-actions" sx={{ opacity: { xs: 1, md: 0 }, transition: 'opacity 0.15s', flexShrink: 0 }}>
                      <Tooltip title="Entfernen">
                        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onUploadDelete(u.id); }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )
        )}
      </Box>

      {/* Dropzone-Upload-Button am Ende der Card */}
      <Button
        onClick={onUploadOpen}
        variant="outlined"
        fullWidth
        startIcon={<FileUploadIcon />}
        sx={{
          mt: 2,
          py: 1.25,
          borderStyle: 'dashed',
          borderWidth: 2,
          borderColor: 'divider',
          color: 'text.secondary',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          '&:hover': {
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
            color: 'primary.main',
          },
        }}
      >
        Datei hochladen
      </Button>
    </Paper>
  );
}
