import {
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import ScheduleIcon from '@mui/icons-material/Schedule';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VisibilityIcon from '@mui/icons-material/Visibility';
import type { Fall, Mandant, Partei, Wiedervorlage } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { parteiInitialen } from '../hooks/useVrParteien';

const CHIP_SX = {
  height: 20,
  fontSize: '0.68rem',
  fontWeight: 600,
  maxWidth: 'none',
  '& .MuiChip-label': { px: 0.9, overflow: 'visible', textOverflow: 'clip' },
};

interface Props {
  fall: Fall;
  mandant: Mandant | null;
  weitereMandanten: Mandant[];
  wiedervorlagen: Wiedervorlage[];
  vrBeteiligteZeilen: { eintragId: string; rolle: string; label: string; partei: Partei | null; rawId: string }[];
  arbeitsParteiSlots: { key: string; label: string; typ: string; idField: string; rawId?: string; partei: Partei | null }[];
  beteiligteAmFall: { key: string; label: string; partei: Partei }[];
  parteiBlockOpen: Record<string, boolean>;
  mandantSidebarOpen: boolean;
  onToggleMandantSidebar: () => void;
  onFallInfoOpen: () => void;
  onFallBearbeiten: () => void;
  onWvHinzufuegen: () => void;
  onWvErledigen: (id: string) => void;
  onMandantBearbeiten: () => void;
  onWeitererMandantHinzufuegen: () => void;
  onWeitererMandantEntfernen: (id: string) => void;
  onParteiBlockToggle: (blockId: string) => void;
  onVrParteiHinzufuegen: () => void;
  onVrEintragEntfernen: (eintragId: string) => void;
  onVrParteiAustauschen: (eintragId: string, label: string, parteiId: string, rolle: string) => void;
  onArParteiZuweisen: (key: string, label: string, rawId: string | undefined, typ: string) => void;
  onZrParteiZuweisen: (key: string, label: string, rawId: string, typ: string) => void;
  onParteiBearbeiten: (p: Partei) => void;
  onNeueParteiVr: (rolle: string) => void;
  onNeueParteiAr: (key: string, typ: string) => void;
}

export default function MandantParteienCard({
  fall, mandant, weitereMandanten, wiedervorlagen,
  vrBeteiligteZeilen, arbeitsParteiSlots, beteiligteAmFall,
  parteiBlockOpen, mandantSidebarOpen,
  onToggleMandantSidebar, onFallInfoOpen, onFallBearbeiten,
  onWvHinzufuegen, onWvErledigen,
  onMandantBearbeiten, onWeitererMandantHinzufuegen, onWeitererMandantEntfernen,
  onParteiBlockToggle, onVrParteiHinzufuegen, onVrEintragEntfernen,
  onVrParteiAustauschen, onArParteiZuweisen, onZrParteiZuweisen,
  onParteiBearbeiten, onNeueParteiVr, onNeueParteiAr,
}: Props) {
  const navigate = useNavigate();
  const isVR = fall.rechtsgebiet === 'verkehrsrecht';
  const rechtsgebietLabel = {
    verkehrsrecht: 'Verkehrsrecht',
    arbeitsrecht: 'Arbeitsrecht',
    zivilrecht: 'Zivilrecht',
    insolvenzrecht: 'Insolvenzrecht',
    wettbewerbsrecht: 'Wettbewerbsrecht',
    erbrecht: 'Erbrecht',
  }[fall.rechtsgebiet];

  const hasBeteiligteSektionen =
    isVR ||
    (fall.rechtsgebiet === 'arbeitsrecht' && arbeitsParteiSlots.length > 0) ||
    (!isVR && fall.rechtsgebiet !== 'arbeitsrecht' && beteiligteAmFall.length > 0);

  function renderBeteiligteParteien() {
    return (
      <>
        {isVR && (
          <>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
              <Typography variant="overline" display="block">Beteiligte Parteien</Typography>
              <Tooltip title="Parteien hinzufügen">
                <IconButton size="small" color="primary" onClick={onVrParteiHinzufuegen}><AddIcon /></IconButton>
              </Tooltip>
            </Stack>
            <Stack spacing={1.25}>
              {vrBeteiligteZeilen.map((row) => {
                const { eintragId, label, partei, rawId, rolle } = row;
                const blockId = partei?.id ?? `bp-${eintragId}`;
                const expanded = parteiBlockOpen[blockId] === true;
                if (partei) {
                  return (
                    <Box key={`vr-${eintragId}-${partei.id}`} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}>
                            {parteiInitialen(partei)}
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>{partei.name}</Typography>
                            <Box mt={0.5}><Chip label={label} size="small" color="primary" variant="filled" sx={CHIP_SX} /></Box>
                          </Box>
                        </Stack>
                        <Stack direction="row" alignItems="center">
                          <Tooltip title={expanded ? 'Einklappen' : 'Ausklappen'}>
                            <IconButton size="small" onClick={() => onParteiBlockToggle(blockId)} aria-expanded={expanded}>
                              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Zuordnung entfernen">
                            <IconButton size="small" onClick={() => onVrEintragEntfernen(eintragId)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                      <Collapse in={expanded}>
                        <Stack spacing={1.25} mt={1.5} mb={1}>
                          {partei.schadensnummer && <Typography variant="body2" color="text.secondary">Schaden-Nr: {partei.schadensnummer}</Typography>}
                          {partei.gutachterNr && <Typography variant="body2" color="text.secondary">Nr: {partei.gutachterNr}</Typography>}
                          {partei.telefon && (
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{partei.telefon}</Typography>
                            </Stack>
                          )}
                          {partei.email && (
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{partei.email}</Typography>
                            </Stack>
                          )}
                          {partei.adresse && (
                            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                              <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                              <Typography variant="body2">{partei.adresse.strasse}, {partei.adresse.plz} {partei.adresse.ort}</Typography>
                            </Stack>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button size="small" startIcon={<EditIcon />} onClick={() => onParteiBearbeiten(partei)}>Bearbeiten</Button>
                          <Button size="small" startIcon={<SwapHorizIcon />} onClick={() => onVrParteiAustauschen(eintragId, label, partei.id, rolle)}>Austauschen</Button>
                          <Button size="small" onClick={() => navigate(`/parteien/${partei.id}`)}>Details</Button>
                        </Stack>
                      </Collapse>
                    </Box>
                  );
                }
                return (
                  <Box key={`vr-broken-${eintragId}`} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'warning.light', bgcolor: 'background.paper' }}>
                    <Box mb={1}><Chip label={label} size="small" color="primary" variant="filled" sx={CHIP_SX} /></Box>
                    <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>
                      Gespeicherte Verknüpfung ({rawId}) nicht gefunden — bitte neu zuweisen oder entfernen.
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button size="small" startIcon={<SwapHorizIcon />} onClick={() => onVrParteiAustauschen(eintragId, label, '', rolle)}>Zuweisen</Button>
                      <Button size="small" variant="outlined" onClick={() => onVrEintragEntfernen(eintragId)}>Entfernen</Button>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}

        {fall.rechtsgebiet === 'arbeitsrecht' && arbeitsParteiSlots.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" display="block" mb={1.25}>Beteiligte Parteien</Typography>
            <Stack spacing={1.25}>
              {arbeitsParteiSlots.map((slot) => {
                const { key, label, partei, rawId } = slot;
                const blockId = partei?.id ?? `slot-ar-${key}`;
                const expanded = parteiBlockOpen[blockId] === true;
                if (partei) {
                  return (
                    <Box key={`ar-${key}-${partei.id}`} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                          <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}>
                            {parteiInitialen(partei)}
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>{partei.name}</Typography>
                            <Box mt={0.5}><Chip label={label} size="small" color="primary" variant="filled" sx={CHIP_SX} /></Box>
                          </Box>
                        </Stack>
                        <IconButton size="small" onClick={() => onParteiBlockToggle(blockId)} aria-expanded={expanded}>
                          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Stack>
                      <Collapse in={expanded}>
                        <Stack spacing={1.25} mt={1.5} mb={1}>
                          {partei.telefon && (
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{partei.telefon}</Typography>
                            </Stack>
                          )}
                          {partei.email && (
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{partei.email}</Typography>
                            </Stack>
                          )}
                          {partei.adresse && (
                            <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                              <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                              <Typography variant="body2">{partei.adresse.strasse}, {partei.adresse.plz} {partei.adresse.ort}</Typography>
                            </Stack>
                          )}
                        </Stack>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Button size="small" startIcon={<EditIcon />} onClick={() => onParteiBearbeiten(partei)}>Bearbeiten</Button>
                          <Button size="small" startIcon={<SwapHorizIcon />} onClick={() => onArParteiZuweisen(key, label, partei.id, partei.typ)}>Austauschen</Button>
                          <Button size="small" onClick={() => navigate(`/parteien/${partei.id}`)}>Details</Button>
                        </Stack>
                      </Collapse>
                    </Box>
                  );
                }
                return (
                  <Box key={`ar-empty-${key}`} sx={{ p: 2, borderRadius: 2, border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>{label}</Typography>
                    {rawId && <Typography variant="body2" color="warning.main" sx={{ mb: 1 }}>Gespeicherte Verknüpfung ({rawId}) nicht gefunden — bitte neu zuweisen.</Typography>}
                    {!rawId && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Noch keine Partei zugewiesen.</Typography>}
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button size="small" startIcon={<SwapHorizIcon />} onClick={() => onArParteiZuweisen(key, label, rawId, slot.typ)}>
                        {rawId ? 'Neu zuweisen' : 'Zuweisen'}
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => onNeueParteiAr(key, slot.typ)}>Neu anlegen</Button>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}

        {!isVR && fall.rechtsgebiet !== 'arbeitsrecht' && beteiligteAmFall.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="overline" display="block" mb={1.25}>Beteiligte Parteien</Typography>
            <Stack spacing={1.25}>
              {beteiligteAmFall.map(({ key, label, partei }) => {
                const expanded = parteiBlockOpen[partei.id] === true;
                return (
                  <Box key={`${key}-${partei.id}`} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}>
                          {parteiInitialen(partei)}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>{partei.name}</Typography>
                          <Box mt={0.5}><Chip label={label} size="small" color="primary" variant="filled" sx={CHIP_SX} /></Box>
                        </Box>
                      </Stack>
                      <IconButton size="small" onClick={() => onParteiBlockToggle(partei.id)} aria-expanded={expanded}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Stack>
                    <Collapse in={expanded}>
                      <Stack spacing={1.25} mt={1.5} mb={1}>
                        {partei.telefon && (
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{partei.telefon}</Typography>
                          </Stack>
                        )}
                        {partei.email && (
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">{partei.email}</Typography>
                          </Stack>
                        )}
                        {partei.adresse && (
                          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                            <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                            <Typography variant="body2">{partei.adresse.strasse}, {partei.adresse.plz} {partei.adresse.ort}</Typography>
                          </Stack>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button size="small" startIcon={<EditIcon />} onClick={() => onParteiBearbeiten(partei)}>Bearbeiten</Button>
                        <Button size="small" startIcon={<SwapHorizIcon />} onClick={() => onZrParteiZuweisen(key, label, partei.id, partei.typ)}>Austauschen</Button>
                        <Button size="small" onClick={() => navigate(`/parteien/${partei.id}`)}>Details</Button>
                      </Stack>
                    </Collapse>
                  </Box>
                );
              })}
            </Stack>
          </>
        )}
      </>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 1.5, md: 2.5 },
        maxHeight: 'none',
        borderRadius: 3,
        borderColor: 'rgba(15, 23, 42, 0.08)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
      }}
    >
      {/* Fallinformationen (kompakt) */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={1.5}
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
          <InfoOutlinedIcon fontSize="small" color="primary" />
          <Typography variant="h6" fontWeight={600}>Fallinformationen</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Details anzeigen">
            <IconButton size="small" onClick={onFallInfoOpen}><VisibilityIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Bearbeiten">
            <IconButton size="small" onClick={onFallBearbeiten}><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Stack spacing={1.25} mb={2}>
        <Box>
          <Typography variant="overline" color="text.secondary">FALLNUMMER</Typography>
          <Typography variant="subtitle1" fontWeight={800}>{fall.aktenzeichen}</Typography>
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary">RECHTSGEBIET</Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main' }} />
            <Typography variant="body2" fontWeight={700}>{rechtsgebietLabel}</Typography>
          </Stack>
        </Box>
        <Box>
          <Typography variant="overline" color="text.secondary">ERÖFFNUNGSDATUM</Typography>
          <Typography variant="body2" fontWeight={700}>{new Date(fall.erstelltAm).toLocaleDateString('de-DE')}</Typography>
        </Box>
      </Stack>

      {/* Wiedervorlagen */}
      {wiedervorlagen.length > 0 && (
        <>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <ScheduleIcon sx={{ fontSize: 14 }} color="action" />
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Wiedervorlagen
              </Typography>
            </Stack>
            <Tooltip title="Wiedervorlage hinzufügen">
              <IconButton size="small" onClick={onWvHinzufuegen}><AddIcon sx={{ fontSize: 14 }} /></IconButton>
            </Tooltip>
          </Stack>
          <Stack spacing={0.5} mb={1}>
            {wiedervorlagen.slice(0, 3).map((w) => {
              const daysLeft = Math.ceil((new Date(w.faelligAm).getTime() - Date.now()) / 86400000);
              const chipColor = w.erledigt ? 'success' : daysLeft < 0 ? 'error' : daysLeft <= 3 ? 'warning' : 'info';
              return (
                <Stack key={w.id} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ py: 0.5, px: 1, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" fontWeight={500} noWrap sx={{ flex: 1, mr: 1 }}>{w.beschreibung}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.25}>
                    <Chip label={daysLeft < 0 ? `${Math.abs(daysLeft)}d üf.` : `${daysLeft}d`}
                      color={chipColor as any} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                    {!w.erledigt && (
                      <Tooltip title="Als erledigt markieren">
                        <IconButton size="small" color="success" onClick={() => onWvErledigen(w.id)} sx={{ p: 0.25 }}>
                          <CheckCircleIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>
              );
            })}
            {wiedervorlagen.length > 3 && (
              <Typography variant="caption" color="text.secondary">+{wiedervorlagen.length - 3} weitere</Typography>
            )}
          </Stack>
        </>
      )}
      {wiedervorlagen.length === 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="caption" color="text.secondary">Keine offenen Wiedervorlagen</Typography>
          <Tooltip title="Wiedervorlage hinzufügen">
            <IconButton size="small" onClick={onWvHinzufuegen}><AddIcon sx={{ fontSize: 14 }} /></IconButton>
          </Tooltip>
        </Stack>
      )}

      <Divider sx={{ my: 1.5 }} />

      {/* MANDANT */}
      {mandant ? (
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}>
                {mandant.vorname[0]}{mandant.nachname[0]}
              </Avatar>
              <Box minWidth={0}>
                <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>
                  {mandant.kategorie === 'unternehmen' ? mandant.nachname : `${mandant.vorname} ${mandant.nachname}`}
                </Typography>
                <Box mt={0.5}><Chip label="Mandant" size="small" color="primary" variant="filled" sx={CHIP_SX} /></Box>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center">
              <Tooltip title="Weiteren Mandanten zuordnen">
                <IconButton size="small" onClick={onWeitererMandantHinzufuegen}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip
                title={
                  mandantSidebarOpen
                    ? 'Einklappen'
                    : hasBeteiligteSektionen
                      ? 'Aufklappen: Kontaktdaten und beteiligte Parteien'
                      : 'Aufklappen: Kontaktdaten des Mandanten'
                }
              >
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={onToggleMandantSidebar}
                    aria-expanded={mandantSidebarOpen}
                    aria-label={mandantSidebarOpen ? 'Einklappen' : 'Aufklappen'}
                  >
                    {mandantSidebarOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
          <Collapse in={mandantSidebarOpen}>
            <Stack spacing={1.25} mt={1.5} mb={1}>
              {mandant.telefon && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{mandant.telefon}</Typography>
                </Stack>
              )}
              {mandant.email && (
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2">{mandant.email}</Typography>
                </Stack>
              )}
              {mandant.adresse && (
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.15 }} />
                  <Typography variant="body2">
                    {mandant.adresse.strasse}, {mandant.adresse.plz} {mandant.adresse.ort}
                  </Typography>
                </Stack>
              )}
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button size="small" startIcon={<EditIcon />} onClick={onMandantBearbeiten}>Bearbeiten</Button>
              <Button size="small" onClick={() => navigate(`/mandanten/${mandant.id}`)}>Profil ansehen</Button>
            </Stack>
            {weitereMandanten.length > 0 && (
              <Stack spacing={1.25} sx={{ mt: 2 }}>
                {weitereMandanten.map((wm) => (
                  <Box key={wm.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}>
                          {(wm.vorname?.[0] ?? '').toUpperCase()}{(wm.nachname?.[0] ?? '').toUpperCase()}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>
                            {wm.kategorie === 'unternehmen' ? wm.nachname : `${wm.vorname} ${wm.nachname}`}
                          </Typography>
                          <Box mt={0.5}><Chip label="Mitmandant" size="small" color="primary" variant="outlined" sx={CHIP_SX} /></Box>
                        </Box>
                      </Stack>
                      <Tooltip title="Zuordnung zum Fall entfernen">
                        <IconButton size="small" onClick={() => onWeitererMandantEntfernen(wm.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
            {renderBeteiligteParteien()}
          </Collapse>
        </Box>
      ) : (
        <>
          <Typography color="text.secondary">Mandant nicht gefunden</Typography>
          {renderBeteiligteParteien()}
        </>
      )}
    </Paper>
  );
}
