import { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Stack,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Breadcrumbs,
  FormLabel,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ChecklistIcon from '@mui/icons-material/Checklist';
import {
  useVorlagenStore,
  type DokumentTyp,
  type Textvorlage,
  type Textbaustein,
  type VorlagenRechtsgebiet,
} from '../../store/vorlagenStore';
import {
  useAufgabenStore,
  type Aufgabe,
  type AufgabeRechtsgebiet,
  type AufgabenAktion,
  type AufgabePrioritaet,
  type UploadErwartung,
} from '../../store/aufgabenStore';
import { toEditorHtml, isEditorContentEmpty } from '../../utils/htmlToPlainText';
import SchriftverkehrEditor from '../../components/SchriftverkehrEditor/SchriftverkehrEditor';
import AufgabenVerwaltungTable from './AufgabenVerwaltungTable';

const RG_LABELS: Record<VorlagenRechtsgebiet, string> = {
  alle: 'Alle Rechtsgebiete',
  verkehrsrecht: 'Verkehrsrecht',
  arbeitsrecht: 'Arbeitsrecht',
  zivilrecht: 'Zivilrecht',
  insolvenzrecht: 'Insolvenzrecht',
  wettbewerbsrecht: 'Wettbewerbsrecht',
  erbrecht: 'Erbrecht',
};

const RG_COLORS: Record<VorlagenRechtsgebiet, 'default' | 'info' | 'secondary' | 'warning'> = {
  alle: 'default',
  verkehrsrecht: 'info',
  arbeitsrecht: 'secondary',
  zivilrecht: 'warning',
  insolvenzrecht: 'warning',
  wettbewerbsrecht: 'warning',
  erbrecht: 'info',
};

// ── Dokumententyp-Dialog ──────────────────────────────────

interface TypDialogProps {
  open: boolean;
  typ: DokumentTyp | null;    // null = neu (custom)
  onClose: () => void;
  onSave: (data: { label: string; aktiv: boolean; system: boolean }) => void;
}

function TypDialog({ open, typ, onClose, onSave }: TypDialogProps) {
  const bundledSystemTypen = useVorlagenStore((s) => s.bundledSystemTypen);
  const [label, setLabel] = useState(typ?.label ?? '');
  const [aktiv, setAktiv] = useState(typ?.aktiv ?? true);
  const [typGeschuetzt, setTypGeschuetzt] = useState(typ?.system ?? false);

  const handleOpen = () => {
    setLabel(typ?.label ?? '');
    setAktiv(typ?.aktiv ?? true);
    setTypGeschuetzt(typ?.system ?? false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {typ ? (bundledSystemTypen.some((x) => x.id === typ.id) ? 'Dokumententyp bearbeiten' : 'Typ bearbeiten') : 'Neuer Dokumententyp'}
          </Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={0.5}>
          <TextField
            label="Bezeichnung"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="body2">Aktiv (in Schriftverkehr verwendbar)</Typography>
            <Switch checked={aktiv} onChange={(e) => setAktiv(e.target.checked)} />
          </Stack>
          <FormControlLabel
            control={
              <Checkbox checked={typGeschuetzt} onChange={(_, c) => setTypGeschuetzt(c)} />
            }
            label="Vor Löschen schützen (system)"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={!label.trim()}
          onClick={() => onSave({ label: label.trim(), aktiv, system: typGeschuetzt })}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Dialog: Textvorlage (kompletter Brief) ────────────────

interface VorlageDialogProps {
  open: boolean;
  vorlage: Textvorlage | null;
  onClose: () => void;
  onSave: (data: Omit<Textvorlage, 'id'> & Partial<Pick<Textvorlage, 'system'>>) => void;
  alleTypen: DokumentTyp[];
  textBausteine: Textbaustein[];
}

function VorlageDialog({ open, vorlage, onClose, onSave, alleTypen, textBausteine }: VorlageDialogProps) {
  const [name, setName] = useState(vorlage?.name ?? '');
  const [typId, setTypId] = useState(vorlage?.typId ?? '');
  const [rechtsgebiet, setRechtsgebiet] = useState<VorlagenRechtsgebiet>(vorlage?.rechtsgebiet ?? 'alle');
  const [betreff, setBetreff] = useState(vorlage?.betreff ?? '');
  const [inhalt, setInhalt] = useState(() => toEditorHtml(vorlage?.inhalt ?? ''));
  const [vorlageGeschuetzt, setVorlageGeschuetzt] = useState(vorlage?.system ?? false);

  const handleOpen = () => {
    setName(vorlage?.name ?? '');
    setTypId(vorlage?.typId ?? '');
    setRechtsgebiet(vorlage?.rechtsgebiet ?? 'alle');
    setBetreff(vorlage?.betreff ?? '');
    setInhalt(toEditorHtml(vorlage?.inhalt ?? ''));
    setVorlageGeschuetzt(vorlage?.system ?? false);
  };

  const textBausteineZumEinfuegen = useMemo(
    () =>
      textBausteine
        .filter((b) => b.rechtsgebiet === 'alle' || b.rechtsgebiet === rechtsgebiet)
        .map((b) => ({
          id: b.id,
          label: b.name,
          getHtml: () => toEditorHtml(b.inhalt),
        })),
    [textBausteine, rechtsgebiet],
  );

  const bausteinPlatzhalterOptionen = useMemo(
    () =>
      textBausteine
        .filter((b) => b.rechtsgebiet === 'alle' || b.rechtsgebiet === rechtsgebiet)
        .map((b) => ({ id: b.id, label: b.name })),
    [textBausteine, rechtsgebiet],
  );

  const bausteinPlatzhalterLabels = useMemo(
    () => Object.fromEntries(textBausteine.map((b) => [b.id, b.name])),
    [textBausteine],
  );

  /** Aktive Typen; aktuell gewählten Typ immer anzeigen (auch wenn deaktiviert) */
  const dokumentTypOptionen = useMemo(() => {
    const aktiv = alleTypen.filter((t) => t.aktiv);
    const gewaehlt = typId ? alleTypen.find((t) => t.id === typId) : undefined;
    if (gewaehlt && !aktiv.some((t) => t.id === gewaehlt.id)) {
      return [...aktiv, gewaehlt];
    }
    return aktiv;
  }, [alleTypen, typId]);

  const valid = name.trim() && typId && betreff.trim() && !isEditorContentEmpty(inhalt);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {vorlage ? 'Textvorlage bearbeiten' : 'Neue Textvorlage'}
          </Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={0.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Name der Vorlage"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              size="small"
              autoFocus
            />
            <FormControl fullWidth size="small">
              <InputLabel>Dokumententyp</InputLabel>
              <Select
                value={typId}
                label="Dokumententyp"
                onChange={(e) => setTypId(e.target.value)}
              >
                {dokumentTypOptionen.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.label}
                    {!t.aktiv ? ' (inaktiv)' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Rechtsgebiet</InputLabel>
              <Select
                value={rechtsgebiet}
                label="Rechtsgebiet"
                onChange={(e) => setRechtsgebiet(e.target.value as VorlagenRechtsgebiet)}
              >
                {Object.entries(RG_LABELS).map(([v, l]) => (
                  <MenuItem key={v} value={v}>{l}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <FormControlLabel
            control={
              <Checkbox
                checked={vorlageGeschuetzt}
                onChange={(_, c) => setVorlageGeschuetzt(c)}
              />
            }
            label="Vor Löschen schützen (system)"
          />
          <TextField
            label="Betreff"
            value={betreff}
            onChange={(e) => setBetreff(e.target.value)}
            fullWidth
            size="small"
            placeholder="z.B. Ihr Zeichen: [AZ] — Unser Zeichen: [KANZ_AZ]"
          />
          <Divider />
          <FormLabel required sx={{ display: 'block', mb: 0.75 }}>
            Brieftext (Inhalt)
          </FormLabel>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
            Textbausteine: Symbolleiste „Baustein-Platzhalter“ oder Rechtsklick im Text — im Kontextmenü wählbar als <strong>Platzhalter</strong> (Position im späteren Schreiben) oder <strong>Textbaustein</strong> (vollständiger Inhalt). Syntax gespeichert: <strong>[BAUSTEIN:ID]</strong>.
          </Typography>
          <SchriftverkehrEditor
            value={inhalt}
            onChange={setInhalt}
            minHeight={320}
            placeholder="Vorlagentext … Platzhalter [MANDANT], [AZ], … — Bausteine: Toolbar-Notiz oder Rechtsklick."
            textBausteineZumEinfuegen={textBausteineZumEinfuegen}
            kontextmenueBausteineAlsPlatzhalter
            bausteinPlatzhalterLabels={bausteinPlatzhalterLabels}
            bausteinPlatzhalterOptionen={bausteinPlatzhalterOptionen}
          />
          <Alert severity="info" sx={{ py: 0.5 }}>
            Vollständige Liste der Fall-Platzhalter mit Suche: Rechtsklick → <strong>Fall- und Kanzlei-Platzhalter</strong>. Textbausteine im Text: <strong>[BAUSTEIN:…]</strong> (Rechtsklick → Textbausteine).
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={!valid}
          onClick={() =>
            onSave({
              name: name.trim(),
              typId,
              rechtsgebiet,
              betreff: betreff.trim(),
              inhalt: inhalt.trim(),
              system: vorlageGeschuetzt,
            })}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Dialog: Textbaustein ─────────────────────────────────

interface TextbausteinDialogProps {
  open: boolean;
  baustein: Textbaustein | null;
  onClose: () => void;
  onSave: (data: Omit<Textbaustein, 'id'>) => void;
}

function TextbausteinDialog({ open, baustein, onClose, onSave }: TextbausteinDialogProps) {
  const [name, setName] = useState('');
  const [inhalt, setInhalt] = useState('');
  const [rechtsgebiet, setRechtsgebiet] = useState<VorlagenRechtsgebiet>('alle');

  const handleOpen = () => {
    setName(baustein?.name ?? '');
    setInhalt(baustein?.inhalt ?? '');
    setRechtsgebiet(baustein?.rechtsgebiet ?? 'alle');
  };

  const valid = name.trim() && inhalt.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {baustein ? 'Textbaustein bearbeiten' : 'Neuer Textbaustein'}
          </Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={0.5}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
          <FormControl fullWidth size="small">
            <InputLabel>Gültigkeit</InputLabel>
            <Select
              value={rechtsgebiet}
              label="Gültigkeit"
              onChange={(e) => setRechtsgebiet(e.target.value as VorlagenRechtsgebiet)}
            >
              {Object.entries(RG_LABELS).map(([v, l]) => (
                <MenuItem key={v} value={v}>{l}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Text"
            value={inhalt}
            onChange={(e) => setInhalt(e.target.value)}
            fullWidth
            multiline
            rows={8}
            size="small"
            placeholder="Absatz, Formulierung oder Abschnitt — mit Platzhaltern wie [MANDANT], [AZ] …"
            InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
          />
          <Alert severity="info" sx={{ py: 0.5 }}>
            Beim Bearbeiten einer <strong>Textvorlage</strong> (Reiter „Textvorlagen“) kannst du diesen Textbaustein über „Textbaustein einfügen“ in Betreff oder Brieftext übernehmen.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button
          variant="contained"
          disabled={!valid}
          onClick={() => onSave({ name: name.trim(), rechtsgebiet, inhalt: inhalt.trim() })}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Hauptseite ────────────────────────────────────────────

const RG_AUFGABE_OPTIONS: { value: AufgabeRechtsgebiet; label: string }[] = [
  { value: 'verkehrsrecht', label: 'Verkehrsrecht' },
  { value: 'arbeitsrecht', label: 'Arbeitsrecht' },
  { value: 'zivilrecht', label: 'Zivilrecht' },
  { value: 'insolvenzrecht', label: 'Insolvenzrecht' },
  { value: 'wettbewerbsrecht', label: 'Wettbewerbsrecht' },
  { value: 'erbrecht', label: 'Erbrecht' },
];

// ── Aufgaben-Dialog ───────────────────────────────────────

const UPLOAD_ERWARTUNG_LABELS: Record<UploadErwartung, string> = {
  gutachten: 'Gutachten',
  rechnung: 'Rechnung (allgemein)',
  rechnung_werkstatt: 'Rechnung Werkstatt',
  messwerk: 'Messwerk',
  foto: 'Foto / Bild',
  sonstiges: 'Sonstiges',
};

interface AufgabeDialogProps {
  open: boolean;
  aufgabe: Aufgabe | null;
  defaultRechtsgebiet: AufgabeRechtsgebiet;
  defaultPhase: number;
  alleTypen: DokumentTyp[];
  alleTextvorlagen: Textvorlage[];
  onClose: () => void;
  onSave: (data: Omit<Aufgabe, 'id' | 'system'>) => void;
}

function AufgabeDialog({
  open,
  aufgabe,
  defaultRechtsgebiet,
  defaultPhase,
  alleTypen,
  alleTextvorlagen,
  onClose,
  onSave,
}: AufgabeDialogProps) {
  const [text, setText] = useState(aufgabe?.text ?? '');
  const [rechtsgebiet, setRechtsgebiet] = useState<AufgabeRechtsgebiet>(aufgabe?.rechtsgebiet ?? defaultRechtsgebiet);
  const [phase, setPhase] = useState(aufgabe?.phase ?? defaultPhase);
  const [prioritaet, setPrioritaet] = useState<AufgabePrioritaet>(aufgabe?.prioritaet ?? 'normal');
  const [faelligInTagen, setFaelligInTagen] = useState<string>(
    typeof aufgabe?.faelligInTagen === 'number' ? String(aufgabe.faelligInTagen) : '',
  );
  /** Rohdaten abonnieren — getPhasenNummern() liefert sonst jedes Mal ein neues Array → React-Snapshot-Schleife */
  const phasenNummernSlice = useAufgabenStore((s) => s.phasenNummern[rechtsgebiet]);
  const phaseLabelSlice = useAufgabenStore((s) => s.phaseLabelOverrides[rechtsgebiet]);
  const phasenNums = useMemo(
    () => useAufgabenStore.getState().getPhasenNummern(rechtsgebiet),
    [rechtsgebiet, phasenNummernSlice, phaseLabelSlice],
  );
  const getPhaseLabel = useAufgabenStore((s) => s.getPhaseLabel);
  const [reihenfolge, setReihenfolge] = useState(aufgabe?.reihenfolge ?? 50);
  const [schriftverkehrTypId, setSchriftverkehrTypId] = useState<string>(aufgabe?.schriftverkehrTypId ?? '');
  const [aktion, setAktion] = useState<AufgabenAktion>(aufgabe?.aktion ?? (aufgabe?.schriftverkehrTypId ? 'brief' : 'anruf'));
  const [standardTextvorlageId, setStandardTextvorlageId] = useState<string>(aufgabe?.standardTextvorlageId ?? '');
  const [uploadErwartung, setUploadErwartung] = useState<UploadErwartung>(aufgabe?.uploadErwartung ?? 'gutachten');

  const passendeVorlagenFuerTyp = useMemo(
    () =>
      alleTextvorlagen.filter(
        (v) =>
          v.typId === schriftverkehrTypId &&
          (v.rechtsgebiet === 'alle' || v.rechtsgebiet === rechtsgebiet),
      ),
    [alleTextvorlagen, schriftverkehrTypId, rechtsgebiet],
  );

  const handleOpen = () => {
    const rg = aufgabe?.rechtsgebiet ?? defaultRechtsgebiet;
    const nums = useAufgabenStore.getState().getPhasenNummern(rg);
    const gew = aufgabe?.phase ?? defaultPhase;
    setText(aufgabe?.text ?? '');
    setRechtsgebiet(rg);
    setPhase(nums.includes(gew) ? gew : nums[0] ?? 1);
    setReihenfolge(aufgabe?.reihenfolge ?? 50);
    setSchriftverkehrTypId(aufgabe?.schriftverkehrTypId ?? '');
    setAktion(aufgabe?.aktion ?? (aufgabe?.schriftverkehrTypId ? 'brief' : 'anruf'));
    setStandardTextvorlageId(aufgabe?.standardTextvorlageId ?? '');
    setUploadErwartung(aufgabe?.uploadErwartung ?? 'gutachten');
    setPrioritaet(aufgabe?.prioritaet ?? 'normal');
    setFaelligInTagen(typeof aufgabe?.faelligInTagen === 'number' ? String(aufgabe.faelligInTagen) : '');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth TransitionProps={{ onEnter: handleOpen }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>{aufgabe ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</Typography>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={0.5}>
          <TextField
            label="Aufgabentext"
            value={text}
            onChange={(e) => setText(e.target.value)}
            fullWidth size="small" autoFocus multiline rows={2}
          />
          {!aufgabe?.system && (
            <Stack direction="row" spacing={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Rechtsgebiet</InputLabel>
                <Select value={rechtsgebiet} label="Rechtsgebiet"
                  onChange={(e) => {
                    const rg = e.target.value as AufgabeRechtsgebiet;
                    setRechtsgebiet(rg);
                    const erste = useAufgabenStore.getState().getPhasenNummern(rg)[0] ?? 1;
                    setPhase(erste);
                  }}>
                  {RG_AUFGABE_OPTIONS.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Phase</InputLabel>
                <Select value={phase} label="Phase"
                  onChange={(e) => setPhase(Number(e.target.value))}>
                  {phasenNums.map((p) => (
                    <MenuItem key={p} value={p}>{getPhaseLabel(rechtsgebiet, p)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Aktion</InputLabel>
            <Select
              value={aktion}
              label="Aktion"
              onChange={(e) => setAktion(e.target.value as AufgabenAktion)}
            >
              <MenuItem value="brief">Brief / Schriftverkehr</MenuItem>
              <MenuItem value="anruf">Anruf</MenuItem>
              <MenuItem value="upload">Dokument hochladen</MenuItem>
            </Select>
          </FormControl>

          {(aktion === 'brief' || aktion === 'upload') && (
          <FormControl fullWidth size="small">
            <InputLabel>Dokumententyp {aktion === 'brief' ? '(für Brief)' : '(optional)'}</InputLabel>
            <Select
              value={schriftverkehrTypId}
              label={aktion === 'brief' ? 'Dokumententyp (für Brief)' : 'Dokumententyp (optional)'}
              onChange={(e) => setSchriftverkehrTypId(e.target.value)}
            >
              <MenuItem value=""><em>Keiner</em></MenuItem>
              {alleTypen.filter((t) => t.aktiv).map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          )}

          {aktion === 'brief' && schriftverkehrTypId && passendeVorlagenFuerTyp.length > 1 && (
            <FormControl fullWidth size="small">
              <InputLabel>Standard-Textvorlage</InputLabel>
              <Select
                value={standardTextvorlageId}
                label="Standard-Textvorlage"
                onChange={(e) => setStandardTextvorlageId(e.target.value)}
              >
                <MenuItem value=""><em>Automatisch ( erste passende )</em></MenuItem>
                {passendeVorlagenFuerTyp.map((v) => (
                  <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {aktion === 'upload' && (
            <FormControl fullWidth size="small">
              <InputLabel>Erwartete Kategorie</InputLabel>
              <Select
                value={uploadErwartung}
                label="Erwartete Kategorie"
                onChange={(e) => setUploadErwartung(e.target.value as UploadErwartung)}
              >
                {(Object.keys(UPLOAD_ERWARTUNG_LABELS) as UploadErwartung[]).map((k) => (
                  <MenuItem key={k} value={k}>{UPLOAD_ERWARTUNG_LABELS[k]}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl fullWidth size="small">
            <InputLabel>Priorität</InputLabel>
            <Select
              value={prioritaet}
              label="Priorität"
              onChange={(e) => setPrioritaet(e.target.value as AufgabePrioritaet)}
            >
              <MenuItem value="hoch">Hoch</MenuItem>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="niedrig">Niedrig</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Standard-Fälligkeit in Tagen (Verwaltung)"
            type="number"
            value={faelligInTagen}
            onChange={(e) => setFaelligInTagen(e.target.value)}
            size="small"
            inputProps={{ min: 0, step: 1 }}
            helperText="Wird ab Fallbeginn gerechnet; im konkreten Fall pro Aufgabe überschreibbar."
          />
          <TextField
            label="Reihenfolge"
            type="number"
            value={reihenfolge}
            onChange={(e) => setReihenfolge(Number(e.target.value))}
            size="small"
            helperText="Kleinere Zahl = weiter oben"
            inputProps={{ min: 1, step: 10 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" disabled={!text.trim()}
          onClick={() => onSave({
            text: text.trim(),
            rechtsgebiet,
            phase,
            reihenfolge,
            aktion,
            prioritaet,
            faelligAm: undefined,
            faelligInTagen:
              faelligInTagen.trim() === ''
                ? undefined
                : Math.max(0, Math.floor(Number(faelligInTagen) || 0)),
            ...(schriftverkehrTypId ? { schriftverkehrTypId } : {}),
            ...(aktion === 'brief' && standardTextvorlageId ? { standardTextvorlageId } : {}),
            ...(aktion === 'upload' ? { uploadErwartung } : {}),
          })}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Hauptseite ────────────────────────────────────────────

export default function Verwaltung() {
  const [tab, setTab] = useState(0);
  const store = useVorlagenStore((s) => s);
  const alleTypen = store.getAlleTypen();

  // Dokumententypen-State
  const [typDialog, setTypDialog] = useState<{ open: boolean; typ: DokumentTyp | null }>({ open: false, typ: null });

  // Textvorlagen (komplette Briefe)
  const [vorlageDialog, setVorlageDialog] = useState<{ open: boolean; vorlage: Textvorlage | null }>({ open: false, vorlage: null });
  const [vorlageTypFilter, setVorlageTypFilter] = useState<string>('alle');

  // Textbausteine
  const [textbausteinDialog, setTextbausteinDialog] = useState<{ open: boolean; baustein: Textbaustein | null }>({
    open: false,
    baustein: null,
  });
  const [tbRgFilter, setTbRgFilter] = useState<string>('alle');

  // Aufgaben-State
  const aufgabenStore = useAufgabenStore((s) => s);
  const [aufgabeRg, setAufgabeRg] = useState<AufgabeRechtsgebiet>('verkehrsrecht');
  const [aufgabeDialog, setAufgabeDialog] = useState<{ open: boolean; aufgabe: Aufgabe | null; phase: number }>({ open: false, aufgabe: null, phase: 1 });

  const alleTextvorlagen = store.getAlleTextvorlagen();
  const textvorlagenGesamt = store.bundledSystemTextvorlagen.length + store.vorlagen.length;
  const gefilterteVorlagen = vorlageTypFilter === 'alle'
    ? alleTextvorlagen
    : alleTextvorlagen.filter((v) => v.typId === vorlageTypFilter);

  const alleTextBausteine = store.getAlleTextBausteine();
  const textbausteineGesamt = store.textBausteine.length;
  const gefilterteTextBausteine =
    tbRgFilter === 'alle'
      ? alleTextBausteine
      : alleTextBausteine.filter((b) => b.rechtsgebiet === 'alle' || b.rechtsgebiet === tbRgFilter);

  const typLabel = (typId: string) => alleTypen.find((t) => t.id === typId)?.label ?? typId;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Kanzlei
        </Typography>
        <Typography variant="caption" fontWeight={800} color="text.primary" sx={{ letterSpacing: '0.08em' }}>
          Verwaltung
        </Typography>
      </Breadcrumbs>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 0.5 }}>
            Verwaltung
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dokumententypen, Textvorlagen (komplette Schreiben), Textbausteine und Aufgaben für den Schriftverkehr pflegen.
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, bgcolor: 'jurist.surfaceContainerLow' }}
        >
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <DescriptionIcon fontSize="small" />
                <span>Dokumententypen</span>
                <Chip label={alleTypen.length} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <ArticleIcon fontSize="small" />
                <span>Textvorlagen</span>
                <Chip label={textvorlagenGesamt} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <PostAddIcon fontSize="small" />
                <span>Textbausteine</span>
                <Chip label={textbausteineGesamt} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <ChecklistIcon fontSize="small" />
                <span>Aufgaben</span>
                <Chip label={aufgabenStore.bundledSystemAufgaben.length + aufgabenStore.customAufgaben.length} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Stack>
            }
          />
        </Tabs>

        {/* ── Tab 1: Dokumententypen ── */}
        {tab === 0 && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
              <Typography variant="body2" color="text.secondary">
                Geschützte Typen sind nicht löschbar — Schutz im Bearbeiten-Dialog unter „Vor Löschen schützen (system)“ ändern.
              </Typography>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setTypDialog({ open: true, typ: null })}
              >
                Neuer Typ
              </Button>
            </Stack>
            <Divider />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
                    <TableCell>Bezeichnung</TableCell>
                    <TableCell>Herkunft</TableCell>
                    <TableCell align="center">Aktiv</TableCell>
                    <TableCell align="right" width={80} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alleTypen.map((typ) => {
                    const istMitgeliefert = store.bundledSystemTypen.some((t) => t.id === typ.id);
                    return (
                    <TableRow key={typ.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{typ.label}</Typography>
                        <Typography variant="caption" color="text.disabled">{typ.id}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typ.system ? 'System' : 'Benutzerdefiniert'}
                          size="small"
                          variant={typ.system ? 'filled' : 'outlined'}
                          color={typ.system ? 'default' : 'primary'}
                          sx={{ fontWeight: 600, fontSize: '0.68rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Switch
                          size="small"
                          checked={typ.aktiv}
                          onChange={(e) => {
                            if (istMitgeliefert) store.updateSystemTyp(typ.id, { aktiv: e.target.checked });
                            else store.updateCustomTyp(typ.id, { aktiv: e.target.checked });
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end">
                          <Tooltip title="Bearbeiten">
                            <IconButton size="small" onClick={() => setTypDialog({ open: true, typ })}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={typ.system ? 'Schutz in Bearbeiten aufheben, dann löschen' : 'Löschen'}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={!!typ.system}
                                onClick={() => store.deleteDokumentTyp(typ.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── Tab 2: Textvorlagen ── */}
        {tab === 1 && (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} px={2} py={1.5} gap={1}>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Filter nach Dokumententyp</InputLabel>
                <Select
                  value={vorlageTypFilter}
                  label="Filter nach Dokumententyp"
                  onChange={(e) => setVorlageTypFilter(e.target.value)}
                >
                  <MenuItem value="alle">Alle Typen</MenuItem>
                  <Divider />
                  {alleTypen.filter((t) => t.aktiv).map((t) => (
                    <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                size="small"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setVorlageDialog({ open: true, vorlage: null })}
              >
                Neue Textvorlage
              </Button>
            </Stack>
            <Divider />
            {gefilterteVorlagen.length === 0 ? (
              <Box p={4} textAlign="center">
                <ArticleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  {vorlageTypFilter !== 'alle'
                    ? 'Keine Textvorlagen für diesen Filter.'
                    : 'Keine Textvorlagen in dieser Ansicht.'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => setVorlageDialog({ open: true, vorlage: null })}
                >
                  Erste Textvorlage erstellen
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Dokumententyp</TableCell>
                      <TableCell>Rechtsgebiet</TableCell>
                      <TableCell>Betreff</TableCell>
                      <TableCell align="right" width={80} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gefilterteVorlagen.map((v) => (
                      <TableRow key={v.id} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" fontWeight={600}>{v.name}</Typography>
                            {v.system && (
                              <Chip label="System" size="small" variant="filled" sx={{ fontSize: '0.65rem', height: 18 }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={typLabel(v.typId)}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.68rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={RG_LABELS[v.rechtsgebiet]}
                            size="small"
                            color={RG_COLORS[v.rechtsgebiet]}
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.68rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                            {v.betreff}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end">
                            <Tooltip title="Bearbeiten">
                              <IconButton size="small" onClick={() => setVorlageDialog({ open: true, vorlage: v })}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={v.system ? 'Schutz in Bearbeiten aufheben, dann löschen' : 'Löschen'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color="error"
                                  disabled={!!v.system}
                                  onClick={() => store.deleteVorlage(v.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* ── Tab 3: Textbausteine ── */}
        {tab === 2 && (
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} px={2} py={1.5} gap={1}>
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Kurze Textbausteine — in <strong>Textvorlagen</strong> per „Textbaustein einfügen“ zusammensetzen.
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Filter Rechtsgebiet</InputLabel>
                  <Select
                    value={tbRgFilter}
                    label="Filter Rechtsgebiet"
                    onChange={(e) => setTbRgFilter(e.target.value)}
                  >
                    <MenuItem value="alle">Alle</MenuItem>
                    <Divider />
                    {(['verkehrsrecht', 'arbeitsrecht', 'zivilrecht', 'insolvenzrecht', 'wettbewerbsrecht', 'erbrecht'] as const).map((rg) => (
                      <MenuItem key={rg} value={rg}>{RG_LABELS[rg]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setTextbausteinDialog({ open: true, baustein: null })}
                >
                  Neuer Textbaustein
                </Button>
              </Stack>
            </Stack>
            <Divider />
            {gefilterteTextBausteine.length === 0 ? (
              <Box p={4} textAlign="center">
                <PostAddIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">
                  {tbRgFilter !== 'alle'
                    ? 'Keine Textbausteine für dieses Rechtsgebiet.'
                    : 'Noch keine Textbausteine. Lege Bausteine an, die du später in Textvorlagen einfügst.'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  sx={{ mt: 2 }}
                  onClick={() => setTextbausteinDialog({ open: true, baustein: null })}
                >
                  Ersten Textbaustein erstellen
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Rechtsgebiet</TableCell>
                      <TableCell>Text (Auszug)</TableCell>
                      <TableCell align="right" width={80} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {gefilterteTextBausteine.map((b) => (
                      <TableRow key={b.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{b.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={RG_LABELS[b.rechtsgebiet]}
                            size="small"
                            color={RG_COLORS[b.rechtsgebiet]}
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.68rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 420 }}>
                            {b.inhalt.replace(/\s+/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end">
                            <Tooltip title="Bearbeiten">
                              <IconButton size="small" onClick={() => setTextbausteinDialog({ open: true, baustein: b })}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Löschen">
                              <IconButton size="small" color="error" onClick={() => store.deleteTextBaustein(b.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* ── Tab 4: Aufgaben ── */}
        {tab === 3 && (
          <AufgabenVerwaltungTable
            rechtsgebiet={aufgabeRg}
            onRechtsgebietChange={setAufgabeRg}
            alleTypen={alleTypen}
            onNeueAufgabe={() => {
              const erste = aufgabenStore.getPhasenNummern(aufgabeRg)[0] ?? 1;
              setAufgabeDialog({ open: true, aufgabe: null, phase: erste });
            }}
            onBearbeitenAufgabe={(aufgabe, phaseCtx) =>
              setAufgabeDialog({ open: true, aufgabe, phase: phaseCtx })
            }
          />
        )}
      </Paper>

      {/* Dokumententyp-Dialog */}
      <TypDialog
        open={typDialog.open}
        typ={typDialog.typ}
        onClose={() => setTypDialog({ open: false, typ: null })}
        onSave={(data) => {
          const t = typDialog.typ;
          const istMitgeliefert = t ? store.bundledSystemTypen.some((x) => x.id === t.id) : false;
          if (!t) {
            store.addCustomTyp(data);
          } else if (istMitgeliefert) {
            store.updateSystemTyp(t.id, data);
          } else {
            store.updateCustomTyp(t.id, data);
          }
          setTypDialog({ open: false, typ: null });
        }}
      />

      {/* Dialog: Textvorlage */}
      <VorlageDialog
        open={vorlageDialog.open}
        vorlage={vorlageDialog.vorlage}
        onClose={() => setVorlageDialog({ open: false, vorlage: null })}
        onSave={(data) => {
          const v = vorlageDialog.vorlage;
          if (!v) {
            store.addVorlage(data);
          } else if (v.id.startsWith('sys-')) {
            store.updateSystemVorlage(v.id, data);
          } else {
            store.updateVorlage(v.id, data);
          }
          setVorlageDialog({ open: false, vorlage: null });
        }}
        alleTypen={alleTypen}
        textBausteine={store.getAlleTextBausteine()}
      />

      {/* Dialog: Textbaustein */}
      <TextbausteinDialog
        open={textbausteinDialog.open}
        baustein={textbausteinDialog.baustein}
        onClose={() => setTextbausteinDialog({ open: false, baustein: null })}
        onSave={(data) => {
          if (textbausteinDialog.baustein) {
            store.updateTextBaustein(textbausteinDialog.baustein.id, data);
          } else {
            store.addTextBaustein(data);
          }
          setTextbausteinDialog({ open: false, baustein: null });
        }}
      />

      {/* Aufgaben-Dialog */}
      <AufgabeDialog
        open={aufgabeDialog.open}
        aufgabe={aufgabeDialog.aufgabe}
        defaultRechtsgebiet={aufgabeRg}
        defaultPhase={aufgabeDialog.phase}
        alleTypen={alleTypen}
        alleTextvorlagen={store.getAlleTextvorlagen()}
        onClose={() => setAufgabeDialog({ open: false, aufgabe: null, phase: 1 })}
        onSave={(data) => {
          if (aufgabeDialog.aufgabe) {
            aufgabenStore.updateAufgabe(aufgabeDialog.aufgabe.id, data);
          } else {
            aufgabenStore.addAufgabe(data);
          }
          setAufgabeDialog({ open: false, aufgabe: null, phase: 1 });
        }}
      />
    </Box>
  );
}
