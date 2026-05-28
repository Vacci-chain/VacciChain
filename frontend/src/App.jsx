import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import PatientDashboard from './pages/PatientDashboard';
import IssuerDashboard from './pages/IssuerDashboard';
import VerifyPage from './pages/VerifyPage';
import AdminDashboard from './pages/AdminDashboard';
import IssuerOnboarding from './pages/IssuerOnboarding';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import { AuthProvider } from './hooks/useFreighter';
import { useDarkMode } from './hooks/useDarkMode';
import FreighterBanner from './components/FreighterBanner';
import DemoBanner from './components/DemoBanner';
import NavBar from './components/NavBar';

export default function App() {
  const [dark, setDark] = useDarkMode();

  return (
    <AuthProvider>
      <DemoBanner/>
      <NavBar dark={dark} onToggleDark={() => setDark((d) => !d)} />
      <FreighterBanner />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/patient" element={<PatientDashboard />} />
        <Route path="/issuer" element={<IssuerDashboard />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/apply" element={<IssuerOnboarding />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
      </Routes>
    </AuthProvider>
  );
}
