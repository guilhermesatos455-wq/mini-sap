import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Percent, 
  Hash, 
  Layout as LayoutIcon,
  Save,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronDown,
  Check,
  Globe,
  Copy,
  ExternalLink,
  Bell,
  Users,
  Upload,
  Download,
  Mail,
  Ban,
  Unlock,
  Key,
  Moon,
  Sun,
  Fingerprint,
  Terminal
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { Link } from 'react-router-dom';
import { requestBiometricAuth } from '../utils/biometricUtils';

const SettingsPage: React.FC = () => {
  const { 
    darkMode, setDarkMode,
    tolerancia, setTolerancia, 
    cfops, setCfops,
    mapColunas, setMapColunas,
    customPresets, saveCustomPreset, deleteCustomPreset,
    alertSettings, setAlertSettings,
    branding, setBranding,
    currency, setCurrency,
    notificationSettings, setNotificationSettings,
    showFinancialImpact, setShowFinancialImpact,
    taxMatrix, setTaxMatrix,
    registeredUsers,
    registerUser,
    bannedDevices,
    banDevice,
    unbanDevice,
    addToast
  } = useAudit();

  // Local state for explicit saving
  const [localTolerancia, setLocalTolerancia] = useState(tolerancia);
  const [localCfops, setLocalCfops] = useState(cfops);
  const [localMapColunas, setLocalMapColunas] = useState(mapColunas);
  const [localAlertSettings, setLocalAlertSettings] = useState(alertSettings);
  const [localBranding, setLocalBranding] = useState(branding);
  const [localCurrency, setLocalCurrency] = useState(currency);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings);
  const [localShowFinancialImpact, setLocalShowFinancialImpact] = useState(showFinancialImpact);
  const [localTaxMatrix, setLocalTaxMatrix] = useState(taxMatrix);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showDevMode, setShowDevMode] = useState(false);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricCountdown, setBiometricCountdown] = useState(15);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync local state if context changes (e.g. on mount or reset)
  useEffect(() => {
    setLocalTolerancia(tolerancia);
    setLocalCfops(cfops);
    setLocalMapColunas(mapColunas);
    setLocalAlertSettings(alertSettings);
    setLocalBranding(branding);
    setLocalCurrency(currency);
    setLocalNotificationSettings(notificationSettings);
    setLocalShowFinancialImpact(showFinancialImpact);
    setLocalTaxMatrix(taxMatrix);
  }, [tolerancia, cfops, mapColunas, alertSettings, branding, currency, notificationSettings, showFinancialImpact, taxMatrix]);

  const presets = {
    'padrao': { name: 'Padrão Mini-SAP', map: { ckm3Mat: 'C', ckm3Custo: 'L', ckm3Centro: 'C', ckm3Desc: 'D', ckm3Categoria: 'G', ckm3CategoriaFiltro: ['Entradas'], ckm3Processo: 'H', ckm3ProcessoFiltro: [], nfCfop: 'H', nfMat: 'K', nfPreco: 'T', nfQtd: 'U', nfFornecedor: 'E', nfCentro: 'C', nfDesc: 'L' } },
    'sap_ecc': { name: 'SAP ECC (Padrão)', map: { ckm3Mat: 'A', ckm3Custo: 'D', ckm3Centro: 'B', ckm3Desc: 'C', ckm3Categoria: 'G', ckm3CategoriaFiltro: ['Entradas'], ckm3Processo: 'H', ckm3ProcessoFiltro: [], nfCfop: 'E', nfMat: 'F', nfPreco: 'G', nfQtd: 'H', nfFornecedor: 'C', nfCentro: 'B', nfDesc: 'D' } },
    'totvs': { name: 'TOTVS Protheus', map: { ckm3Mat: 'B', ckm3Custo: 'E', ckm3Centro: 'A', ckm3Desc: 'C', ckm3Categoria: 'G', ckm3CategoriaFiltro: ['Entradas'], ckm3Processo: 'H', ckm3ProcessoFiltro: [], nfCfop: 'C', nfMat: 'D', nfPreco: 'F', nfQtd: 'G', nfFornecedor: 'A', nfCentro: 'B', nfDesc: 'E' } }
  };

  const applyPreset = (map: any) => {
    setLocalMapColunas(map);
    addToast('Preset aplicado localmente. Não esqueça de salvar!', 'info');
  };

  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) {
      addToast('Por favor, digite um nome para o mapeamento.', 'error');
      return;
    }
    saveCustomPreset(newPresetName, localMapColunas);
    setNewPresetName('');
    addToast(`Mapeamento "${newPresetName}" salvo com sucesso!`, 'success');
  };

  const resetToDefault = () => {
    if (window.confirm('Deseja resetar todas as configurações para o padrão?')) {
      setTolerancia(0);
      setCfops('1101AA, 1117AA, 1407AA, 1556AA');
      setMapColunas(presets.padrao.map);
      // Success message for reset
      setShowSuccess(true);
      addToast('Configurações resetadas para o padrão.', 'success');
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleSave = () => {
    setTolerancia(localTolerancia);
    setCfops(localCfops);
    setMapColunas(localMapColunas);
    setAlertSettings(localAlertSettings);
    setBranding(localBranding);
    setCurrency(localCurrency);
    setNotificationSettings(localNotificationSettings);
    setShowFinancialImpact(localShowFinancialImpact);
    setTaxMatrix(localTaxMatrix);
    
    // Show success feedback
    setShowSuccess(true);
    addToast('Configurações salvas com sucesso!', 'success');
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleExportSettings = () => {
    const settings = {
      tolerancia: localTolerancia,
      cfops: localCfops,
      mapColunas: localMapColunas,
      alertSettings: localAlertSettings,
      branding: localBranding,
      currency: localCurrency,
      notificationSettings: localNotificationSettings,
      customPresets: customPresets,
      version: '1.0',
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mini-sap-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Configurações exportadas com sucesso!', 'success');
  };

  const handleExportToVisio = () => {
    if (registeredUsers.length === 0) {
      addToast('Não há usuários para exportar.', 'info');
      return;
    }
    const headers = ['Matricula', 'Nome', 'Data Registro'];
    const rows = registeredUsers.map(u => [u.matricula, u.nome, u.dataRegistro]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `usuarios_natuassist_visio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Usuários exportados com sucesso!', 'success');
  };

  const handleSendEmailToGuilherme = async () => {
    if (registeredUsers.length === 0) {
      addToast('Não há usuários para enviar.', 'info');
      return;
    }

    const headers = ['Matricula', 'Nome', 'Data Registro'];
    const rows = registeredUsers.map(u => [u.matricula, u.nome, u.dataRegistro]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'guilhermesouza@natulab.com.br',
          subject: 'Relatório de Usuários NatuAssist',
          text: `Olá Guilherme,\n\nSegue em anexo o relatório de usuários cadastrados no NatuAssist até ${new Date().toLocaleDateString()}.\n\nTotal de usuários: ${registeredUsers.length}`,
          attachments: [
            {
              filename: `usuarios_natuassist_${new Date().toISOString().split('T')[0]}.csv`,
              content: csvContent
            }
          ]
        })
      });

      const data = await response.json();
      if (data.success) {
        addToast('E-mail enviado com sucesso para Guilherme!', 'success');
      } else {
        addToast(data.error || 'Erro ao enviar e-mail.', 'error');
      }
    } catch (error) {
      addToast('Erro de conexão com o servidor.', 'error');
    }
  };

  const handleLogout = () => {
    // ... logic
  };

  const handleDevAccess = async () => {
    if (showDevMode) {
      setShowDevMode(false);
      addToast('Modo Desenvolvedor desativado.', 'info');
      return;
    }

    setIsBiometricModalOpen(true);
    setBiometricCountdown(15);

    const timer = setInterval(() => {
      setBiometricCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const success = await requestBiometricAuth();
      clearInterval(timer);
      setIsBiometricModalOpen(false);
      
      if (success) {
        setShowDevMode(true);
        addToast('Acesso DEV concedido!', 'success');
      } else {
        addToast('Falha na autenticação biométrica ou tempo esgotado.', 'error');
      }
    } catch (error) {
      clearInterval(timer);
      setIsBiometricModalOpen(false);
      addToast('Erro na autenticação.', 'error');
    }
  };
  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const settings = JSON.parse(event.target?.result as string);
        
        // Basic validation
        if (!settings.mapColunas || !settings.cfops) {
          throw new Error('Arquivo de configurações inválido. Certifique-se de que é um arquivo exportado pelo sistema.');
        }
        
        if (settings.tolerancia !== undefined) setLocalTolerancia(settings.tolerancia);
        if (settings.cfops !== undefined) setLocalCfops(settings.cfops);
        if (settings.mapColunas !== undefined) setLocalMapColunas(settings.mapColunas);
        if (settings.alertSettings !== undefined) setLocalAlertSettings(settings.alertSettings);
        if (settings.branding !== undefined) setLocalBranding(settings.branding);
        if (settings.currency !== undefined) setLocalCurrency(settings.currency);
        if (settings.notificationSettings !== undefined) setLocalNotificationSettings(settings.notificationSettings);
        
        if (settings.customPresets) {
          Object.entries(settings.customPresets).forEach(([name, map]) => {
            saveCustomPreset(name, map as any);
          });
        }

        addToast('Configurações carregadas! Clique em "Salvar Alterações" para aplicar permanentemente.', 'success');
      } catch (err) {
        addToast('Erro ao importar configurações: ' + (err instanceof Error ? err.message : 'Arquivo inválido'), 'error');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const ckm3CategoriaOptions = [
    { label: 'Consumo', value: 'Consumo' },
    { label: 'Entradas', value: 'Entradas' },
    { label: 'Estoque final', value: 'Estoque final' },
    { label: 'Estoque inicial', value: 'Estoque inicial' },
    { label: 'Não alocado', value: 'Não alocado' },
    { label: 'Estoque acumulado', value: 'Estoque acumulado' },
    { label: 'Outras entradas/consumos', value: 'Outras entradas/consumos' },
    { label: 'Modificações de preço', value: 'Modificações de preço' }
  ];

  const ckm3ProcessoOptions = [
    { label: 'Centro de custo', value: 'Centro de custo' },
    { label: 'Consumo', value: 'Consumo' },
    { label: 'Pedido', value: 'Pedido' },
    { label: 'Produção', value: 'Produção' },
    { label: '(vazio)', value: '(vazio)' },
    { label: 'Consumo p/ordens de um nível', value: 'Consumo p/ordens de um nível' },
    { label: 'WIP produção', value: 'WIP produção' },
    { label: 'Ordem do cliente', value: 'Ordem do cliente' }
  ];

  const toggleFilterOption = (key: string, value: string) => {
    const current = Array.isArray(localMapColunas[key]) ? localMapColunas[key] : [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    setLocalMapColunas({ ...localMapColunas, [key]: updated });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    addToast('URL copiada para a área de transferência!', 'success');
    setTimeout(() => setCopied(null), 2000);
  };

  const [newCriticalSupplier, setNewCriticalSupplier] = useState('');

  const addCriticalSupplier = () => {
    if (!newCriticalSupplier.trim()) return;
    if (localAlertSettings.fornecedoresCriticos.includes(newCriticalSupplier.trim())) {
      addToast('Este fornecedor já está na lista.', 'info');
      return;
    }
    setLocalAlertSettings({
      ...localAlertSettings,
      fornecedoresCriticos: [...localAlertSettings.fornecedoresCriticos, newCriticalSupplier.trim()]
    });
    setNewCriticalSupplier('');
  };

  const removeCriticalSupplier = (supplier: string) => {
    setLocalAlertSettings({
      ...localAlertSettings,
      fornecedoresCriticos: localAlertSettings.fornecedoresCriticos.filter(s => s !== supplier)
    });
  };

  const currencySymbol = useMemo(() => {
    const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: localCurrency || 'BRL' });
    return formatter.formatToParts(0).find(p => p.type === 'currency')?.value || '';
  }, [localCurrency]);

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
            Configurações
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Personalize o comportamento do motor de auditoria e o mapeamento de arquivos.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportSettings} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Importar Configurações (JSON)"
          >
            <Upload className="w-4 h-4" /> Importar
          </button>
          <button 
            onClick={handleExportSettings}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Exportar Configurações (JSON)"
          >
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button 
            onClick={resetToDefault}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <RotateCcw className="w-4 h-4" /> Resetar Padrões
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* General Parameters */}
        <section className={`lg:col-span-1 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
            <SettingsIcon className="w-5 h-5" />
            Parâmetros Gerais
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Percent className="w-3 h-3" /> Tolerância de Variação
              </label>
              <input 
                type="number" 
                value={localTolerancia}
                onChange={(e) => setLocalTolerancia(Number(e.target.value))}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
              <p className="mt-2 text-[10px] text-slate-500 italic">Diferenças abaixo deste percentual serão ignoradas.</p>
            </div>

            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Hash className="w-3 h-3" /> CFOPs de Entrada
              </label>
              <textarea 
                value={localCfops}
                onChange={(e) => setLocalCfops(e.target.value)}
                rows={3}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
              <p className="mt-2 text-[10px] text-slate-500 italic">Separe os CFOPs por vírgula.</p>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Exibir Impacto Financeiro</h4>
                  <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Habilita a visualização de valores monetários em todo o programa.</p>
                </div>
                <button 
                  onClick={() => setLocalShowFinancialImpact(!localShowFinancialImpact)}
                  className={`w-12 h-6 rounded-full transition-all relative ${localShowFinancialImpact ? 'bg-[#8DC63F]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localShowFinancialImpact ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Alert Rules */}
        <section className={`lg:col-span-1 p-6 rounded-2xl border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`flex items-center gap-2 text-lg font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
              <ShieldCheck className="w-5 h-5" />
              Regras de Alerta
            </h3>
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
              <Bell className="w-4 h-4" />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="group">
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 transition-colors ${darkMode ? 'text-slate-400 group-focus-within:text-[#8DC63F]' : 'text-gray-600 group-focus-within:text-[#78AF32]'}`}>
                Impacto Mínimo p/ Alerta ({currencySymbol})
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {currencySymbol}
                </div>
                <input 
                  type="number" 
                  value={localAlertSettings.impactoMinimoAlerta}
                  onChange={(e) => setLocalAlertSettings({...localAlertSettings, impactoMinimoAlerta: Number(e.target.value)})}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 italic leading-relaxed">
                Divergências com impacto financeiro superior a este valor serão marcadas como críticas no dashboard.
              </p>
            </div>

            <div className="group">
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 transition-colors ${darkMode ? 'text-slate-400 group-focus-within:text-[#8DC63F]' : 'text-gray-600 group-focus-within:text-[#78AF32]'}`}>
                Variação Mínima p/ Alerta (%)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={localAlertSettings.variacaoMinimaAlerta}
                  onChange={(e) => setLocalAlertSettings({...localAlertSettings, variacaoMinimaAlerta: Number(e.target.value)})}
                  className={`w-full px-4 py-3 border rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
                />
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  %
                </div>
              </div>
              <p className="mt-2 text-[10px] text-slate-500 italic leading-relaxed">
                Itens com variação percentual (Preço NF vs Custo SAP) acima deste limite dispararão alertas.
              </p>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-700/50">
              <label className={`flex items-center gap-2 text-xs font-bold mb-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Users className="w-3 h-3" /> Fornecedores Críticos (Monitoramento Especial)
              </label>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={newCriticalSupplier}
                  onChange={(e) => setNewCriticalSupplier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCriticalSupplier()}
                  placeholder="Nome ou CNPJ..."
                  className={`flex-1 px-4 py-2 border rounded-xl text-xs transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
                />
                <button 
                  onClick={addCriticalSupplier}
                  className="px-4 bg-[#8DC63F] text-white rounded-xl hover:bg-[#78AF32] transition-all shadow-md shadow-[#8DC63F]/20 flex items-center justify-center"
                  title="Adicionar Fornecedor"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              {localAlertSettings.fornecedoresCriticos.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 scrollbar-hide">
                  {localAlertSettings.fornecedoresCriticos.map(s => (
                    <div 
                      key={s} 
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-red-500/30' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-red-200'}`}
                    >
                      <span className="truncate max-w-[120px]">{s}</span>
                      <button 
                        onClick={() => removeCriticalSupplier(s)} 
                        className="text-slate-500 hover:text-red-500 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`p-4 rounded-xl border border-dashed text-center ${darkMode ? 'border-slate-800 bg-slate-800/20' : 'border-gray-100 bg-gray-50'}`}>
                  <p className="text-[10px] text-slate-500 italic">Nenhum fornecedor crítico monitorado.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Tax Matrix & Intelligence */}
        <section className={`lg:col-span-1 p-6 rounded-2xl border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`flex items-center gap-2 text-lg font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
              <Globe className="w-5 h-5" />
              Malha Fiscal & IA
            </h3>
            <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#8DC63F]/10 text-[#8DC63F]' : 'bg-[#8DC63F]/5 text-[#8DC63F]'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="group">
              <label className={`flex items-center gap-2 text-xs font-bold mb-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Alíquotas ICMS-ST por Estado
              </label>
              <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                {Object.entries(localTaxMatrix).map(([uf, rate]) => (
                  <div key={uf} className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black w-8">{uf}</span>
                    <div className="flex-1 relative">
                      <input 
                        type="number" 
                        value={rate}
                        onChange={(e) => setLocalTaxMatrix({ ...localTaxMatrix, [uf]: Number(e.target.value) })}
                        className={`w-full px-3 py-1.5 border rounded-lg text-xs font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-[#8DC63F]' : 'bg-white border-gray-200 focus:border-[#8DC63F]'}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold opacity-50">%</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-500 italic leading-relaxed">
                O sistema alertará se o fornecedor destacar uma alíquota diferente da configurada para o estado.
              </p>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-700/50">
              <h4 className={`text-xs font-bold mb-3 ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Inteligência de Classificação</h4>
              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="text-[10px] font-bold mb-1">Aprendizado Ativo</p>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    O sistema aprende com suas decisões passadas. Se você ignorar variações de centavos para um material, ele sugerirá "Ignorado" automaticamente no futuro.
                  </p>
                </div>
                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                  <p className="text-[10px] font-bold mb-1">Auto-Justificativa</p>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    Justificativas recorrentes são sugeridas automaticamente, reduzindo o tempo de digitação em até 80%.
                  </p>
                </div>
                <Link 
                  to="/ai-terms"
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed transition-all ${darkMode ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Termos de Uso e LGPD da IA</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Branding Section */}
        <section className={`lg:col-span-1 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
            <LayoutIcon className="w-5 h-5" />
            Branding e Moeda
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Nome da Empresa
              </label>
              <input 
                type="text" 
                value={localBranding.companyName}
                onChange={(e) => setLocalBranding({...localBranding, companyName: e.target.value})}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>

            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Moeda do Sistema
              </label>
              <select 
                value={localCurrency}
                onChange={(e) => setLocalCurrency(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar (US$)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>

            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Cor Primária
              </label>
              <div className="flex gap-3 items-center">
                <input 
                  type="color" 
                  value={localBranding.primaryColor}
                  onChange={(e) => setLocalBranding({...localBranding, primaryColor: e.target.value})}
                  className="w-12 h-12 rounded-lg border-0 cursor-pointer p-0 overflow-hidden"
                />
                <input 
                  type="text" 
                  value={localBranding.primaryColor}
                  onChange={(e) => setLocalBranding({...localBranding, primaryColor: e.target.value})}
                  className={`flex-1 p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
                />
              </div>
            </div>

            <div>
              <label className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                URL do Logo (SVG/PNG)
              </label>
              <input 
                type="text" 
                value={localBranding.logoUrl}
                onChange={(e) => setLocalBranding({...localBranding, logoUrl: e.target.value})}
                placeholder="https://exemplo.com/logo.png"
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
              <p className="mt-2 text-[10px] text-slate-500 italic">Deixe em branco para usar o logo padrão.</p>
            </div>

            <div className="pt-4 border-t border-dashed border-slate-700/50">
              <label className={`flex items-center gap-2 text-xs font-bold mb-3 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Tema do Sistema
              </label>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-[#8DC63F] hover:bg-slate-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
              >
                <div className="flex items-center gap-3">
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="text-sm font-bold">{darkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}</span>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-all ${darkMode ? 'bg-[#8DC63F]' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${darkMode ? 'left-6' : 'left-1'}`} />
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Column Mapping */}
        <section className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between">
              <h3 className={`flex items-center gap-2 text-lg font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
                <LayoutIcon className="w-5 h-5" />
                Mapeamento de Colunas
              </h3>
            </div>

            {Object.keys(customPresets).length > 0 && (
              <div className="space-y-4">
                <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Meus Mapeamentos Salvos</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(customPresets).map(([name, map]) => (
                    <div key={name} className="flex items-center gap-1">
                      <button
                        onClick={() => applyPreset(map)}
                        className={`px-3 py-1.5 rounded-l-lg text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700' : 'bg-green-50 text-[#78AF32] hover:bg-green-100'}`}
                      >
                        {name}
                      </button>
                      <button
                        onClick={() => { if(window.confirm(`Excluir mapeamento "${name}"?`)) deleteCustomPreset(name); }}
                        className={`px-2 py-1.5 rounded-r-lg text-[10px] font-bold transition-all ${darkMode ? 'bg-slate-800 text-red-400 hover:bg-red-500/10' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-4 border-t border-dashed border-slate-700/50">
              <input 
                type="text"
                placeholder="Nome do novo mapeamento..."
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                className={`flex-1 p-2 rounded-xl text-xs outline-none border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-[#8DC63F]' : 'bg-gray-50 border-gray-200 focus:border-[#8DC63F]'}`}
              />
              <button 
                onClick={handleSaveCustomPreset}
                className="flex items-center gap-1 px-4 py-2 bg-[#8DC63F] text-white rounded-xl text-xs font-bold hover:bg-[#78AF32] transition-all"
              >
                <Plus className="w-3 h-3" /> Salvar Mapeamento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Planilha de Notas Fiscais</h4>
              {[
                { label: 'CFOP', key: 'nfCfop' },
                { label: 'Material', key: 'nfMat' },
                { label: 'Preço Unitário', key: 'nfPreco' },
                { label: 'Quantidade', key: 'nfQtd' },
                { label: 'Fornecedor/CNPJ', key: 'nfFornecedor' },
                { label: 'Centro', key: 'nfCentro' },
                { label: 'Descrição', key: 'nfDesc' },
                { label: 'ICMS', key: 'nfIcms' },
                { label: 'IPI', key: 'nfIpi' },
                { label: 'PIS', key: 'nfPis' },
                { label: 'COFINS', key: 'nfCofins' },
                { label: 'Empresa', key: 'nfEmpresa' },
                { label: 'Número NF', key: 'nfNumeroNF' },
                { label: 'Tipo Material', key: 'nfTipoMaterial' },
                { label: 'Categoria NF', key: 'nfCategoriaNF' },
                { label: 'Origem Material', key: 'nfOrigemMaterial' },
                { label: 'Data Lançamento', key: 'nfDataLancamento' },
                { label: 'Preço Unit. s/ Frete', key: 'precoSemFrete' },
                { label: 'Preço Unit. c/ Frete', key: 'precoComFrete' },
                { label: 'V. Liq s/ Frete', key: 'valorLiqSemFrete' },
                { label: 'V. Liq c/ Frete', key: 'valorLiqComFrete' },
                { label: 'Total s/ Frete', key: 'valorTotalSemFrete' },
                { label: 'Total c/ Frete', key: 'valorTotalComFrete' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{item.label}</label>
                  <input 
                    type="text" 
                    value={localMapColunas[item.key]}
                    onChange={(e) => setLocalMapColunas({...localMapColunas, [item.key]: e.target.value.toUpperCase()})}
                    className={`w-16 p-2 border rounded-xl text-center font-bold text-sm transition-all focus:ring-2 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-[#8DC63F] focus:ring-[#8DC63F]/50' : 'bg-gray-50 border-gray-200 text-[#78AF32] focus:ring-[#8DC63F]/50'}`}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Relatório CKM3</h4>
              {[
                { label: 'Material', key: 'ckm3Mat' },
                { label: 'Custo Padrão', key: 'ckm3Custo' },
                { label: 'Centro', key: 'ckm3Centro' },
                { label: 'Descrição', key: 'ckm3Desc' },
                { label: 'Coluna Categoria (G)', key: 'ckm3Categoria' },
                { label: 'Filtro Categoria', key: 'ckm3CategoriaFiltro' },
                { label: 'Coluna Proc. (H)', key: 'ckm3Processo' },
                { label: 'Filtro Proc.', key: 'ckm3ProcessoFiltro' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4 relative">
                  <label className={`text-sm ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{item.label}</label>
                  {item.key === 'ckm3CategoriaFiltro' || item.key === 'ckm3ProcessoFiltro' ? (
                    <div className="relative w-48">
                      <button
                        type="button"
                        onClick={() => setOpenFilter(openFilter === item.key ? null : item.key)}
                        className={`w-full p-2 border rounded-xl text-xs font-bold flex items-center justify-between transition-all focus:ring-2 outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-[#8DC63F] focus:ring-[#8DC63F]/50' : 'bg-gray-50 border-gray-200 text-[#78AF32] focus:ring-[#8DC63F]/50'}`}
                      >
                        <span className="truncate">
                          {Array.isArray(localMapColunas[item.key]) && localMapColunas[item.key].length > 0
                            ? `${localMapColunas[item.key].length} selecionado(s)`
                            : 'Todos'}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${openFilter === item.key ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {openFilter === item.key && (
                        <div className={`absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-xl border shadow-xl p-2 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                          {(item.key === 'ckm3CategoriaFiltro' ? ckm3CategoriaOptions : ckm3ProcessoOptions).map(opt => {
                            const isSelected = Array.isArray(localMapColunas[item.key]) && localMapColunas[item.key].includes(opt.value);
                            return (
                              <button
                                key={opt.value}
                                onClick={() => toggleFilterOption(item.key, opt.value)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all mb-1 last:mb-0 ${isSelected ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-green-50 text-[#78AF32]') : (darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-gray-600')}`}
                              >
                                <span>{opt.label}</span>
                                {isSelected && <Check className="w-3 h-3" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={localMapColunas[item.key] || ''}
                      onChange={(e) => setLocalMapColunas({...localMapColunas, [item.key]: e.target.value.toUpperCase()})}
                      className="w-16 p-2 border rounded-xl text-center font-bold text-sm transition-all focus:ring-2 outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-[#8DC63F] dark:focus:ring-[#8DC63F]/50 bg-gray-50 border-gray-200 text-[#78AF32] focus:ring-[#8DC63F]/50"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notification Settings */}
        <section className={`lg:col-span-3 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
            <Bell className="w-5 h-5" />
            Notificações e Alertas Automáticos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Alertas por E-mail</h4>
                  <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Enviar resumo de auditoria para o gestor automaticamente.</p>
                </div>
                <button 
                  onClick={() => setLocalNotificationSettings({...localNotificationSettings, emailAlerts: !localNotificationSettings.emailAlerts})}
                  className={`w-12 h-6 rounded-full transition-all relative ${localNotificationSettings.emailAlerts ? 'bg-[#8DC63F]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localNotificationSettings.emailAlerts ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {localNotificationSettings.emailAlerts && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className={`block text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>E-mail do Gestor</label>
                  <input 
                    type="email" 
                    value={localNotificationSettings.managerEmail}
                    onChange={(e) => setLocalNotificationSettings({...localNotificationSettings, managerEmail: e.target.value})}
                    placeholder="gestor@empresa.com"
                    className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
                  />
                </div>
              )}
            </div>

            <div className={`p-6 rounded-xl border flex flex-col justify-center ${darkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-amber-400/80' : 'text-amber-700'}`}>
                <strong>Atenção:</strong> A funcionalidade de envio de e-mail requer um servidor SMTP configurado ou integração com serviço de mensageria (SendGrid/Mailchimp). Por enquanto, esta opção apenas habilita a interface de alerta.
              </p>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className={`lg:col-span-3 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
            <Globe className="w-5 h-5" />
            Integrações e URLs
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Se você estiver integrando este auditor com outros sistemas (como SAP, Power BI ou Webhooks), utilize as URLs abaixo conforme o ambiente:
              </p>
              
              <div className="space-y-6">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>URL de Desenvolvimento</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Privado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 p-2 rounded bg-black/10 text-xs font-mono truncate ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {window.location.origin}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(window.location.origin, 'dev')}
                      className={`p-2 rounded-lg transition-all ${copied === 'dev' ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-gray-500 shadow-sm hover:bg-gray-100')}`}
                    >
                      {copied === 'dev' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 italic">Use esta URL apenas para testes locais</p>
                </div>

                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-600' : 'text-green-600'}`}>URL Publicada (Shared)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white">Produção</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className={`flex-1 p-2 rounded bg-black/10 text-xs font-mono truncate ${darkMode ? 'text-emerald-400' : 'text-green-700'}`}>
                      {window.location.origin.replace('-dev-', '-pre-')}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(window.location.origin.replace('-dev-', '-pre-'), 'prod')}
                      className={`p-2 rounded-lg transition-all ${copied === 'prod' ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-gray-500 shadow-sm hover:bg-gray-100')}`}
                    >
                      {copied === 'prod' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 italic">Esta é a URL que deve ser usada em integrações externas e compartilhamento.</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-xl border flex flex-col justify-center ${darkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
              <h4 className={`text-sm font-bold mb-3 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                <ExternalLink className="w-4 h-4" /> Dica de Integração
              </h4>
              <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-blue-600'}`}>
                Se a sua integração estiver falhando com erro de "URL não encontrada" ou "Acesso Negado", verifique se você está usando a <strong>URL Publicada (Shared)</strong>. 
                <br /><br />
                A URL que contém <code className="px-1 rounded bg-black/10">-dev-</code> é temporária e restrita ao seu ambiente de edição. Para integrações permanentes, sempre utilize a URL com <code className="px-1 rounded bg-black/10">-pre-</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Registered Users Section (Hidden in DEV Mode) */}
        {showDevMode && (
          <section className={`lg:col-span-3 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-orange-400' : 'text-orange-700'}`}>
                    Console de Gerenciamento DEV
                  </h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Controle de Usuários e Segurança</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSendEmailToGuilherme}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                >
                  <Mail className="w-4 h-4" /> Enviar para Guilherme
                </button>
                <button 
                  onClick={handleExportToVisio}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  <Download className="w-4 h-4" /> Exportar para Visio/Gestão (CSV)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-slate-800 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                    <th className="pb-3 font-black uppercase tracking-widest">Matrícula</th>
                    <th className="pb-3 font-black uppercase tracking-widest">Nome</th>
                    <th className="pb-3 font-black uppercase tracking-widest">Device ID</th>
                    <th className="pb-3 font-black uppercase tracking-widest">Token</th>
                    <th className="pb-3 font-black uppercase tracking-widest">Data Registro</th>
                    <th className="pb-3 font-black uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className={darkMode ? 'text-slate-300' : 'text-gray-600'}>
                  {registeredUsers.length > 0 ? (
                    registeredUsers.map(user => {
                      const isBanned = user.deviceId && bannedDevices.includes(user.deviceId);
                      return (
                        <tr key={user.matricula} className={`border-b last:border-0 ${darkMode ? 'border-slate-800/50' : 'border-gray-50'} ${isBanned ? 'opacity-50 bg-red-500/5' : ''}`}>
                          <td className="py-3 font-mono">
                            <div className="flex items-center gap-2">
                              {user.matricula}
                              {isBanned && <span className="px-1.5 py-0.5 rounded bg-red-500 text-[8px] text-white font-bold uppercase">Banido</span>}
                            </div>
                          </td>
                          <td className="py-3 font-bold">{user.nome}</td>
                          <td className="py-3 font-mono text-[10px] text-slate-500">{user.deviceId || 'N/A'}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-1 group">
                              <Key className="w-3 h-3 text-slate-400" />
                              <span className="font-mono text-[10px] text-slate-500">
                                {user.token ? `${user.token.substring(0, 6)}...` : 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">{new Date(user.dataRegistro).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            {user.deviceId && (
                              <button
                                onClick={() => {
                                  if (isBanned) {
                                    unbanDevice(user.deviceId!);
                                  } else {
                                    banDevice(user.deviceId!);
                                  }
                                }}
                                className={`p-2 rounded-lg transition-all ${isBanned ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}
                                title={isBanned ? "Desbloquear Dispositivo" : "Banir Dispositivo"}
                              >
                                {isBanned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center italic opacity-50">Nenhum usuário cadastrado ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Hidden DEV Trigger */}
      <button 
        onClick={handleDevAccess}
        className="fixed bottom-0 right-0 w-10 h-10 opacity-0 cursor-default z-[1000]"
        title="Acesso Restrito"
      />

      {/* Biometric Modal */}
      {isBiometricModalOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`max-w-sm w-full p-8 rounded-3xl border text-center shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <Fingerprint className="w-10 h-10 text-blue-500 animate-pulse" />
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="38"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-blue-500/20"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="38"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 * (1 - biometricCountdown / 15)}
                  className="text-blue-500 transition-all duration-1000 ease-linear"
                />
              </svg>
            </div>
            <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Autenticação Biométrica</h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Por favor, utilize o leitor de biometria do seu dispositivo para acessar o console DEV.
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="px-4 py-2 rounded-full bg-slate-500/10 text-blue-500 font-mono font-bold text-lg">
                00:{biometricCountdown.toString().padStart(2, '0')}
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-500 uppercase font-black tracking-widest">Aguardando Sensor...</p>
          </div>
        </div>
      )}

      <div className={`p-6 rounded-2xl border flex items-center justify-between transition-all ${showSuccess ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-emerald-50 border-emerald-200') : (darkMode ? 'bg-[#8DC63F]/5 border-[#8DC63F]/20' : 'bg-green-50 border-green-100')}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all ${showSuccess ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-white text-[#78AF32] shadow-sm')}`}>
            {showSuccess ? <CheckCircle2 className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <h4 className={`font-bold transition-all ${showSuccess ? 'text-emerald-600' : (darkMode ? 'text-white' : 'text-gray-900')}`}>
              {showSuccess ? 'Configurações Salvas com Sucesso!' : 'Configurações Locais'}
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {showSuccess ? 'As alterações foram aplicadas ao motor de auditoria.' : 'Suas preferências são armazenadas localmente no navegador.'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${showSuccess ? 'bg-emerald-500 text-white' : 'bg-[#8DC63F] text-white hover:bg-[#78AF32]'}`}
        >
          <Save className="w-5 h-5" /> {showSuccess ? 'Salvo!' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
