import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InboxIcon from '@mui/icons-material/Inbox';
import MailIcon from '@mui/icons-material/Mail';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SendIcon from '@mui/icons-material/Send';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import type { Schriftverkehr } from '../../../types';
import { htmlToPlainText } from '../../../utils/htmlToPlainText';

interface Props {
  schriftverkehr: Schriftverkehr[];
  onNeu: () => void;
  onDelete: (id: string) => void;
  onBearbeiten: (sv: Schriftverkehr) => void;
}

function formatDatumRelativ(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffTage = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffTage === 0) {
      return `Heute, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffTage === 1) {
      return `Gestern, ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoString;
  }
}

function AktionenMenu({
  sv,
  onBearbeiten,
  onDelete,
}: {
  sv: Schriftverkehr;
  onBearbeiten: (sv: Schriftverkehr) => void;
  onDelete: (id: string) => void;
}) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);

  const handleEmail = () => {
    const url = `mailto:${sv.empfaengerEmail}?subject=${encodeURIComponent(sv.betreff)}&body=${encodeURIComponent(htmlToPlainText(sv.inhalt))}`;
    window.open(url, '_blank');
    setAnchor(null);
  };

  return (
    <>
      <Tooltip title="Aktionen">
        <IconButton size="small" onClick={(e) => setAnchor(e.currentTarget)}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ elevation: 3, sx: { minWidth: 180, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => { onBearbeiten(sv); setAnchor(null); }}
          sx={{ gap: 1.5 }}
        >
          <EditOutlinedIcon fontSize="small" color="action" />
          <Typography variant="body2">Bearbeiten</Typography>
        </MenuItem>
        {sv.richtung === 'gesendet' && sv.empfaengerEmail && (
          <MenuItem onClick={handleEmail} sx={{ gap: 1.5 }}>
            <SendIcon fontSize="small" color="primary" />
            <Typography variant="body2">Als E-Mail senden</Typography>
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => { onDelete(sv.id); setAnchor(null); }}
          sx={{ gap: 1.5, color: 'error.main' }}
        >
          <DeleteOutlineIcon fontSize="small" />
          <Typography variant="body2" color="error">Löschen</Typography>
        </MenuItem>
      </Menu>
    </>
  );
}

export default function SchriftverkehrCard({ schriftverkehr, onNeu, onDelete, onBearbeiten }: Props) {
  const [leseansicht, setLeseansicht] = useState<Schriftverkehr | null>(null);

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          maxHeight: { xs: 'none', md: 380 },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 3,
          borderColor: 'rgba(15, 23, 42, 0.08)',
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        }}
      >
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={1}
          sx={{
            px: { xs: 1.5, md: 2 },
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            flexShrink: 0,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <MailIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={600}>Schriftverkehr</Typography>
            {schriftverkehr.length > 0 && (
              <Chip
                label={schriftverkehr.length}
                size="small"
                sx={{ height: 18, fontSize: '0.68rem', fontWeight: 700 }}
              />
            )}
          </Stack>
          <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={onNeu}>
            Schreiben erfassen
          </Button>
        </Stack>

        {/* Table */}
        <Box sx={{ flex: 1, overflowY: { xs: 'visible', md: 'auto' } }}>
          {schriftverkehr.length === 0 ? (
            <Box sx={{ px: 2.5, py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Noch kein Schriftverkehr erfasst.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ '& th': { borderBottom: '1px solid', borderColor: 'divider', py: 0.75 } }}>
                    <TableCell sx={{ width: 40, pl: 2, color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Typ</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Betreff</TableCell>
                    <TableCell sx={{ width: 130, color: 'text.secondary', fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Datum</TableCell>
                    <TableCell sx={{ width: 52, pr: 1.5 }} align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schriftverkehr.map((sv) => (
                    <TableRow
                      key={sv.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td': { border: 0 },
                        '& td': { py: 1 },
                      }}
                      onClick={() => setLeseansicht(sv)}
                    >
                      <TableCell sx={{ pl: 2 }}>
                        <Tooltip title={sv.richtung === 'gesendet' ? 'Gesendet' : 'Empfangen'}>
                          {sv.richtung === 'gesendet'
                            ? <MailOutlineIcon fontSize="small" color="primary" />
                            : <InboxIcon fontSize="small" color="action" />
                          }
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={500}
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.1 }}
                        >
                          {sv.betreff}
                        </Typography>
                        {sv.empfaengerName && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sv.empfaengerName}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {formatDatumRelativ(sv.datum)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 1.5 }} onClick={(e) => e.stopPropagation()}>
                        <AktionenMenu sv={sv} onBearbeiten={onBearbeiten} onDelete={onDelete} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Leseansicht-Dialog */}
      <Dialog
        open={!!leseansicht}
        onClose={() => setLeseansicht(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {leseansicht && (
          <>
            <DialogTitle>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                    {leseansicht.richtung === 'gesendet'
                      ? <MailOutlineIcon fontSize="small" color="primary" />
                      : <InboxIcon fontSize="small" color="action" />
                    }
                    <Chip
                      label={leseansicht.richtung === 'gesendet' ? 'Gesendet' : 'Empfangen'}
                      size="small"
                      color={leseansicht.richtung === 'gesendet' ? 'primary' : 'default'}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDatumRelativ(leseansicht.datum)}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" fontWeight={600}>{leseansicht.betreff}</Typography>
                  {leseansicht.empfaengerName && (
                    <Typography variant="caption" color="text.secondary">
                      An: {leseansicht.empfaengerName}
                      {leseansicht.empfaengerEmail && ` <${leseansicht.empfaengerEmail}>`}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={0.5} flexShrink={0} ml={2}>
                  <Tooltip title="Bearbeiten">
                    <IconButton
                      size="small"
                      onClick={() => {
                        onBearbeiten(leseansicht);
                        setLeseansicht(null);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {leseansicht.richtung === 'gesendet' && leseansicht.empfaengerEmail && (
                    <Tooltip title="Als E-Mail senden">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          const url = `mailto:${leseansicht.empfaengerEmail}?subject=${encodeURIComponent(leseansicht.betreff)}&body=${encodeURIComponent(htmlToPlainText(leseansicht.inhalt))}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Schließen">
                    <IconButton size="small" onClick={() => setLeseansicht(null)}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Box
                sx={{
                  '& *': { fontFamily: 'inherit' },
                  '& p': { mt: 0, mb: 1 },
                  lineHeight: 1.7,
                }}
                dangerouslySetInnerHTML={{ __html: leseansicht.inhalt }}
              />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
}
