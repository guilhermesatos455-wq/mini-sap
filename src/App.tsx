import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuditProvider, useAudit } from './context/AuditContext';
import Layout from './components/Layout';
import UploadPage from './pages/Upload';
import DashboardPage from './pages/Dashboard';
import AuditDetailsPage from './pages/AuditDetails';
import ErrorBoundary from './components/ErrorBoundary';
import HistoryPage from './pages/History';
import SettingsPage from './pages/Settings';
import HelpPage from './pages/Help';
import PriceSimulatorPage from './pages/PriceSimulator';
import MovementsPage from './pages/Movements';
import MaterialDashboardPage from './pages/MaterialDashboard';
import RecipesPage from './pages/Recipes';
import AITermsPage from './pages/AITerms';
import { getDeviceId } from './utils/deviceUtils';
import { ShieldAlert } from 'lucide-react';

const BanGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bannedDevices } = useAudit();
  const [currentDeviceId, setCurrentDeviceId] = useState('');

  useEffect(() => {
    setCurrentDeviceId(getDeviceId());
  }, []);

  if (bannedDevices.includes(currentDeviceId)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl shadow-red-500/10">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Acesso Bloqueado</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            Este dispositivo foi bloqueado por um administrador. 
            Se você acredita que isso é um erro, entre em contato com o suporte técnico da Natulab.
          </p>
          <div className="p-3 bg-black/30 rounded-xl border border-slate-800 mb-6">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">ID do Dispositivo</p>
            <code className="text-xs text-red-400 font-mono">{currentDeviceId}</code>
          </div>
          <p className="text-xs text-slate-500 italic">
            NatuAssist Security System v1.2
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuditProvider>
      <BanGuard>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<UploadPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="details" element={
                <ErrorBoundary>
                  <AuditDetailsPage />
                </ErrorBoundary>
              } />
              <Route path="history" element={<HistoryPage />} />
              <Route path="movements" element={<MovementsPage />} />
              <Route path="material-dashboard" element={<MaterialDashboardPage />} />
              <Route path="simulator" element={<PriceSimulatorPage />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="help" element={<HelpPage />} />
              <Route path="ai-terms" element={<AITermsPage />} />
            </Route>
          </Routes>
        </Router>
      </BanGuard>
    </AuditProvider>
  );
};

export default App;
