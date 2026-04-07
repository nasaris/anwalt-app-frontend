import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Chip,
  Divider,
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import KeyIcon from '@mui/icons-material/Key';
import PhonelinkSetupIcon from '@mui/icons-material/PhonelinkSetup';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useKanzleiStore } from '../../store/kanzleiStore';

type TabId = 'profil' | 'kanzlei' | 'sicherheit' | 'benachrichtigungen';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profil', label: 'Profil', icon: <PersonOutlineIcon fontSize="small" /> },
  { id: 'kanzlei', label: 'Kanzlei', icon: <BusinessCenterOutlinedIcon fontSize="small" /> },
  { id: 'sicherheit', label: 'Sicherheit', icon: <ShieldOutlinedIcon fontSize="small" /> },
  { id: 'benachrichtigungen', label: 'Benachrichtigungen', icon: <NotificationsNoneOutlinedIcon fontSize="small" /> },
];

// ── Sektion-Wrapper (links Beschreibung, rechts Card) ──────

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Typography variant="h6" fontWeight={700} fontFamily='"Manrope", sans-serif' gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" lineHeight={1.65}>
          {description}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: (t) => `1px solid ${t.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          {children}
        </Paper>
      </Grid>
    </Grid>
  );
}

// ── Profil-Tab ─────────────────────────────────────────────

function ProfilTab() {
  const { daten, setDaten } = useKanzleiStore();

  const [vorname, setVorname] = useState(daten.anwaltVorname ?? '');
  const [nachname, setNachname] = useState(daten.anwaltNachname ?? '');
  const [email, setEmail] = useState(daten.anwaltEmail ?? daten.email);
  const [telefon, setTelefon] = useState(daten.anwaltTelefon ?? daten.telefon);
  const [titel, setTitel] = useState(daten.anwaltTitel);
  const [zulassung, setZulassung] = useState(daten.zulassungsnummer ?? '');
  const [spezialisierungen, setSpezialisierungen] = useState<string[]>(daten.spezialisierungen ?? ['Verkehrsrecht', 'Arbeitsrecht']);
  const [neueSpez, setNeueSpez] = useState('');
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = vorname && nachname
    ? `${vorname[0]}${nachname[0]}`.toUpperCase()
    : daten.anwaltName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDaten({ unterschriftBild: ev.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleAddSpez = () => {
    const s = neueSpez.trim();
    if (s && !spezialisierungen.includes(s)) {
      setSpezialisierungen((prev) => [...prev, s]);
    }
    setNeueSpez('');
  };

  const handleSave = () => {
    setDaten({
      anwaltVorname: vorname,
      anwaltNachname: nachname,
      anwaltEmail: email,
      anwaltTelefon: telefon,
      anwaltTitel: titel,
      anwaltName: `${titel} ${vorname} ${nachname}`.trim(),
      zulassungsnummer: zulassung,
      spezialisierungen,
    });
    setSaved(true);
  };

  return (
    <Stack spacing={6}>
      {/* Personal Information */}
      <SettingsSection
        title="Persönliche Daten"
        description="Aktualisieren Sie Ihre Profilinformationen und Kontaktdaten."
      >
        <Stack spacing={3}>
          {/* Avatar + Name */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: '"Manrope", sans-serif',
                  bgcolor: 'primary.main',
                }}
              >
                {initials}
              </Avatar>
              <IconButton
                size="small"
                onClick={() => fileRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  bgcolor: 'background.paper',
                  border: (t) => `1px solid ${t.palette.divider}`,
                  boxShadow: 1,
                  width: 28,
                  height: 28,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
            </Box>
            <Box>
              <Typography fontWeight={700} variant="subtitle1">
                {vorname || nachname ? `${vorname} ${nachname}`.trim() : daten.anwaltName}
              </Typography>
              <Typography variant="body2" color="text.secondary">{titel}</Typography>
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
              <TextField label="Titel / Berufsbezeichnung" fullWidth size="small" value={titel} onChange={(e) => setTitel(e.target.value)} helperText="z.B. Rechtsanwalt, Rechtsanwältin" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Direkte Durchwahl" fullWidth size="small" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="E-Mail-Adresse" type="email" fullWidth size="small" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
          </Grid>
        </Stack>
      </SettingsSection>

      {/* Professional Details */}
      <SettingsSection
        title="Berufliche Details"
        description="Angaben für Schriftsätze und Gerichtsdokumente."
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.5}>
                Zulassungsnummer
              </Typography>
              {zulassung ? (
                <Typography variant="h6" fontWeight={700} fontFamily='"Manrope", sans-serif'>
                  {zulassung}
                </Typography>
              ) : (
                <TextField
                  placeholder="z.B. DE-88219"
                  size="small"
                  value={zulassung}
                  onChange={(e) => setZulassung(e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
            {zulassung && (
              <Chip
                label="Aktiv"
                size="small"
                sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }}
              />
            )}
          </Box>

          {zulassung && (
            <TextField
              label="Zulassungsnummer ändern"
              size="small"
              value={zulassung}
              onChange={(e) => setZulassung(e.target.value)}
            />
          )}

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
              Rechtsspezialisierungen
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {spezialisierungen.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onDelete={() => setSpezialisierungen((prev) => prev.filter((x) => x !== s))}
                  deleteIcon={<CloseIcon />}
                  size="small"
                  sx={{ bgcolor: 'action.selected' }}
                />
              ))}
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <TextField
                  placeholder="Spezialisierung hinzufügen"
                  size="small"
                  value={neueSpez}
                  onChange={(e) => setNeueSpez(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSpez()}
                  sx={{ '& .MuiInputBase-root': { borderRadius: 999, height: 32 }, minWidth: 220 }}
                />
                <IconButton size="small" onClick={handleAddSpez} disabled={!neueSpez.trim()}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Stack>
      </SettingsSection>

      {/* Save */}
      <Snackbar open={saved} autoHideDuration={3000} onClose={() => setSaved(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSaved(false)}>Profil gespeichert.</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, pt: 2, borderTop: (t) => `1px solid ${t.palette.divider}` }}>
        <Button variant="outlined" onClick={() => {
          setVorname(daten.anwaltVorname ?? '');
          setNachname(daten.anwaltNachname ?? '');
          setEmail(daten.anwaltEmail ?? daten.email);
          setTelefon(daten.anwaltTelefon ?? daten.telefon);
          setTitel(daten.anwaltTitel);
          setZulassung(daten.zulassungsnummer ?? '');
          setSpezialisierungen(daten.spezialisierungen ?? []);
        }}>
          Zurücksetzen
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Änderungen speichern
        </Button>
      </Box>
    </Stack>
  );
}

// ── Sicherheit-Tab ─────────────────────────────────────────

function SicherheitTab() {
  const [twoFa, setTwoFa] = useState(false);

  return (
    <Stack spacing={6}>
      <SettingsSection
        title="Sicherheit"
        description="Verwalten Sie Ihre Authentifizierungsmethoden und schützen Sie Ihr Konto."
      >
        <Stack spacing={2}>
          {/* Passwort */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2.5,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 40, height: 40 }}>
                <KeyIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>Passwort</Typography>
                <Typography variant="caption" color="text.secondary">Zuletzt geändert vor 4 Monaten</Typography>
              </Box>
            </Box>
            <Button variant="outlined" size="small" sx={{ borderRadius: 999 }}>
              Passwort ändern
            </Button>
          </Box>

          {/* 2FA */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2.5,
              borderRadius: 2,
              border: (t) => `1px solid ${t.palette.divider}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'action.selected', color: 'text.secondary', width: 40, height: 40 }}>
                <PhonelinkSetupIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>Zwei-Faktor-Authentifizierung</Typography>
                <Typography variant="caption" color="text.secondary">Zusätzliche Sicherheitsebene für Ihr Konto</Typography>
              </Box>
            </Box>
            <FormControlLabel
              control={<Switch checked={twoFa} onChange={(_, v) => setTwoFa(v)} />}
              label=""
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" endIcon={<ArrowForwardIcon />} sx={{ color: 'text.secondary' }}>
              Login-Verlauf anzeigen
            </Button>
          </Box>
        </Stack>
      </SettingsSection>
    </Stack>
  );
}

// ── Benachrichtigungen-Tab ─────────────────────────────────

function BenachrichtigungenTab() {
  const [wv, setWv] = useState(true);
  const [kschg, setKschg] = useState(true);
  const [neue, setNeue] = useState(false);

  return (
    <SettingsSection
      title="Benachrichtigungen"
      description="Wählen Sie, worüber Sie informiert werden möchten."
    >
      <Stack spacing={1} divider={<Divider />}>
        {[
          { label: 'Wiedervorlagen fällig', desc: 'Erinnerung wenn WV in < 2 Tagen fällig', value: wv, set: setWv },
          { label: 'KSchG-Fristen', desc: 'Warnung bei drohender Klagefrist', value: kschg, set: setKschg },
          { label: 'Neue Fälle angelegt', desc: 'Benachrichtigung bei neuen Akten', value: neue, set: setNeue },
        ].map(({ label, desc, value, set }) => (
          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
            <Box>
              <Typography variant="body2" fontWeight={600}>{label}</Typography>
              <Typography variant="caption" color="text.secondary">{desc}</Typography>
            </Box>
            <Switch checked={value} onChange={(_, v) => set(v)} />
          </Box>
        ))}
      </Stack>
    </SettingsSection>
  );
}

// ── Hauptkomponente ────────────────────────────────────────

export default function Profil() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('profil');
  const { daten } = useKanzleiStore();

  const initials = daten.anwaltVorname && daten.anwaltNachname
    ? `${daten.anwaltVorname[0]}${daten.anwaltNachname[0]}`.toUpperCase()
    : daten.anwaltName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Box sx={{ display: 'flex', gap: 4, minHeight: '80vh' }}>
      {/* Linke Sidebar */}
      <Box
        component="aside"
        sx={{
          width: 220,
          flexShrink: 0,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {/* User-Karte */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, pb: 2, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 36, height: 36, fontSize: '0.85rem' }}>
            {initials}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={700} noWrap>{daten.anwaltName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{daten.kanzleiName}</Typography>
          </Box>
        </Box>

        {/* Navigation */}
        <List dense sx={{ py: 0 }}>
          {TABS.map((tab) => (
            <ListItemButton
              key={tab.id}
              selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                borderRadius: 999,
                mb: 0.5,
                py: 1,
                '&.Mui-selected': { bgcolor: 'action.selected', fontWeight: 700 },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: activeTab === tab.id ? 'primary.main' : 'text.secondary' }}>
                {tab.icon}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: activeTab === tab.id ? 600 : 400 }}
              />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: 'auto' }}>
          <ListItemButton
            sx={{ borderRadius: 999, color: 'error.main', '&:hover': { bgcolor: 'error.light', color: 'error.dark' } }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Abmelden" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
          </ListItemButton>
        </Box>
      </Box>

      {/* Hauptinhalt */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h5"
          fontWeight={800}
          fontFamily='"Manrope", sans-serif'
          mb={4}
          sx={{ letterSpacing: '-0.02em' }}
        >
          Profil-Einstellungen
        </Typography>

        {activeTab === 'profil' && <ProfilTab />}

        {activeTab === 'kanzlei' && (
          <SettingsSection
            title="Kanzlei-Einstellungen"
            description="Briefkopf, Bankverbindung, Steuerdaten und Unterschrift."
          >
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Kanzleiweite Einstellungen (Briefkopf, IBAN, Unterschrift, Steuernummer) werden in den Kanzlei-Einstellungen verwaltet.
              </Typography>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/einstellungen')}
                sx={{ alignSelf: 'flex-start', borderRadius: 999 }}
              >
                Kanzlei-Einstellungen öffnen
              </Button>
            </Stack>
          </SettingsSection>
        )}

        {activeTab === 'sicherheit' && <SicherheitTab />}
        {activeTab === 'benachrichtigungen' && <BenachrichtigungenTab />}
      </Box>
    </Box>
  );
}
