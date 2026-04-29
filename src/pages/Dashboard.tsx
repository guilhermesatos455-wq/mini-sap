import React, { useMemo, useState, lazy, Suspense, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  ArrowRight,
  Download,
  FileX,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  Bell,
  Settings,
  LayoutGrid,
  List,
  Plus,
  Maximize2,
  Minimize2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { useNavigate } from 'react-router-dom';
import { generateAuditPDF } from '../utils/pdfGenerator';
import { generateAuditPPT } from '../utils/pptGenerator';
import { motion } from 'framer-motion';
import { safeLocalStorageSet } from '../utils/storageUtils';
import SummaryCards from '../components/dashboard/SummaryCards';
import AlertsSection from '../components/dashboard/AlertsSection';
import AIInsightCard from '../components/AIAssistant/AIInsightCard';
import StatCard from '../components/dashboard/StatCard';

// Lazy loaded components
const CfopChart = lazy(() => import('../components/dashboard/CfopChart'));
const TrendChart = lazy(() => import('../components/dashboard/TrendChart'));
const SupplierChart = lazy(() => import('../components/dashboard/SupplierChart'));
const SupplierTable = lazy(() => import('../components/dashboard/SupplierTable'));
const TopLossesList = lazy(() => import('../components/dashboard/TopLossesList'));
const ParetoChart = lazy(() => import('../components/dashboard/ParetoChart'));

const ChartSkeleton = ({ darkMode }: { darkMode: boolean }) => (
  <div className={`w-full h-[350px] animate-pulse rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
);

const DashboardPage: React.FC = () => {
  const { 
    resultado, 
    darkMode, 
    isProcessing, 
    status, 
    progressPercent, 
    historico, 
    setFilterCfopDefault, 
    setFilterSupplierDefault, 
    setFilterTipoDefault,
    alertSettings,
    currency,
    showOnboarding,
    setShowOnboarding,
    showFinancialImpact,
    isPresentationMode,
    setIsPresentationMode,
    syncSapStatus,
    syncSapLastDate,
    syncSapData,
    addToast
  } = useAudit();

  const formatoMoeda = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: currency || 'BRL' 
    });
  }, [currency]);

  const navigate = useNavigate();
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const [suppliersPage, setSuppliersPage] = useState(1);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const suppliersPerPage = 10;

  const supplierSummary = useMemo(() => {
    if (!resultado) return [];
    const summary: Record<string, any> = {};
    resultado.divergencias.forEach((d: any) => {
      if (!summary[d.fornecedor]) summary[d.fornecedor] = { name: d.fornecedor, count: 0, prejuizo: 0, economia: 0 };
      summary[d.fornecedor].count++;
      if (d.tipo === 'acima do custo padrão') summary[d.fornecedor].prejuizo += d.impactoFinanceiro;
      else summary[d.fornecedor].economia += Math.abs(d.impactoFinanceiro);
    });
    return Object.values(summary).sort((a, b) => b.prejuizo - a.prejuizo);
  }, [resultado]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return supplierSummary;
    return supplierSummary.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase())
    );
  }, [supplierSummary, supplierSearch]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (suppliersPage - 1) * suppliersPerPage;
    return filteredSuppliers.slice(startIndex, startIndex + suppliersPerPage);
  }, [filteredSuppliers, suppliersPage]);

  const totalSupplierPages = Math.ceil(filteredSuppliers.length / suppliersPerPage);

  const cfopData = useMemo(() => {
    if (!resultado) return [];
    const summary: Record<string, any> = {};
    resultado.divergencias.forEach((d: any) => {
      if (!summary[d.cfop]) summary[d.cfop] = { cfop: d.cfop, prejuizo: 0, economia: 0 };
      if (d.tipo === 'acima do custo padrão') summary[d.cfop].prejuizo += d.impactoFinanceiro;
      else if (d.tipo === 'abaixo do custo padrão') summary[d.cfop].economia += Math.abs(d.impactoFinanceiro);
    });
    return Object.values(summary).sort((a, b) => (b.prejuizo + b.economia) - (a.prejuizo + a.economia));
  }, [resultado]);

  const topLosses = useMemo(() => {
    if (!resultado) return [];
    return resultado.divergencias
      .filter((d: any) => d.tipo === 'acima do custo padrão')
      .sort((a: any, b: any) => b.impactoFinanceiro - a.impactoFinanceiro)
      .slice(0, 5);
  }, [resultado]);

  const handleDrillDown = (type: 'cfop' | 'supplier', value: string, tipo?: string) => {
    if (type === 'cfop') {
      setFilterCfopDefault(value);
      setFilterSupplierDefault('');
    } else {
      setFilterSupplierDefault(value);
      setFilterCfopDefault('');
    }
    
    if (tipo) {
      setFilterTipoDefault(tipo);
    } else {
      setFilterTipoDefault('Todos');
    }
    
    navigate('/details');
  };

  const trendData = useMemo(() => {
    if (!historico || historico.length === 0) return [];
    // Reverse to show chronological order (oldest to newest)
    return [...historico].reverse().map(item => ({
      data: item.data.split(',')[0],
      prejuizo: item.totalPrejuizo,
      economia: item.totalEconomia,
      liquido: item.totalPrejuizo - item.totalEconomia
    }));
  }, [historico]);

  const handleExportCSV = useCallback(() => {
    if (!supplierSummary.length) return;

    const headers = ['Fornecedor', 'Qtd Divergencias', 'Acima do Custo Padrão', 'Abaixo do Custo Padrão', 'Impacto Liquido'];
    const rows = supplierSummary.map(item => [
      item.name,
      item.count,
      item.prejuizo.toFixed(2),
      item.economia.toFixed(2),
      (item.prejuizo - item.economia).toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Resumo_Fornecedores_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [supplierSummary]);

  const handleExportPDF = useCallback(() => {
    if (!resultado || !supplierSummary.length) return;
    generateAuditPDF(resultado, supplierSummary);
  }, [resultado, supplierSummary]);

  const handleExportPPT = useCallback(() => {
    if (!resultado || !supplierSummary.length) return;
    generateAuditPPT(resultado, supplierSummary);
    addToast('Apresentação PowerPoint gerada com sucesso!', 'success');
  }, [resultado, supplierSummary, addToast]);

  const alerts = useMemo(() => {
    if (!resultado) return [];
    const foundAlerts: any[] = [];
    
    resultado.divergencias.forEach((d: any) => {
      // Impacto financeiro alto alto para um caraia
      if (d.tipo === 'acima do custo padrão' && d.impactoFinanceiro >= alertSettings.impactoMinimoAlerta) {
        foundAlerts.push({
          id: d.id,
          type: 'Impacto Crítico',
          message: `${formatoMoeda.format(d.impactoFinanceiro)} no material ${d.material}`,
          severity: 'high',
          filters: { supplier: d.fornecedor, material: d.material }
        });
      }
      
      // Variação percentual alta que so a porra
      if (Math.abs(d.variacaoPerc) >= alertSettings.variacaoMinimaAlerta) {
        foundAlerts.push({
          id: d.id,
          type: 'Variação Alta',
          message: `${d.variacaoPerc.toFixed(2)}% no material ${d.material}`,
          severity: 'medium',
          filters: { supplier: d.fornecedor, material: d.material }
        });
      }

      // Fornecedor como valor crítico eu em estado de risco
      if (alertSettings.fornecedoresCriticos.some(s => d.fornecedor.includes(s))) {
        foundAlerts.push({
          id: d.id,
          type: 'Fornecedor Crítico',
          message: `Divergência detectada: ${d.fornecedor}`,
          severity: 'high',
          filters: { supplier: d.fornecedor }
        });
      }
    });

    return foundAlerts.slice(0, 10); // Limit to top 10 alerts
  }, [resultado, alertSettings, formatoMoeda]);

  const handleFinishOnboarding = () => {
    setShowOnboarding(false);
    safeLocalStorageSet('miniSapOnboardingDone', 'true');
  };

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-8 border-[#8DC63F]/20 rounded-full"></div>
          <div 
            className="absolute inset-0 border-8 border-[#8DC63F] rounded-full border-t-transparent animate-spin"
            style={{ animationDuration: '1.5s' }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center font-bold text-[#8DC63F]">
            {progressPercent}%
          </div>
        </div>
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Processando Auditoria...</h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{status}</p>
        </div>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className={`p-8 rounded-3xl border-2 border-dashed mb-6 ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-200 bg-gray-50'}`}>
          <Plus className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-slate-700' : 'text-gray-300'}`} />
          <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-slate-200' : 'text-gray-900'}`}>Nenhuma Auditoria Ativa</h2>
          <p className={`max-w-xs mx-auto ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Inicie uma nova auditoria carregando seus arquivos Excel para visualizar o dashboard.
          </p>
        </div>
        <button 
          onClick={() => navigate('/upload')}
          className="flex items-center gap-2 px-8 py-4 bg-[#8DC63F] hover:bg-[#78AF32] text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Auditoria
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-8 relative ${isPresentationMode ? 'p-8 min-h-screen' : ''}`}>
      {/* Presentation Mode Overlay */}
      {isPresentationMode && (
        <div className="fixed top-6 right-6 z-[110] flex gap-2">
          <button 
            onClick={() => setIsPresentationMode(false)}
            className="p-3 bg-red-500 text-white rounded-full shadow-2xl hover:bg-red-600 transition-all hover:scale-110"
            title="Sair do Modo Apresentação"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Onboarding Overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-lg p-8 rounded-3xl shadow-2xl text-center space-y-6 ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="w-20 h-20 bg-[#8DC63F]/20 rounded-full flex items-center justify-center mx-auto">
              <TrendingUp className="w-10 h-10 text-[#8DC63F]" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bem-vindo ao Mini-SAP!</h2>
              <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Este é o seu motor de auditoria inteligente. Aqui você pode identificar divergências de preços, economias potenciais e fornecedores críticos em segundos.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">1. Carregue os Dados</p>
                  <p className="text-[10px] text-slate-500">Suba suas NFs e o relatório CKM3 do SAP.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">2. Configure Colunas</p>
                  <p className="text-[10px] text-slate-500">Mapeie as letras das colunas do seu Excel.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#8DC63F]/10 text-[#8DC63F]">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">3. Analise Resultados</p>
                  <p className="text-[10px] text-slate-500">Veja o impacto financeiro e exporte relatórios.</p>
                </div>
              </div>
            </div>
            <button 
              onClick={handleFinishOnboarding}
              className="w-full py-4 bg-[#8DC63F] text-white rounded-2xl font-bold hover:bg-[#78AF32] transition-all shadow-lg shadow-[#8DC63F]/20"
            >
              Começar Agora
            </button>
          </div>
        </div>
      )}

      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isPresentationMode ? 'hidden' : ''}`}>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
              Dashboard Executivo
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${darkMode ? 'bg-[#8DC63F]/10 text-[#8DC63F]' : 'bg-green-100 text-green-700'}`}>
              Live
            </span>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            Análise consolidada de divergências e impactos financeiros.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 p-1 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <button 
              onClick={() => setIsPresentationMode(true)}
              className={`p-2 rounded-lg transition-all ${darkMode ? 'text-slate-500 hover:text-[#8DC63F]' : 'text-gray-400 hover:text-[#78AF32]'}`}
              title="Modo Apresentação"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-1" />
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? (darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-gray-100 text-[#78AF32]') : (darkMode ? 'text-slate-500' : 'text-gray-400')}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-gray-100 text-[#78AF32]') : (darkMode ? 'text-slate-500' : 'text-gray-400')}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <button 
              onClick={syncSapData}
              disabled={syncSapStatus === 'syncing'}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${syncSapStatus === 'syncing' ? 'opacity-50 cursor-not-allowed' : ''} ${darkMode ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100'}`}
            >
              <RefreshCw className={`w-4 h-4 ${syncSapStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncSapStatus === 'syncing' ? 'Sincronizando...' : 'Sincronizar SAP'}
            </button>
            {syncSapLastDate && (
              <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                Última sincronização: {new Date(syncSapLastDate).toLocaleString('pt-BR')}
              </span>
            )}
          </div>

          <button 
            onClick={() => navigate('/upload')}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#8DC63F] hover:bg-[#78AF32] text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Auditoria
          </button>
          <button 
            onClick={handleExportPDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700' : 'bg-white text-[#78AF32] border border-gray-200 hover:bg-gray-50'}`}
          >
            <FileText className="w-4 h-4" /> Exportar PDF
          </button>
          <button 
            onClick={handleExportPPT}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-slate-800 text-orange-400 hover:bg-slate-700' : 'bg-white text-orange-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            <Download className="w-4 h-4" /> Exportar PPT
          </button>
        </div>
      </header>

      {/* Summary Section */}
      <SummaryCards 
        resultado={resultado} 
        darkMode={darkMode} 
        formatCurrency={(val) => formatoMoeda.format(val)} 
        showFinancialImpact={showFinancialImpact}
      />

      {/* NatuAssist Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AIInsightCard 
          title="Anomalia de Preço Detectada"
          description="O material MAT-0001 apresentou uma variação de 15% acima do custo padrão no fornecedor X. Este padrão se repete em 3 das últimas 5 notas."
          type="warning"
          actionLabel="Ver detalhes"
          onAction={() => navigate('/details')}
        />
        <AIInsightCard 
          title="Otimização de Estoque"
          description="Com base no MB51, o material MAT-0002 tem giro baixo. Sugerimos reduzir o estoque de segurança em 10% para liberar capital."
          type="info"
          actionLabel="Analisar movimentos"
          onAction={() => navigate('/movements')}
        />
        <AIInsightCard 
          title="Conformidade Fiscal"
          description="Todos os CFOPs de entrada estão alinhados com as regras de negócio da planta 1000 para este período."
          type="success"
        />
      </div>

      {/* Alerts Section */}
      <AlertsSection 
        alerts={alerts} 
        darkMode={darkMode} 
        onDrillDown={(filters) => {
          if (filters.supplier) setFilterSupplierDefault(filters.supplier);
          navigate('/details');
        }} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {showFinancialImpact && (
          <Suspense fallback={<ChartSkeleton darkMode={darkMode} />}>
            <CfopChart 
              cfopData={cfopData} 
              darkMode={darkMode} 
              formatoMoeda={formatoMoeda} 
              handleDrillDown={handleDrillDown} 
            />
          </Suspense>
        )}

        {showFinancialImpact && (
          <Suspense fallback={<ChartSkeleton darkMode={darkMode} />}>
            <TrendChart 
              trendData={trendData} 
              darkMode={darkMode} 
              formatoMoeda={formatoMoeda} 
            />
          </Suspense>
        )}

        {showFinancialImpact && (
          <Suspense fallback={<ChartSkeleton darkMode={darkMode} />}>
            <ParetoChart 
              data={supplierSummary} 
              darkMode={darkMode} 
              formatoMoeda={formatoMoeda} 
            />
          </Suspense>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {showFinancialImpact && (
          <Suspense fallback={<ChartSkeleton darkMode={darkMode} />}>
            <SupplierChart 
              supplierSummary={supplierSummary} 
              darkMode={darkMode} 
              formatoMoeda={formatoMoeda} 
              handleDrillDown={handleDrillDown}
            />
          </Suspense>
        )}

        <Suspense fallback={<ChartSkeleton darkMode={darkMode} />}>
          <SupplierTable 
            supplierSummary={supplierSummary} 
            darkMode={darkMode} 
            formatoMoeda={formatoMoeda} 
            handleDrillDown={handleDrillDown} 
            setShowAllSuppliers={setShowAllSuppliers} 
            showFinancialImpact={showFinancialImpact}
          />
        </Suspense>

        {showFinancialImpact && (
          <Suspense fallback={<ChartSkeleton darkMode={darkMode} />}>
            <TopLossesList 
              topLosses={topLosses} 
              darkMode={darkMode} 
              formatoMoeda={formatoMoeda} 
            />
          </Suspense>
        )}

        {/* Supplier Analysis Section (Recommendation 3) */}
        {showFinancialImpact && (
          <section className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`flex items-center gap-2 text-lg font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
                <TrendingUp className="w-5 h-5" />
                Análise de Fornecedores Ofensores
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Top 5 Impacto Financeiro
              </span>
            </div>
            <div className="space-y-4">
              {supplierSummary.slice(0, 5).map((s, i) => {
                const totalImpacto = s.prejuizo + s.economia;
                const percPrejuizo = (s.prejuizo / totalImpacto) * 100;
                return (
                  <div key={i} className={`p-4 rounded-xl border transition-all hover:border-[#8DC63F]/50 ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-gray-400 shadow-sm'}`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>{s.name}</p>
                          <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{s.count} divergências detectadas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-500">{formatoMoeda.format(s.prejuizo)}</p>
                        <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Impacto Acima do Custo</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className="text-red-400">Acima do Custo Padrão</span>
                        <span className="text-[#8DC63F]">Abaixo do Custo Padrão</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden flex ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${percPrejuizo}%` }}></div>
                        <div className="h-full bg-[#8DC63F] transition-all duration-500" style={{ width: `${100 - percPrejuizo}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Suppliers Modal */}
      {showAllSuppliers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-transparent flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Todos os Fornecedores</h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Listagem completa de fornecedores com divergências</p>
              </div>
              <button 
                onClick={() => setShowAllSuppliers(false)}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-transparent">
              <div className="relative">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  placeholder="Buscar fornecedor..."
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setSuppliersPage(1);
                  }}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'bg-gray-50 border-gray-200 focus:ring-[#8DC63F]/50'}`}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <table className="w-full text-left">
                <thead>
                  <tr className={`text-xs uppercase tracking-wider font-bold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    <th className="pb-4">Fornecedor</th>
                    <th className="pb-4 text-right">Divergências</th>
                    {showFinancialImpact && (
                      <>
                        <th className="pb-4 text-right">Acima do Custo Padrão</th>
                        <th className="pb-4 text-right">Abaixo do Custo Padrão</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-transparent">
                  {paginatedSuppliers.map((s, i) => (
                    <tr 
                      key={i} 
                      className={`group transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}
                      onClick={() => {
                        handleDrillDown('supplier', s.name);
                        setShowAllSuppliers(false);
                      }}
                    >
                      <td className={`py-4 font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>{s.name}</td>
                      <td className={`py-4 text-right ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{s.count}</td>
                      {showFinancialImpact && (
                        <>
                          <td className="py-4 text-right font-bold text-red-500">
                            {formatoMoeda.format(s.prejuizo)}
                          </td>
                          <td className="py-4 text-right font-bold text-[#8DC63F]">
                            {formatoMoeda.format(s.economia)}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {paginatedSuppliers.length === 0 && (
                <div className="py-12 text-center">
                  <p className={darkMode ? 'text-slate-500' : 'text-gray-400'}>Nenhum fornecedor encontrado.</p>
                </div>
              )}
            </div>

            <div className={`p-6 border-t flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Mostrando <span className="font-bold">{paginatedSuppliers.length}</span> de <span className="font-bold">{filteredSuppliers.length}</span> fornecedores
              </p>
              <div className="flex items-center gap-2">
                <button 
                  disabled={suppliersPage === 1}
                  onClick={() => setSuppliersPage(p => p - 1)}
                  className={`p-2 rounded-lg transition-all disabled:opacity-30 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className={`text-sm font-bold px-4 ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                  Página {suppliersPage} de {totalSupplierPages || 1}
                </span>
                <button 
                  disabled={suppliersPage === totalSupplierPages || totalSupplierPages === 0}
                  onClick={() => setSuppliersPage(p => p + 1)}
                  className={`p-2 rounded-lg transition-all disabled:opacity-30 ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
