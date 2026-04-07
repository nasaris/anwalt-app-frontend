import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Typography, Button } from '@mui/material';
import AppLayout from './components/Layout/AppLayout';
import { juristTheme } from './theme/juristTheme';
import Dashboard from './pages/Dashboard/Dashboard';
import Faelle from './pages/Faelle/Faelle';
import FallDetail from './pages/FallDetail/FallDetail';
import FallNeu from './pages/FallNeu/FallNeu';
import Mandanten from './pages/Mandanten/Mandanten';
import MandantenDetail from './pages/Mandanten/MandantenDetail';
import Parteien from './pages/Parteien/Parteien';
import Kalender from './pages/Kalender/Kalender';
import Einstellungen from './pages/Einstellungen/Einstellungen';

function NotFound() {
  const navigate = useNavigate();
  return (
    <Box textAlign="center" py={10}>
      <Typography variant="h4" fontWeight={700} gutterBottom>404</Typography>
      <Typography color="text.secondary" gutterBottom>Seite nicht gefunden.</Typography>
      <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
        Zum Dashboard
      </Button>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={juristTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/faelle" element={<Faelle />} />
            <Route path="/faelle/neu" element={<FallNeu />} />
            <Route path="/faelle/:id" element={<FallDetail />} />
            <Route path="/mandanten" element={<Mandanten />} />
            <Route path="/mandanten/:id" element={<MandantenDetail />} />
            <Route path="/parteien" element={<Parteien />} />
            <Route path="/kalender" element={<Kalender />} />
            <Route path="/einstellungen" element={<Einstellungen />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
