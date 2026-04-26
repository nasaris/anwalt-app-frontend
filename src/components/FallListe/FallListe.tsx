import { useMemo, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
  TableSortLabel,
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BalanceIcon from '@mui/icons-material/Balance';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import GavelIcon from '@mui/icons-material/Gavel';
import WorkIcon from '@mui/icons-material/Work';
import { useNavigate } from 'react-router-dom';
import { parseISO } from 'date-fns';
import type { Fall, FallStatus, Mandant } from '../../types';
import { effektiveWvIso } from '../../utils/fallWvAnzeige';
import FristBadge from '../FristBadge/FristBadge';

const STATUS_LABELS: Record<FallStatus, string> = {
  aktiv: 'Aktiv',
  abgeschlossen: 'Abgeschlossen',
  klage: 'Klage',
  einigung: 'Einigung',
  frist_abgelaufen: 'Frist abgelaufen',
};

const STATUS_COLORS: Record<FallStatus, 'primary' | 'default' | 'error' | 'success' | 'warning'> = {
  aktiv: 'primary',
  abgeschlossen: 'default',
  klage: 'error',
  einigung: 'success',
  frist_abgelaufen: 'warning',
};

const RECHTSGEBIET_LABELS: Record<Fall['rechtsgebiet'], string> = {
  verkehrsrecht: 'Verkehrsrecht',
  arbeitsrecht: 'Arbeitsrecht',
  zivilrecht: 'Zivilrecht',
  insolvenzrecht: 'Insolvenzrecht',
  wettbewerbsrecht: 'Wettbewerbsrecht',
  erbrecht: 'Erbrecht',
};

const RECHTSGEBIET_SHORT: Record<Fall['rechtsgebiet'], string> = {
  verkehrsrecht: 'VR',
  arbeitsrecht: 'AR',
  zivilrecht: 'ZR',
  insolvenzrecht: 'IR',
  wettbewerbsrecht: 'WB',
  erbrecht: 'ER',
};

const RECHTSGEBIET_ICON_COLOR: Record<Fall['rechtsgebiet'], string> = {
  verkehrsrecht: 'info.main',
  arbeitsrecht: 'secondary.main',
  zivilrecht: 'success.main',
  insolvenzrecht: 'warning.main',
  wettbewerbsrecht: 'error.main',
  erbrecht: 'primary.dark',
};

/** Reihenfolge wie in der API / erweiterter Suche — konsistente Status-Sortierung */
const FALL_STATUS_ORDER: FallStatus[] = [
  'aktiv',
  'abgeschlossen',
  'klage',
  'einigung',
  'frist_abgelaufen',
];

type SortKey = 'aktenzeichen' | 'mandant' | 'rechtsgebiet' | 'phase' | 'status' | 'fristen' | 'erstelltAm';

function mandantAnzeige(m: Mandant | undefined): string {
  if (!m) return '—';
  return m.kategorie === 'unternehmen'
    ? m.nachname
    : `${m.nachname}, ${m.vorname}`;
}

function statusSortIndex(f: Fall): number {
  const i = FALL_STATUS_ORDER.indexOf(f.status);
  return i === -1 ? FALL_STATUS_ORDER.length : i;
}

/** Nächstes relevantes Datum: früheste KSchG- oder WV-Frist; ohne Frist ans Ende */
function fristSortValue(f: Fall, wvByFall: Record<string, string>): number {
  const t: number[] = [];
  const wv = effektiveWvIso(f, wvByFall);
  if (wv) t.push(parseISO(wv).getTime());
  if (f.arbeitsrecht?.fristEnde) t.push(parseISO(f.arbeitsrecht.fristEnde).getTime());
  if (t.length === 0) return Number.MAX_SAFE_INTEGER;
  return Math.min(...t);
}

function formatFristIso(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE');
}

/** Anzeige der konkreten Fristdaten (KSchG / WV) — gleiche Sichtbarkeit wie Spalte „Fristen / WV“ */
function FristDatumZelle({ fall, wvEffektiv }: { fall: Fall; wvEffektiv?: string }) {
  const hasFrist = Boolean(fall.arbeitsrecht?.fristEnde);
  const hasWv = Boolean(wvEffektiv);

  if (!hasFrist && !hasWv) {
    return (
      <Typography variant="caption" color="text.secondary">
        —
      </Typography>
    );
  }

  return (
    <Stack spacing={0.35} alignItems="flex-start">
      {hasFrist && fall.arbeitsrecht?.fristEnde && (
        <Typography variant="body2" color="text.secondary" component="div">
          <Typography component="span" variant="caption" color="text.disabled" sx={{ mr: 0.75, fontWeight: 700 }}>
            KSchG
          </Typography>
          {formatFristIso(fall.arbeitsrecht.fristEnde)}
        </Typography>
      )}
      {hasWv && wvEffektiv && (
        <Typography variant="body2" color="text.secondary" component="div">
          <Typography component="span" variant="caption" color="text.disabled" sx={{ mr: 0.75, fontWeight: 700 }}>
            WV
          </Typography>
          {formatFristIso(wvEffektiv)}
        </Typography>
      )}
    </Stack>
  );
}

interface FallListeProps {
  faelle: Fall[];
  mandantenMap?: Record<string, Mandant>;
  /** Frühester offener Wiedervorlagen-Termin pro Fall-Id (aus /api/wiedervorlagen) */
  naechsteWvByFallId?: Record<string, string>;
}

export default function FallListe({ faelle, mandantenMap = {}, naechsteWvByFallId = {} }: FallListeProps) {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortKey>('aktenzeichen');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sortiert = useMemo(() => {
    const list = [...faelle];
    const mul = sortDir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'aktenzeichen':
          cmp = a.aktenzeichen.localeCompare(b.aktenzeichen, 'de', { numeric: true, sensitivity: 'base' });
          break;
        case 'mandant':
          cmp = mandantAnzeige(mandantenMap[a.mandantId]).localeCompare(
            mandantAnzeige(mandantenMap[b.mandantId]), 'de', { sensitivity: 'base' }
          );
          break;
        case 'rechtsgebiet':
          cmp = a.rechtsgebiet.localeCompare(b.rechtsgebiet, 'de');
          break;
        case 'phase':
          cmp = a.phase - b.phase;
          break;
        case 'status':
          cmp = statusSortIndex(a) - statusSortIndex(b);
          break;
        case 'fristen':
          cmp = fristSortValue(a, naechsteWvByFallId) - fristSortValue(b, naechsteWvByFallId);
          break;
        case 'erstelltAm':
          cmp = parseISO(a.erstelltAm).getTime() - parseISO(b.erstelltAm).getTime();
          break;
        default:
          break;
      }
      if (cmp !== 0) return cmp * mul;
      return a.id.localeCompare(b.id);
    });
    return list;
  }, [faelle, sortBy, sortDir, naechsteWvByFallId]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: (t) => `1px solid ${t.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      <Table size="medium" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow sx={{ bgcolor: 'jurist.surfaceContainerLow' }}>
            <TableCell width="15%" sortDirection={sortBy === 'aktenzeichen' ? sortDir : false}>
              <TableSortLabel
                active={sortBy === 'aktenzeichen'}
                direction={sortBy === 'aktenzeichen' ? sortDir : 'asc'}
                onClick={() => handleSort('aktenzeichen')}
              >
                Aktenzeichen
              </TableSortLabel>
            </TableCell>
            <TableCell
              width="18%"
              sx={{ display: { xs: 'none', sm: 'table-cell' } }}
              sortDirection={sortBy === 'mandant' ? sortDir : false}
            >
              <TableSortLabel
                active={sortBy === 'mandant'}
                direction={sortBy === 'mandant' ? sortDir : 'asc'}
                onClick={() => handleSort('mandant')}
              >
                Mandant
              </TableSortLabel>
            </TableCell>
            <TableCell
              width="10%"
              sx={{ display: { xs: 'none', sm: 'table-cell' } }}
              sortDirection={sortBy === 'rechtsgebiet' ? sortDir : false}
            >
              <TableSortLabel
                active={sortBy === 'rechtsgebiet'}
                direction={sortBy === 'rechtsgebiet' ? sortDir : 'asc'}
                onClick={() => handleSort('rechtsgebiet')}
              >
                Gebiet
              </TableSortLabel>
            </TableCell>
            <TableCell
              width="9%"
              sx={{ display: { xs: 'none', md: 'table-cell' } }}
              sortDirection={sortBy === 'phase' ? sortDir : false}
            >
              <TableSortLabel
                active={sortBy === 'phase'}
                direction={sortBy === 'phase' ? sortDir : 'asc'}
                onClick={() => handleSort('phase')}
              >
                Phase
              </TableSortLabel>
            </TableCell>
            <TableCell width="13%" sortDirection={sortBy === 'status' ? sortDir : false}>
              <TableSortLabel
                active={sortBy === 'status'}
                direction={sortBy === 'status' ? sortDir : 'asc'}
                onClick={() => handleSort('status')}
              >
                Status
              </TableSortLabel>
            </TableCell>
            <TableCell
              sx={{ display: { xs: 'none', lg: 'table-cell' } }}
              sortDirection={sortBy === 'fristen' ? sortDir : false}
            >
              <TableSortLabel
                active={sortBy === 'fristen'}
                direction={sortBy === 'fristen' ? sortDir : 'asc'}
                onClick={() => handleSort('fristen')}
              >
                Fristen / WV
              </TableSortLabel>
            </TableCell>
            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }} width="12%">
              Fristdatum
            </TableCell>
            <TableCell
              sx={{ display: { xs: 'none', xl: 'table-cell' } }}
              sortDirection={sortBy === 'erstelltAm' ? sortDir : false}
            >
              <TableSortLabel
                active={sortBy === 'erstelltAm'}
                direction={sortBy === 'erstelltAm' ? sortDir : 'asc'}
                onClick={() => handleSort('erstelltAm')}
              >
                Angelegt
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortiert.map((fall) => {
            const hasFrist = Boolean(fall.arbeitsrecht?.fristEnde);
            const wvEff = effektiveWvIso(fall, naechsteWvByFallId);
            const hasWv = Boolean(wvEff);
            const mandant = mandantenMap[fall.mandantId];
            const iconColor = RECHTSGEBIET_ICON_COLOR[fall.rechtsgebiet];
            const rechtsgebietIcon = {
              verkehrsrecht: <DirectionsCarIcon fontSize="small" sx={{ color: iconColor }} />,
              arbeitsrecht: <WorkIcon fontSize="small" sx={{ color: iconColor }} />,
              zivilrecht: <BalanceIcon fontSize="small" sx={{ color: iconColor }} />,
              insolvenzrecht: <AccountBalanceIcon fontSize="small" sx={{ color: iconColor }} />,
              wettbewerbsrecht: <GavelIcon fontSize="small" sx={{ color: iconColor }} />,
              erbrecht: <FamilyRestroomIcon fontSize="small" sx={{ color: iconColor }} />,
            }[fall.rechtsgebiet];
            return (
              <TableRow
                key={fall.id}
                hover
                onClick={() => navigate(`/faelle/${fall.id}`)}
                sx={{
                  cursor: 'pointer',
                  '&:last-child td': { borderBottom: 0 },
                }}
              >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {rechtsgebietIcon}
                    <Typography variant="body2" fontWeight={700}>
                      {fall.aktenzeichen}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}
                  >
                    {(RECHTSGEBIET_LABELS[fall.rechtsgebiet] ?? fall.rechtsgebiet)} · Ph. {fall.phase}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <Typography variant="body2" noWrap>
                    {mandantAnzeige(mandant)}
                  </Typography>
                  {mandant?.kategorie === 'unternehmen' && (
                    <Typography variant="caption" color="text.secondary">Unternehmen</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <Chip
                    label={RECHTSGEBIET_SHORT[fall.rechtsgebiet] ?? fall.rechtsgebiet.slice(0, 2).toUpperCase()}
                    size="small"
                    variant="outlined"
                    sx={{ color: iconColor, borderColor: iconColor }}
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Typography variant="body2">{fall.phase}</Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={STATUS_LABELS[fall.status]}
                    color={STATUS_COLORS[fall.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {hasFrist && fall.arbeitsrecht?.fristEnde && (
                      <FristBadge fristEnde={fall.arbeitsrecht.fristEnde} label="KSchG" size="small" />
                    )}
                    {hasWv && wvEff && (
                      <FristBadge fristEnde={wvEff} label="WV" size="small" />
                    )}
                    {!hasFrist && !hasWv && (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  <FristDatumZelle fall={fall} wvEffektiv={wvEff} />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(fall.erstelltAm).toLocaleDateString('de-DE')}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
