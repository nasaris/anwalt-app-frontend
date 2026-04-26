import { useRef } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import type { DateiKategorie } from '../../../store/dokumenteStore';

interface Props {
  open: boolean;
  uploadQueue: File[];
  uploadTagOptions: string[];
  uploadTag: DateiKategorie;
  uploadTagNeu: string;
  isDragOver: boolean;
  onClose: () => void;
  onSave: () => void;
  onTagChange: (tag: DateiKategorie) => void;
  onTagNeuChange: (v: string) => void;
  onTagAdd: () => void;
  onFilesEnqueued: (files: File[]) => void;
  onFileRemove: (idx: number) => void;
  onDragOverChange: (v: boolean) => void;
}

export default function UploadDialog({
  open,
  uploadQueue,
  uploadTagOptions,
  uploadTag,
  uploadTagNeu,
  isDragOver,
  onClose,
  onSave,
  onTagChange,
  onTagNeuChange,
  onTagAdd,
  onFilesEnqueued,
  onFileRemove,
  onDragOverChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Dateien hochladen</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5} sx={{ pt: 0.5 }}>
          <input
            ref={inputRef}
            type="file"
            hidden
            multiple
            onChange={(e) => {
              onFilesEnqueued(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
          <Box
            onDragOver={(e) => { e.preventDefault(); onDragOverChange(true); }}
            onDragLeave={() => onDragOverChange(false)}
            onDrop={(e) => {
              e.preventDefault();
              onDragOverChange(false);
              onFilesEnqueued(Array.from(e.dataTransfer.files ?? []));
            }}
            onClick={() => inputRef.current?.click()}
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: isDragOver ? 'primary.main' : 'divider',
              bgcolor: isDragOver ? 'action.selected' : 'background.default',
              cursor: 'pointer',
            }}
          >
            <Stack alignItems="center" spacing={0.5}>
              <FileUploadIcon color={isDragOver ? 'primary' : 'action'} />
              <Typography variant="body2" fontWeight={600}>Dateien hier ablegen</Typography>
              <Typography variant="caption" color="text.secondary">
                oder klicken, um den Dateiauswahldialog zu öffnen
              </Typography>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} alignItems="flex-end">
            <FormControl size="small" fullWidth>
              <InputLabel id="upload-tag-select-label">Tag</InputLabel>
              <Select
                labelId="upload-tag-select-label"
                value={uploadTag}
                label="Tag"
                onChange={(e) => onTagChange(String(e.target.value) as DateiKategorie)}
              >
                {uploadTagOptions.map((tag) => (
                  <MenuItem key={tag} value={tag}>{tag.replaceAll('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Neuer Tag"
              value={uploadTagNeu}
              onChange={(e) => onTagNeuChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onTagAdd(); }
              }}
            />
            <Button variant="outlined" onClick={onTagAdd}>Hinzufügen</Button>
          </Stack>

          {uploadQueue.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Noch keine Dateien ausgewählt.</Typography>
          ) : (
            <Stack spacing={0.75}>
              {uploadQueue.map((f, idx) => (
                <Stack key={`${f.name}-${f.lastModified}-${idx}`} direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" noWrap sx={{ maxWidth: '75%' }}>{f.name}</Typography>
                  <IconButton size="small" color="error" onClick={() => onFileRemove(idx)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" onClick={onSave} disabled={uploadQueue.length === 0}>
          Hochladen
        </Button>
      </DialogActions>
    </Dialog>
  );
}
