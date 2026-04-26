import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SearchIcon from '@mui/icons-material/Search';
import type { DateiBrowserEintrag } from '../hooks/useDateien';
import type { Dokument, UploadedDatei } from '../../../store/dokumenteStore';
import { uploadsApi } from '../../../api/uploads';

interface Props {
  open: boolean;
  fallId: string | undefined;
  dokumentVorschau: { titel: string; src?: string; mime?: string; ephemeral?: boolean; hinweis?: string } | null;
  dokumentVorschauListeOpen: boolean;
  dateiBrowserSuche: string;
  dateiBrowserViewMode: 'liste' | 'kacheln';
  dateiBrowserGefiltert: DateiBrowserEintrag[];
  uploadPreviewIds: string[];
  uploadPreviewIndex: number;
  onClose: () => void;
  onSucheChange: (v: string) => void;
  onViewModeChange: (v: 'liste' | 'kacheln') => void;
  onUploadVorschau: (u: UploadedDatei) => void;
  onDokumentVorschau: (d: Dokument) => void;
  onPreviewStep: (delta: -1 | 1) => void;
  onAlleeDateienOeffnen: () => void;
}

export default function DateiBrowserDialog({
  open,
  fallId,
  dokumentVorschau,
  dokumentVorschauListeOpen,
  dateiBrowserSuche,
  dateiBrowserViewMode,
  dateiBrowserGefiltert,
  uploadPreviewIds,
  uploadPreviewIndex,
  onClose,
  onSucheChange,
  onViewModeChange,
  onUploadVorschau,
  onDokumentVorschau,
  onPreviewStep,
  onAlleeDateienOeffnen,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{dokumentVorschauListeOpen ? 'Alle Dateien' : dokumentVorschau?.titel}</DialogTitle>
      <DialogContent dividers>
        {dokumentVorschauListeOpen ? (
          <Stack spacing={1.5}>
            <TextField
              size="small"
              placeholder="Dateien durchsuchen …"
              value={dateiBrowserSuche}
              onChange={(e) => onSucheChange(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Stack direction="row" justifyContent="flex-end">
              <ToggleButtonGroup
                exclusive
                size="small"
                value={dateiBrowserViewMode}
                onChange={(_, v: 'liste' | 'kacheln' | null) => { if (v) onViewModeChange(v); }}
              >
                <ToggleButton value="liste">Liste</ToggleButton>
                <ToggleButton value="kacheln">Miniatur</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {dateiBrowserGefiltert.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Keine Dateien gefunden.</Typography>
            ) : dateiBrowserViewMode === 'kacheln' ? (
              <Grid container spacing={1.25}>
                {dateiBrowserGefiltert.map((x) => {
                  const isImage = x.dateityp.startsWith('image/');
                  const isPdf = x.dateityp.includes('pdf') || x.dateiname.toLowerCase().endsWith('.pdf');
                  return (
                    <Grid key={x.id} size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1, cursor: 'pointer' }}
                        onClick={() => {
                          if (x.kind === 'upload') onUploadVorschau(x.upload);
                          else onDokumentVorschau(x.dokument);
                        }}
                      >
                        <Box sx={{ height: 128, borderRadius: 1, overflow: 'hidden', bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isImage && fallId && x.kind === 'upload' ? (
                            <Box
                              component="img"
                              src={`${uploadsApi.contentUrl(fallId, x.upload.id)}?thumb=1`}
                              alt={x.dateiname}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : isPdf ? (
                            <PictureAsPdfIcon sx={{ color: '#C62828', fontSize: 42 }} />
                          ) : (
                            <InsertDriveFileIcon sx={{ color: 'text.secondary', fontSize: 42 }} />
                          )}
                        </Box>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ mt: 0.75 }}>{x.dateiname}</Typography>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Stack divider={<Divider />}>
                {dateiBrowserGefiltert.map((x) => (
                  <Stack
                    key={x.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{ py: 1, cursor: 'pointer' }}
                    onClick={() => {
                      if (x.kind === 'upload') onUploadVorschau(x.upload);
                      else onDokumentVorschau(x.dokument);
                    }}
                  >
                    {x.dateityp.includes('pdf') || x.dateiname.toLowerCase().endsWith('.pdf')
                      ? <PictureAsPdfIcon sx={{ color: '#C62828', fontSize: 24, flexShrink: 0 }} />
                      : <InsertDriveFileIcon sx={{ color: 'text.secondary', fontSize: 24, flexShrink: 0 }} />}
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{x.dateiname}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {new Date(x.datum).toLocaleDateString('de-DE')} · {x.kind === 'upload' ? 'Upload' : 'Akte'}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        ) : dokumentVorschau?.hinweis ? (
          <Alert severity="info">{dokumentVorschau.hinweis}</Alert>
        ) : dokumentVorschau?.src && dokumentVorschau.mime?.startsWith('image/') ? (
          <Box
            component="img"
            src={dokumentVorschau.src}
            alt={dokumentVorschau.titel}
            sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }}
          />
        ) : dokumentVorschau?.src &&
          ((dokumentVorschau.mime ?? '').toLowerCase().includes('pdf') ||
            dokumentVorschau.titel.toLowerCase().endsWith('.pdf') ||
            dokumentVorschau.src.startsWith('data:application/pdf')) ? (
          <Box sx={{ width: '100%', height: '70vh' }}>
            <object data={dokumentVorschau.src} type="application/pdf" width="100%" height="100%">
              <Alert severity="warning" sx={{ mb: 1.5 }}>
                PDF konnte nicht direkt eingebettet werden.
              </Alert>
              <Button variant="outlined" component="a" href={dokumentVorschau.src} target="_blank" rel="noreferrer">
                PDF in neuem Tab öffnen
              </Button>
            </object>
          </Box>
        ) : dokumentVorschau?.src ? (
          <Box
            component="iframe"
            src={dokumentVorschau.src}
            title={dokumentVorschau.titel}
            sx={{ width: '100%', height: '70vh', border: 0 }}
          />
        ) : (
          <Alert severity="warning">Datei kann in dieser Ansicht nicht angezeigt werden.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        {uploadPreviewIds.length > 0 && (
          <>
            <Button onClick={() => onPreviewStep(-1)} disabled={uploadPreviewIndex <= 0}>Zurück</Button>
            <Button
              onClick={() => onPreviewStep(1)}
              disabled={uploadPreviewIndex < 0 || uploadPreviewIndex >= uploadPreviewIds.length - 1}
            >
              Weiter
            </Button>
            <Button onClick={onAlleeDateienOeffnen}>Alle Dateien</Button>
          </>
        )}
        {dokumentVorschau?.src && (
          <Button component="a" href={dokumentVorschau.src} target="_blank" rel="noreferrer">
            In neuem Tab
          </Button>
        )}
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
}
