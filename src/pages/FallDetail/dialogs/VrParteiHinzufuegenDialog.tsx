import {
  Avatar,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import type { Partei, ParteienTyp } from '../../../types';
import type { VrStammParteiFilter } from '../hooks/useVrParteien';
import { parteiInitialen } from '../hooks/useVrParteien';
import { VR_ROLLE_LABEL } from '../../../utils/verkehrsParteienHelpers';

interface Props {
  open: boolean;
  suche: string;
  stammFilter: VrStammParteiFilter;
  auswahl: Set<string>;
  parteienGezeigt: Partei[];
  onClose: () => void;
  onSucheChange: (v: string) => void;
  onStammFilterChange: (v: VrStammParteiFilter) => void;
  onToggleAuswahl: (id: string) => void;
  onHinzufuegen: () => void;
  onNeueParteiAnlegen: (rolle: ParteienTyp) => void;
}

export default function VrParteiHinzufuegenDialog({
  open, suche, stammFilter, auswahl, parteienGezeigt,
  onClose, onSucheChange, onStammFilterChange, onToggleAuswahl, onHinzufuegen, onNeueParteiAnlegen,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack>
            <Typography variant="h6" fontWeight={600}>Parteien hinzufügen</Typography>
            <Typography variant="caption" color="text.secondary">
              Mehrere gleichzeitig auswählen — z. B. Versicherung und Gutachter.
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose} aria-label="Schließen">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
          Typ filtern
        </Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={stammFilter}
          onChange={(_, v: VrStammParteiFilter | null) => { if (v != null) onStammFilterChange(v); }}
          sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}
        >
          <ToggleButton value="alle">Alle</ToggleButton>
          <ToggleButton value="versicherung">Versicherung</ToggleButton>
          <ToggleButton value="gutachter">Gutachter</ToggleButton>
          <ToggleButton value="werkstatt">Werkstatt</ToggleButton>
        </ToggleButtonGroup>
        <TextField
          fullWidth
          size="small"
          placeholder="Nach Name, E-Mail oder Ort suchen …"
          value={suche}
          onChange={(e) => onSucheChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
          autoFocus
        />
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>Stammdaten</Typography>
          <Tooltip
            title={
              stammFilter === 'alle'
                ? 'Neue Partei anlegen (Typ Versicherung; im Formular änderbar)'
                : `Neue Partei als ${VR_ROLLE_LABEL[stammFilter]} anlegen`
            }
          >
            <IconButton
              size="small"
              color="primary"
              aria-label="Neue Partei anlegen"
              onClick={() => {
                const rolle: ParteienTyp = stammFilter === 'alle' ? 'versicherung' : stammFilter;
                onNeueParteiAnlegen(rolle);
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Stack>
        {parteienGezeigt.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
            Keine Treffer — Toggle oder Suchbegriff anpassen.
          </Typography>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflow: 'auto' }}>
            {parteienGezeigt.map((p) => {
              const selected = auswahl.has(p.id);
              return (
                <ListItem key={p.id} disablePadding sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <ListItemButton alignItems="flex-start" sx={{ py: 1.25 }} selected={selected} onClick={() => onToggleAuswahl(p.id)}>
                    <Checkbox edge="start" checked={selected} tabIndex={-1} disableRipple sx={{ mr: 1, mt: 0.25 }} />
                    <Avatar sx={{ mr: 1.5, mt: 0.25, bgcolor: 'primary.main', width: 44, height: 44, fontSize: '0.95rem', fontWeight: 700 }}>
                      {parteiInitialen(p)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600} component="span">{p.name}</Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {VR_ROLLE_LABEL[p.typ] ?? p.typ}
                            {p.adresse ? ` · ${p.adresse.plz} ${p.adresse.ort}` : ''}
                          </Typography>
                          {p.email && (
                            <Typography variant="caption" color="text.secondary" component="span" display="block">
                              {p.email}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {auswahl.size > 0 ? `${auswahl.size} ausgewählt` : 'Zeilen antippen, um auszuwählen'}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="contained" disabled={auswahl.size === 0} onClick={onHinzufuegen}>
            Hinzufügen{auswahl.size > 0 ? ` (${auswahl.size})` : ''}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
