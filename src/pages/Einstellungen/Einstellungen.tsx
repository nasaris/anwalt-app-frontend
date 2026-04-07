import { useRef, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Divider,
  Alert,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Avatar,
  Switch,
  FormControlLabel,
  Snackbar,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DrawIcon from '@mui/icons-material/Draw';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import KeyIcon from '@mui/icons-material/Key';
import PhonelinkSetupIcon from '@mui/icons-material/PhonelinkSetup';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useKanzleiStore } from '../../store/kanzleiStore';

// ── Signature Pad ──────────────────────────────────────────

function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [hasStrokes, setHasStrokes] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasStrokes(true);
  }, []);

  const endDraw = useCallback(() => {
    drawing.current = false;
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);
    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', endDraw);
    };
  }, [startDraw, draw, endDraw]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const offscreen = document.createElement('canvas');
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    onSave(offscreen.toDataURL('image/png'));
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Unterschrift hier einzeichnen (Maus oder Touchscreen):
      </Typography>
      <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: '#fafafa', overflow: 'hidden', cursor: 'crosshair', touchAction: 'none' }}>
        <canvas ref={canvasRef} width={600} height={160} style={{ display: 'block', width: '100%', height: 'auto' }} />
      </Box>
      <Stack direction="row" spacing={1} mt={1}>
        <Button size="small" startIcon={<DeleteIcon />} onClick={handleClear} disabled={!hasStrokes}>Löschen</Button>
        <Button size="small" variant="contained" startIcon={<DrawIcon />} onClick={handleSave} disabled={!hasStrokes}>
          Unterschrift übernehmen
        </Button>
      </Stack>
    </Box>
  );
}

// ── Tab: User Profil ───────────────────────────────────────

function UserProfilTab() {
  const { daten, setDaten } = useKanzleiStore();
  const [vorname, setVorname] = useState(daten.anwaltVorname ?? '');
  const [nachname, setNachname] = useState(daten.anwaltNachname ?? '');
  const [email, setEmail] = useState(daten.anwaltEmail ?? daten.email);
  const [telefon, setTelefon] = useState(daten.anwaltTelefon ?? daten.telefon);
  const [titel, setTitel] = useState(daten.anwaltTitel);
  const [zulassung, setZulassung] = useState(daten.zulassungsnummer ?? '');
  const [spezialisierungen, setSpezialisierungen] = useState<string[]>(daten.spezialisierungen ?? []);
  const [neueSpez, setNeueSpez] = useState('');
  const [sigTab, setSigTab] = useState<'zeichnen' | 'hochladen'>('zeichnen');
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = vorname && nachname
    ? `${vorname[0]}${nachname[0]}`.toUpperCase()
    : daten.anwaltName.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleUnterschriftUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 600;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setDaten({ unterschriftBild: canvas.toDataURL('image/png') });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddSpez = () => {
    const s = neueSpez.trim();
    if (s && !spezialisierungen.includes(s)) setSpezialisierungen((prev) => [...prev, s]);
    setNeueSpez('');
  };

  const handleSave = () => {
    setDaten({
      anwaltVorname: vorname,
      anwaltNachname: nachname,
      anwaltEmail: email,
      anwaltTelefon: telefon,
      anwaltTitel: titel,
      anwaltName: [titel, vorname, nachname].filter(Boolean).join(' '),
      zulassungsnummer: zulassung,
      spezialisierungen,
    });
    setSaved(true);
  };

  return (
    <Stack spacing={4}>
      <Paper elevation={0} sx={{ p: 3, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Persönliche Daten</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Name und Berufsbezeichnung erscheinen im Briefkopf und als Unterschrift in allen generierten PDFs.
        </Typography>

        {/* Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ width: 64, height: 64, fontSize: '1.25rem', fontWeight: 700, bgcolor: 'primary.main' }}>
              {initials}
            </Avatar>
            <IconButton
              size="small"
              sx={{ position: 'absolute', bottom: -4, right: -4, bgcolor: 'background.paper', border: (t) => `1px solid ${t.palette.divider}`, width: 24, height: 24, boxShadow: 1 }}
            >
              <EditIcon sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {[vorname, nachname].filter(Boolean).join(' ') || daten.anwaltName}
            </Typography>
            <Typography variant="caption" color="text.secondary">{titel}</Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Vorname" fullWidth size="small" value={vorname} onChange={(e) => setVorname(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Nachname" fullWidth size="small" value={nachname} onChange={(e) => setNachname(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Titel / Berufsbezeichnung" fullWidth size="small" value={titel}
              onChange={(e) => setTitel(e.target.value)} helperText="z.B. Rechtsanwalt, Fachanwalt für Arbeitsrecht" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="E-Mail (persönlich)" type="email" fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Telefon / Durchwahl" fullWidth size="small" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={2}>Berufliche Details</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Zulassungsnummer (RAK)" fullWidth size="small" value={zulassung}
              onChange={(e) => setZulassung(e.target.value)} helperText="Zulassungsnummer bei der Rechtsanwaltskammer" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              Rechtsspezialisierungen
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {spezialisierungen.map((s) => (
                <Chip key={s} label={s} size="small"
                  onDelete={() => setSpezialisierungen((prev) => prev.filter((x) => x !== s))}
                  deleteIcon={<CloseIcon />}
                />
              ))}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <TextField
                  placeholder="Hinzufügen…"
                  size="small"
                  value={neueSpez}
                  onChange={(e) => setNeueSpez(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSpez()}
                  sx={{ '& .MuiInputBase-root': { height: 32 }, minWidth: 180 }}
                />
                <IconButton size="small" onClick={handleAddSpez} disabled={!neueSpez.trim()}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Unterschrift — userbezogen, wird in PDF verwendet */}
      <Paper elevation={0} sx={{ p: 3, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>Unterschrift für PDFs</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Diese Unterschrift wird in allen generierten PDF-Briefen verwendet. Sie ist benutzerspezifisch — bei mehreren Anwälten hat jeder eine eigene.
        </Typography>

        <Tabs value={sigTab} onChange={(_, v) => setSigTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab value="zeichnen" label="Zeichnen" icon={<DrawIcon fontSize="small" />} iconPosition="start" />
          <Tab value="hochladen" label="Bild hochladen" icon={<UploadFileIcon fontSize="small" />} iconPosition="start" />
        </Tabs>

        {sigTab === 'zeichnen' && (
          <SignaturePad onSave={(dataUrl) => setDaten({ unterschriftBild: dataUrl })} />
        )}
        {sigTab === 'hochladen' && (
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>
              PNG oder JPG der eingescannten Unterschrift hochladen (empf. max. 600 × 200 px):
            </Typography>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={handleUnterschriftUpload} />
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
              Unterschrift-Bild auswählen
            </Button>
          </Box>
        )}

        {daten.unterschriftBild && (
          <Box mt={3}>
            <Typography variant="caption" color="text.secondary" display="block" mb={1}>Vorschau:</Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2, bgcolor: '#fff', display: 'inline-block' }}>
              <img src={daten.unterschriftBild} alt="Unterschrift" style={{ maxHeight: 80, maxWidth: 300, display: 'block' }} />
            </Box>
            <Box mt={1}>
              <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => setDaten({ unterschriftBild: undefined })}>
                Unterschrift entfernen
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Stack direction="row" justifyContent="flex-end">
        <Button variant="contained" onClick={handleSave}>Profil speichern</Button>
      </Stack>

      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSaved(false)}>Profil gespeichert.</Alert>
      </Snackbar>
    </Stack>
  );
}

// ── Tab: Kanzlei ───────────────────────────────────────────

function KanzleiTab() {
  const { daten, setDaten } = useKanzleiStore();
  const [saved, setSaved] = useState(false);

  const field = (label: string, key: keyof typeof daten, helperText?: string) => (
    <TextField
      label={label}
      fullWidth
      value={(daten[key] as string) ?? ''}
      onChange={(e) => setDaten({ [key]: e.target.value })}
      helperText={helperText}
      size="small"
    />
  );

  return (
    <Stack spacing={4}>
      <Paper elevation={0} sx={{ p: 3, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} mb={1}>Kanzleidaten — Briefkopf</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Diese Daten erscheinen im Briefkopf aller generierten PDFs. Sie werden lokal im Browser gespeichert.
        </Typography>

        {saved && <Alert severity="success" sx={{ mb: 2 }}>Einstellungen gespeichert.</Alert>}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" color="primary" mb={1}>Kanzlei</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('Kanzleiname', 'kanzleiName', 'z.B. Rechtsanwaltskanzlei Müller & Partner')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('Straße & Hausnummer', 'strasse')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('PLZ & Ort', 'plzOrt', 'z.B. 12345 Berlin')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('Telefon', 'telefon')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('Fax', 'fax')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('E-Mail (Kanzlei)', 'email')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('Website', 'website', 'Optional')}</Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" mb={1}>Bankverbindung (Fußzeile)</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('Bankname', 'bankName', 'Optional')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('IBAN', 'iban', 'Optional — erscheint in Fußzeile')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('BIC', 'bic', 'Optional')}</Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" mb={1}>Steuer</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('Steuernummer', 'steuernummer', 'Optional — erscheint in Fußzeile')}</Grid>
          <Grid size={{ xs: 12, sm: 6 }}>{field('USt-IdNr.', 'ustIdNr', 'Optional')}</Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" mt={3}>
          <Button variant="contained" onClick={() => setSaved(true)}>Kanzlei-Einstellungen speichern</Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

// ── Tab: Sicherheit ────────────────────────────────────────

function SicherheitTab() {
  const [twoFa, setTwoFa] = useState(false);

  const card = (icon: React.ReactNode, title: string, sub: string, action: React.ReactNode) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2.5, borderRadius: 2, border: (t) => `1px solid ${t.palette.divider}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 40, height: 40 }}>{icon}</Avatar>
        <Box>
          <Typography variant="body2" fontWeight={700}>{title}</Typography>
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        </Box>
      </Box>
      {action}
    </Box>
  );

  return (
    <Paper elevation={0} sx={{ p: 3, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1}>Sicherheit</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Verwalten Sie Authentifizierungsmethoden und schützen Sie Ihr Konto.
      </Typography>
      <Stack spacing={2}>
        {card(<KeyIcon fontSize="small" />, 'Passwort', 'Zuletzt geändert vor 4 Monaten',
          <Button variant="outlined" size="small" sx={{ borderRadius: 999 }}>Passwort ändern</Button>
        )}
        {card(<PhonelinkSetupIcon fontSize="small" />, 'Zwei-Faktor-Authentifizierung', 'Zusätzliche Sicherheitsebene',
          <FormControlLabel control={<Switch checked={twoFa} onChange={(_, v) => setTwoFa(v)} />} label="" />
        )}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" endIcon={<ArrowForwardIcon />} sx={{ color: 'text.secondary' }}>Login-Verlauf anzeigen</Button>
        </Box>
      </Stack>
    </Paper>
  );
}

// ── Tab: Benachrichtigungen ────────────────────────────────

function BenachrichtigungenTab() {
  const [wv, setWv] = useState(true);
  const [kschg, setKschg] = useState(true);
  const [neue, setNeue] = useState(false);

  return (
    <Paper elevation={0} sx={{ p: 3, border: (t) => `1px solid ${t.palette.divider}`, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} mb={1}>Benachrichtigungen</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Wählen Sie, worüber Sie informiert werden möchten.</Typography>
      <Stack divider={<Divider />}>
        {([
          { label: 'Wiedervorlagen fällig', desc: 'Erinnerung wenn WV in < 2 Tagen fällig', value: wv, set: setWv },
          { label: 'KSchG-Fristen', desc: 'Warnung bei drohender Klagefrist', value: kschg, set: setKschg },
          { label: 'Neue Fälle angelegt', desc: 'Benachrichtigung bei neuen Akten', value: neue, set: setNeue },
        ] as const).map(({ label, desc, value, set }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
            <Box>
              <Typography variant="body2" fontWeight={600}>{label}</Typography>
              <Typography variant="caption" color="text.secondary">{desc}</Typography>
            </Box>
            <Switch checked={value} onChange={(_, v) => (set as (v: boolean) => void)(v)} />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// ── Hauptkomponente ────────────────────────────────────────

type TabId = 'profil' | 'kanzlei' | 'sicherheit' | 'benachrichtigungen';

export default function Einstellungen() {
  const [activeTab, setActiveTab] = useState<TabId>('profil');

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Einstellungen</Typography>

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="profil" label="User Profil" icon={<PersonOutlineIcon fontSize="small" />} iconPosition="start" />
        <Tab value="kanzlei" label="Kanzlei" icon={<BusinessCenterOutlinedIcon fontSize="small" />} iconPosition="start" />
        <Tab value="sicherheit" label="Sicherheit" icon={<ShieldOutlinedIcon fontSize="small" />} iconPosition="start" />
        <Tab value="benachrichtigungen" label="Benachrichtigungen" icon={<NotificationsNoneOutlinedIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {activeTab === 'profil' && <UserProfilTab />}
      {activeTab === 'kanzlei' && <KanzleiTab />}
      {activeTab === 'sicherheit' && <SicherheitTab />}
      {activeTab === 'benachrichtigungen' && <BenachrichtigungenTab />}
    </Box>
  );
}
