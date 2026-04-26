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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import GavelIcon from '@mui/icons-material/Gavel';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useKanzleiStore } from '../../store/kanzleiStore';
import { useColorMode } from '../../theme/ColorModeContext';

const DRAWER_WIDTH = 288;
const DRAWER_COLLAPSED_WIDTH = 68;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon sx={{ fontSize: 20 }} />, path: '/' },
  { label: 'Fälle', icon: <FolderIcon sx={{ fontSize: 20 }} />, path: '/faelle' },
  { label: 'Kalender', icon: <CalendarMonthIcon sx={{ fontSize: 20 }} />, path: '/kalender' },
  { label: 'Mandanten', icon: <PersonIcon sx={{ fontSize: 20 }} />, path: '/mandanten' },
  { label: 'Parteien', icon: <GroupsIcon sx={{ fontSize: 20 }} />, path: '/parteien' },
  { label: 'Abrechnung', icon: <ReceiptLongIcon sx={{ fontSize: 20 }} />, path: '/abrechnung' },
  { label: 'Verwaltung', icon: <TuneIcon sx={{ fontSize: 20 }} />, path: '/verwaltung' },
];

const bottomNavItems = [
  { label: 'Einstellungen', icon: <SettingsIcon sx={{ fontSize: 20 }} />, path: '/einstellungen' },
];

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const daten = useKanzleiStore((s) => s.daten);
  const { mode, toggle } = useColorMode();
  const initials = daten.anwaltVorname && daten.anwaltNachname
    ? `${daten.anwaltVorname[0]}${daten.anwaltNachname[0]}`.toUpperCase()
    : daten.anwaltName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', pt: 1 }}>
      {!collapsed && (
        <Typography variant="overline" sx={{ px: 2, mb: 1, display: 'block' }}>
          Allgemein
        </Typography>
      )}
      <List sx={{ py: 0 }}>
        {navItems.map((item) => {
          const active =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <Tooltip title={item.label} placement="right" disableHoverListener={!collapsed}>
                <ListItemButton
                  selected={active}
                  onClick={() => {
                    navigate(item.path);
                    onNavigate();
                  }}
                  sx={{
                    mx: collapsed ? 0.75 : 1.5,
                    py: 1.25,
                    borderRadius: 999,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    minWidth: 0,
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
                      minWidth: collapsed ? 0 : 40,
                      color: active ? 'primary.main' : 'text.secondary',
                      mr: collapsed ? 0 : undefined,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: active ? 600 : 500,
                      }}
                    />
                  )}
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
                <Tooltip title={item.label} placement="right" disableHoverListener={!collapsed}>
                  <ListItemButton
                    selected={active}
                    onClick={() => { navigate(item.path); onNavigate(); }}
                    sx={{
                      mx: collapsed ? 0.75 : 1.5,
                      py: 1.25,
                      borderRadius: 999,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      '&.Mui-selected': {
                        bgcolor: 'jurist.surfaceContainerLowest',
                        color: 'text.primary',
                        boxShadow: '0 1px 3px rgba(12, 15, 16, 0.08)',
                        '&:hover': { bgcolor: 'jurist.surfaceContainerLowest' },
                      },
                      '&:hover': { bgcolor: 'jurist.surfaceContainerHigh' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, color: active ? 'primary.main' : 'text.secondary', mr: collapsed ? 0 : undefined }}>
                      {item.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 500 }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>

        {/* User-Profil-Button */}
        {collapsed ? (
          <Tooltip title={daten.anwaltVorname ? `${daten.anwaltVorname} ${daten.anwaltNachname}` : daten.anwaltName} placement="right">
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Avatar
                sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: 'primary.main', cursor: 'pointer' }}
                onClick={() => { navigate('/einstellungen'); onNavigate(); }}
              >
                {initials}
              </Avatar>
            </Box>
          </Tooltip>
        ) : (
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
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'primary.main', flexShrink: 0 }}>
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
        )}

        {/* Darkmode-Toggle */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 0 : 2,
            py: 0.75,
          }}
        >
          {!collapsed && (
            <Typography variant="caption" color="text.secondary">
              {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </Typography>
          )}
          <Tooltip title={mode === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'} placement="right">
            <IconButton
              size="small"
              onClick={toggle}
              aria-label={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              sx={{
                bgcolor: 'jurist.surfaceContainerHigh',
                '&:hover': { bgcolor: 'jurist.surfaceVariant' },
                width: 30,
                height: 30,
                color: mode === 'dark' ? 'warning.light' : 'text.secondary',
              }}
            >
              {mode === 'dark'
                ? <LightModeOutlinedIcon sx={{ fontSize: 16 }} />
                : <DarkModeOutlinedIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {!collapsed && (
          <Box sx={{ px: 2, pb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              v1.0.0 — Frontend
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerWidth = sidebarCollapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const drawerPaper = {
    width: drawerWidth,
    boxSizing: 'border-box' as const,
    bgcolor: 'jurist.surfaceContainerLow',
    color: 'text.primary',
    borderRight: 'none',
    px: 1,
    py: 2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  };

  const drawer = (
    <>
      <Box sx={{ px: sidebarCollapsed ? 0.5 : 2, pt: 1, pb: 2 }}>
        {sidebarCollapsed ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <GavelIcon sx={{ color: 'primary.main', fontSize: 26 }} />
          </Box>
        ) : (
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
        )}
      </Box>
      <NavList collapsed={sidebarCollapsed} onNavigate={() => setMobileOpen(false)} />
      {/* Collapse/Expand toggle at bottom */}
      <Box sx={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end', px: sidebarCollapsed ? 0 : 1.5, pb: 1 }}>
        <Tooltip title={sidebarCollapsed ? 'Menü ausklappen' : 'Menü einklappen'} placement="right">
          <IconButton
            size="small"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Menü ausklappen' : 'Menü einklappen'}
            sx={{
              bgcolor: 'jurist.surfaceContainerHigh',
              '&:hover': { bgcolor: 'jurist.surfaceContainer' },
              width: 28,
              height: 28,
            }}
          >
            {sidebarCollapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
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

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { ...drawerPaper, width: DRAWER_WIDTH },
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
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          pt: { xs: 8, md: 0 },
          px: { xs: 2, sm: 3, md: 6 },
          py: { xs: 2, md: 4 },
          bgcolor: 'background.default',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
