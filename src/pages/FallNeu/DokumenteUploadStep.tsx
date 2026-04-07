import { useCallback, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import type { DateiKategorie } from '../../store/dokumenteStore';

const KATEGORIE_LABELS: Record<DateiKategorie, string> = {
  gutachten: 'Gutachten',
  rechnung: 'Rechnung',
  foto: 'Foto / Bild',
  sonstiges: 'Sonstiges',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function guessKategorie(file: File): DateiKategorie {
  const name = file.name.toLowerCase();
  if (name.includes('gutacht')) return 'gutachten';
  if (name.includes('rechnung') || name.includes('invoice')) return 'rechnung';
  if (file.type.startsWith('image/')) return 'foto';
  return 'sonstiges';
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <ImageOutlinedIcon sx={{ color: 'info.main' }} />;
  if (type === 'application/pdf') return <PictureAsPdfOutlinedIcon sx={{ color: 'error.main' }} />;
  return <InsertDriveFileOutlinedIcon sx={{ color: 'text.secondary' }} />;
}

export interface PendingFile {
  file: File;
  kategorie: DateiKategorie;
}

interface Props {
  onBack: () => void;
  /** Wird mit den gesammelten Dateien aufgerufen — Store-Speichern erfolgt erst nach Fall-Anlage */
  onWeiter: (files: PendingFile[]) => void;
}

export default function DokumenteUploadStep({ onBack, onWeiter }: Props) {
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    setPending((prev) => {
      const existingNames = new Set(prev.map((p) => p.file.name));
      const neu = arr
        .filter((f) => !existingNames.has(f.name))
        .map((f) => ({ file: f, kategorie: guessKategorie(f) }));
      return [...prev, ...neu];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleRemove = (idx: number) =>
    setPending((prev) => prev.filter((_, i) => i !== idx));

  const handleKategorie = (idx: number, kat: DateiKategorie) =>
    setPending((prev) => prev.map((p, i) => (i === idx ? { ...p, kategorie: kat } : p)));

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" mb={0.5}>
        Dokumente hochladen
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Gutachten, Reparaturrechnungen, Fotos und weitere Unterlagen hochladen.
        Die Dateien werden nach dem Anlegen des Falls gespeichert.
        Dieser Schritt kann auch übersprungen werden.
      </Typography>

      {/* Drag & Drop Zone */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: 3,
          bgcolor: dragOver ? 'action.hover' : 'jurist.surfaceContainerLowest',
          p: 5,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
          mb: 3,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <UploadFileIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="subtitle1" fontWeight={600}>
          Dateien hier ablegen
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          oder{' '}
          <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
            Dateien auswählen
          </Box>
        </Typography>
        <Typography variant="caption" color="text.disabled" display="block" mt={1}>
          PDF, Bilder, Word — mehrere Dateien gleichzeitig möglich
        </Typography>
      </Box>

      {/* Dateiliste */}
      {pending.length > 0 && (
        <Stack spacing={1} mb={3}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
            <Typography variant="subtitle2" color="text.secondary">
              {pending.length} Datei{pending.length !== 1 ? 'en' : ''} ausgewählt
            </Typography>
            <Chip
              label="Alle entfernen"
              size="small"
              variant="outlined"
              onClick={() => setPending([])}
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>
          {pending.map((p, idx) => (
            <Paper
              key={`${p.file.name}-${idx}`}
              elevation={0}
              sx={{
                px: 2,
                py: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <FileIcon type={p.file.type} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap title={p.file.name}>
                    {p.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatBytes(p.file.size)}
                  </Typography>
                </Box>
                <Select
                  size="small"
                  value={p.kategorie}
                  onChange={(e) => handleKategorie(idx, e.target.value as DateiKategorie)}
                  sx={{ minWidth: 130, fontSize: '0.8rem' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {(Object.keys(KATEGORIE_LABELS) as DateiKategorie[]).map((k) => (
                    <MenuItem key={k} value={k} sx={{ fontSize: '0.8rem' }}>
                      {KATEGORIE_LABELS[k]}
                    </MenuItem>
                  ))}
                </Select>
                <Tooltip title="Entfernen">
                  <IconButton size="small" onClick={() => handleRemove(idx)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={2} mt={2}>
        <Button variant="outlined" onClick={onBack}>
          Zurück
        </Button>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => onWeiter([])}
          sx={{ color: 'text.secondary' }}
        >
          Überspringen
        </Button>
        <Button
          variant="contained"
          onClick={() => onWeiter(pending)}
          disabled={pending.length === 0}
        >
          {pending.length > 0
            ? `${pending.length} Datei${pending.length !== 1 ? 'en' : ''} übernehmen & weiter`
            : 'Weiter'}
        </Button>
      </Stack>
    </Paper>
  );
}
