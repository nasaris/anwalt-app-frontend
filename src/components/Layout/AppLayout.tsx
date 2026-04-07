import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelIcon from '@mui/icons-material/Gavel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import { useKanzleiStore } from '../../store/kanzleiStore';

const DRAWER_WIDTH = 288;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: '/' },
  { label: 'Fälle', icon: <FolderIcon sx={{ fontSize: 20 }} />, path: '/faelle' },
  { label: 'Kalender', icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />, path: '/kalender' },
  { label: 'Mandanten', icon: <PersonIcon sx={{ fontSize: 20 }} />, path: '/mandanten' },
  { label: 'Parteien', icon: <GroupsIcon sx={{ fontSize: 20 }} />, path: '/parteien' },
];

const bottomNavItems = [
  { label: 'Einstellungen', icon: <SettingsIcon sx={{ fontSize: 20 }} />, path: '/einstellungen' },
];

function NavList({
  onNavigate,
}: {
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const daten = useKanzleiStore((s) => s.daten);
  const initials = daten.anwaltVorname && daten.anwaltNachname
    ? `${daten.anwaltVorname[0]}${daten.anwaltNachname[0]}`.toUpperCase()
    : daten.anwaltName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', pt: 1 }}>
      <Typography variant="overline" sx={{ px: 2, mb: 1, display: 'block' }}>
        Allgemein
      </Typography>
      <List sx={{ py: 0 }}>
        {navItems.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={item.label} placement="right">
                <ListItemButton
                  selected={active}
                  onClick={() => {
                    navigate(item.path);
                    onNavigate();
                  }}
                  sx={{
                    mx: 1.5,
                    py: 1.25,
                    borderRadius: 999,
                    '&.Mui-selected': {
                      bgcolor: 'jurist.surfaceContainerLowest',
                      color: 'text.primary',
                      boxShadow: '0 1px 3px rgba(12, 15, 16, 0.08)',
                      '&:hover': {
                        bgcolor: 'jurist.surfaceContainerLowest',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'jurist.surfaceContainerHigh',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? 'primary.main' : 'text.secondary',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ mt: 'auto' }}>
        <List sx={{ py: 0 }}>
          {bottomNavItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={item.label} placement="right">
                  <ListItemButton
                    selected={active}
                    onClick={() => { navigate(item.path); onNavigate(); }}
                    sx={{
                      mx: 1.5,
                      py: 1.25,
                      borderRadius: 999,
                      '&.Mui-selected': {
                        bgcolor: 'jurist.surfaceContainerLowest',
                        color: 'text.primary',
                        boxShadow: '0 1px 3px rgba(12, 15, 16, 0.08)',
                        '&:hover': { bgcolor: 'jurist.surfaceContainerLowest' },
                      },
                      '&:hover': { bgcolor: 'jurist.surfaceContainerHigh' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, color: active ? 'primary.main' : 'text.secondary' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                    />
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
        {/* User-Profil-Button */}
        <Tooltip title="Profil-Einstellungen" placement="right">
          <ListItemButton
            selected={location.pathname.startsWith('/einstellungen')}
            onClick={() => { navigate('/einstellungen'); onNavigate(); }}
            sx={{
              mx: 1.5,
              mb: 1,
              py: 1,
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '&.Mui-selected': {
                bgcolor: 'jurist.surfaceContainerLowest',
                boxShadow: '0 1px 3px rgba(12,15,16,0.08)',
                '&:hover': { bgcolor: 'jurist.surfaceContainerLowest' },
              },
              '&:hover': { bgcolor: 'jurist.surfaceContainerHigh' },
            }}
          >
            <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.main' }}>
              {initials}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="caption" fontWeight={600} noWrap display="block" lineHeight={1.3}>
                {daten.anwaltVorname && daten.anwaltNachname
                  ? `${daten.anwaltVorname} ${daten.anwaltNachname}`
                  : daten.anwaltName}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block" lineHeight={1.2} fontSize="0.68rem">
                {daten.anwaltTitel}
              </Typography>
            </Box>
          </ListItemButton>
        </Tooltip>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            v1.0.0 — Frontend
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerPaper = {
    width: DRAWER_WIDTH,
    boxSizing: 'border-box' as const,
    bgcolor: 'jurist.surfaceContainerLow',
    color: 'text.primary',
    borderRight: 'none',
    px: 1,
    py: 2,
    display: 'flex',
    flexDirection: 'column',
  };

  const drawer = (
    <>
      <Box sx={{ px: 2, pt: 1, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <GavelIcon sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Manrope", sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              flex: 1,
            }}
          >
            Der Jurist
          </Typography>
          <Chip label="DEMO" size="small" color="warning" variant="filled" />
        </Box>
      </Box>
      <NavList onNavigate={() => setMobileOpen(false)} />
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isMobile && (
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            bgcolor: 'background.default',
            color: 'text.primary',
            borderBottom: 'none',
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Menü öffnen"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontFamily: '"Manrope", sans-serif', fontWeight: 700 }}>
              Der Jurist
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaper,
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { ...drawerPaper, position: 'fixed' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          pt: { xs: 8, md: 0 },
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 2, md: 4 },
          bgcolor: 'background.default',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
