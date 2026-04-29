import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Box, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Calendar,
  BarChart3,
  Table as TableIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MousePointer2
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { motion, AnimatePresence } from 'framer-motion';
import { safeLocalStorageSet } from '../utils/storageUtils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { SAPMovementType, MaterialMovement } from '../types/audit';

const MovementsPage: React.FC = () => {
  const { 
    darkMode, 
    movementTypes, 
    setMovementTypes, 
    movements, 
    addToast,
    movementFiles,
    setMovementFiles,
    initialStockFiles,
    setInitialStockFiles,
    finalStockFiles,
    setFinalStockFiles,
    initialStockPositions,
    finalStockPositions,
    selectedPlant,
    setSelectedPlant,
    movementColumnMapping,
    setMovementColumnMapping,
    stockColumnMapping,
    setStockColumnMapping,
    isProcessingMovements,
    movementProcessingStatus,
    movementProgressPercent,
    processarMovimentacoes
  } = useAudit();

  const [activeTab, setActiveTab] = useState<'list' | 'types' | 'analytics' | 'upload' | 'reconciliation'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newType, setNewType] = useState<Partial<SAPMovementType>>({ direction: 'Entrada', active: true });
  const [showAddType, setShowAddType] = useState(false);
  const [showMappingConfig, setShowMappingConfig] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageRecon, setCurrentPageRecon] = useState(1);
  const [rowsPerPage] = useState(50);

  // Drag to Scroll Hook
  const listTableRef = useRef<HTMLDivElement>(null);
  const reconciliationTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const setupDragScroll = (ref: React.RefObject<HTMLDivElement>) => {
      const parent = ref.current;
      const el = parent?.querySelector('.overflow-x-auto') as HTMLDivElement;
      
      if (!el) return;

      let isDown = false;
      let startX: number;
      let startY: number;
      let scrollLeft: number;
      let scrollTop: number;

      const onMouseDown = (e: MouseEvent) => {
        // Only trigger if clicking directly on table container or cells, not interactive elements
        const target = e.target as HTMLElement;
        if (['BUTTON', 'INPUT', 'SELECT', 'A'].includes(target.tagName)) return;
        
        isDown = true;
        el.style.cursor = 'grabbing';
        el.style.userSelect = 'none';
        startX = e.pageX - el.offsetLeft;
        startY = e.pageY - el.offsetTop;
        scrollLeft = el.scrollLeft;
        scrollTop = el.scrollTop;
      };

      const onMouseLeave = () => {
        isDown = false;
        el.style.cursor = 'grab';
        el.style.removeProperty('user-select');
      };

      const onMouseUp = () => {
        isDown = false;
        el.style.cursor = 'grab';
        el.style.removeProperty('user-select');
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - el.offsetLeft;
        const y = e.pageY - el.offsetTop;
        const walkX = (x - startX) * 1.5;
        const walkY = (y - startY) * 1.5;
        el.scrollLeft = scrollLeft - walkX;
        el.scrollTop = scrollTop - walkY;
      };

      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('mouseup', onMouseUp);
      el.addEventListener('mousemove', onMouseMove);

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('mousemove', onMouseMove);
      };
    };

    const cleanupList = setupDragScroll(listTableRef);
    const cleanupRecon = setupDragScroll(reconciliationTableRef);

    return () => {
      cleanupList?.();
      cleanupRecon?.();
    };
  }, [activeTab]); // Re-setup when tabs change since refs might change visibility

  // Analytics Logic: Monthly Movement
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string, entrada: number, saida: number, total: number }> = {};
    
    movements.forEach(m => {
      const date = new Date(m.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!data[monthKey]) {
        data[monthKey] = { month: monthName, entrada: 0, saida: 0, total: 0 };
      }
      
      const type = movementTypes.find(t => t.code === m.movementType);
      if (type) {
        if (type.direction === 'Entrada') {
          data[monthKey].entrada += m.quantity;
          data[monthKey].total += m.quantity;
        } else if (type.direction === 'Saída') {
          data[monthKey].saida += m.quantity;
          data[monthKey].total -= m.quantity;
        }
      }
    });

    return Object.values(data).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [movements, movementTypes]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => 
      m.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.docNumber.includes(searchTerm)
    );
  }, [movements, searchTerm]);

  const handleUpdateType = (code: string, updates: Partial<SAPMovementType>) => {
    setMovementTypes(movementTypes.map(t => t.code === code ? { ...t, ...updates } : t));
    setEditingType(null);
    addToast('Tipo de movimentação atualizado!', 'success');
  };

  const handleAddType = () => {
    if (!newType.code || !newType.description) {
      addToast('Preencha todos os campos!', 'error');
      return;
    }
    if (movementTypes.find(t => t.code === newType.code)) {
      addToast('Código já existe!', 'error');
      return;
    }
    setMovementTypes([...movementTypes, newType as SAPMovementType]);
    setShowAddType(false);
    setNewType({ direction: 'Entrada', active: true });
    addToast('Novo tipo de movimentação adicionado!', 'success');
  };

  const handleDeleteType = (code: string) => {
    setMovementTypes(movementTypes.filter(t => t.code !== code));
    addToast('Tipo de movimentação removido!', 'info');
  };

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredMovements.slice(start, start + rowsPerPage);
  }, [filteredMovements, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredMovements.length / rowsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1); // Reset to first page on search
    setCurrentPageRecon(1);
  };

  const exportToExcel = () => {
    // 1. Prepare aggregated data
    const rawData = reconciliationData.map(m => ({
      '': '',
      'Material': m.material,
      'Descrição material': m.description,
      'Descrição Tipo de material': 'Material',
      'Saldo inicial 30/08/2025': m.initial,
      'PRODUÇÃO/COMPRAS': m.prod,
      'DEVOLUÇÃO/OUTRAS ENTRADAS': m.dev,
      'AJUSTE INVENTARIO ENTRADA': m.adjIn,
      'TOTAL ENTRADAS': m.initial + m.prod + m.dev + m.adjIn,
      'AJUSTE INVENTARIO SAÍDA': m.adjOut,
      'OUTRAS SAÍDA/DEVOLUÇÃO': m.otherOut,
      'Bonificação': m.bonif,
      'SAÍDAS (VENDAS)': m.sale,
      'SAÍDAS (Perda)': m.loss,
      'REPROCESSOS/REQUISIÇÃO': m.req,
      'TOTAL SAIDA': m.adjOut + m.otherOut + m.bonif + m.sale + m.loss + m.req,
      'ESTOQUE MOVIMENTAÇÃO DO MÊS': m.subtotal,
      'ESTOQUE INFORMADO SAP': m.finalStockReal,
      'CHECK': m.difference
    }));

    // 2. Create worksheet
    const worksheet = XLSX.utils.json_to_sheet([]);

    // 3. Add Title "NATULAB"
    XLSX.utils.sheet_add_aoa(worksheet, [['NATULAB']], { origin: 'B1' });
    
    // 4. Add Headers starting row 5 (to allow for space above)
    const headers = [
      '', 'Material', 'Descrição material', 'Descrição Tipo de material', 'Saldo inicial 30/08/2025', 
      'PRODUÇÃO/COMPRAS', 'DEVOLUÇÃO/OUTRAS ENTRADAS', 'AJUSTE INVENTARIO ENTRADA', 'TOTAL ENTRADAS',
      'AJUSTE INVENTARIO SAÍDA', 'OUTRAS SAÍDA/DEVOLUÇÃO', 'Bonificação', 'SAÍDAS (VENDAS)', 
      'SAÍDAS (Perda)', 'REPROCESSOS/REQUISIÇÃO', 'TOTAL SAIDA', 'ESTOQUE MOVIMENTAÇÃO DO MÊS', 
      'ESTOQUE INFORMADO SAP', 'CHECK'
    ];
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: 'A5' });

    // 5. Add data
    XLSX.utils.sheet_add_json(worksheet, rawData, { origin: 'A6', skipHeader: true });

    // 6. Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimentações');
    XLSX.writeFile(workbook, 'Movimentacoes_MB51_Formatado.xlsx');
  };

  const reconciliationData = useMemo(() => {
    const materials: Record<string, any> = {};
    
    // Função para limpar o código do material (remove zeros à esquerda e espaços em branco)
    const normalizeMaterial = (mat: any) => String(mat || '').replace(/^0+/, '').trim();

    const getBase = (m: any) => ({
      material: normalizeMaterial(m.material),
      description: m.description || '',
      initial: 0, prod: 0, dev: 0, adjIn: 0, adjOut: 0, 
      otherOut: 0, bonif: 0, sale: 0, loss: 0, req: 0, finalStockReal: 0 
    });

    // 1. Processar Estoque Inicial
    initialStockPositions.forEach(p => {
      const matKey = normalizeMaterial(p.material);
      if (!matKey) return; // Ignora linhas em branco
      
      if (!materials[matKey]) materials[matKey] = getBase(p);
      // Força a conversão para número para evitar NaN e falhas de soma
      materials[matKey].initial += (Number(p.quantity) || 0);
    });

    // 2. Processar Estoque Final
    finalStockPositions.forEach(p => {
      const matKey = normalizeMaterial(p.material);
      if (!matKey) return;
      
      if (!materials[matKey]) materials[matKey] = getBase(p);
      materials[matKey].finalStockReal += (Number(p.quantity) || 0);
    });

    // 3. Processar Movimentações MB51
    movements.forEach(m => {
      const matKey = normalizeMaterial(m.material);
      if (!matKey) return;

      if (!materials[matKey]) materials[matKey] = getBase(m);
      
      const type = movementTypes.find(t => t.code === m.movementType);
      if (type) {
        let category = type.category;

        if (['309', '325', '321'].includes(m.movementType)) {
          category = m.quantity >= 0 ? 'ADJUSTMENT_ENTRY' : 'ADJUSTMENT_EXIT';
        }

        if (category) {
          const qty = Number(m.quantity) || 0;
          switch (category) {
            case 'INITIAL_STOCK': if (initialStockPositions.length === 0) materials[matKey].initial += qty; break;
            case 'PRODUCTION_PURCHASE': materials[matKey].prod += qty; break;
            case 'RETURN_ENTRY': materials[matKey].dev += qty; break;
            case 'ADJUSTMENT_ENTRY': materials[matKey].adjIn += qty; break;
            
            // Usando '-= qty' para que estornos positivos (mov. de anulação) abatam das saídas
            case 'ADJUSTMENT_EXIT': materials[matKey].adjOut -= qty; break;
            case 'OTHER_EXIT': materials[matKey].otherOut -= qty; break;
            case 'BONIFICATION': materials[matKey].bonif -= qty; break;
            case 'SALE': materials[matKey].sale -= qty; break;
            case 'LOSS': materials[matKey].loss -= qty; break;
            case 'REQUISITION': materials[matKey].req -= qty; break;
            
            case 'FINAL_STOCK': if (finalStockPositions.length === 0) materials[matKey].finalStockReal += qty; break;
          }
        }
      }
    });

    return Object.values(materials).map((m: any) => {
      const totalIn = m.initial + m.prod + m.dev + m.adjIn; 
      const totalOut = m.adjOut + m.otherOut + m.bonif + m.sale + m.loss + m.req; 
      const subtotal = totalIn - totalOut; 
      
      // Arredondamento para 3 casas decimais para matar o lixo de memória de float do JS
      const difference = Math.round((subtotal - m.finalStockReal) * 1000) / 1000;
      
      return { ...m, totalIn, totalOut, subtotal, difference };
    }).filter((m: any) => 
      m.material.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [movements, movementTypes, searchTerm, initialStockPositions, finalStockPositions]);

  const columnTotals = useMemo(() => {
    return reconciliationData.reduce((acc, m) => {
      acc.initial += m.initial;
      acc.prod += m.prod;
      acc.dev += m.dev;
      acc.adjIn += m.adjIn;
      acc.totalIn += m.totalIn;
      acc.adjOut += m.adjOut;
      acc.otherOut += m.otherOut;
      acc.bonif += m.bonif;
      acc.sale += m.sale;
      acc.loss += m.loss;
      acc.req += m.req;
      acc.totalOut += m.totalOut;
      acc.subtotal += m.subtotal;
      acc.finalStockReal += m.finalStockReal;
      acc.difference += m.difference;
      return acc;
    }, { initial: 0, prod: 0, dev: 0, adjIn: 0, totalIn: 0, adjOut: 0, otherOut: 0, bonif: 0, sale: 0, loss: 0, req: 0, totalOut: 0, subtotal: 0, finalStockReal: 0, difference: 0 });
  }, [reconciliationData]);

  const paginatedReconciliation = useMemo(() => {
    const start = (currentPageRecon - 1) * rowsPerPage;
    return reconciliationData.slice(start, start + rowsPerPage);
  }, [reconciliationData, currentPageRecon, rowsPerPage]);

  const totalPagesRecon = Math.ceil(reconciliationData.length / rowsPerPage);

  const goToPageRecon = (page: number) => {
    setCurrentPageRecon(Math.max(1, Math.min(page, totalPagesRecon)));
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
              <Box className="w-6 h-6" />
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Movimentações de Estoque
            </h1>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Gestão de movimentos MB51 e configuração de tipos de movimentação SAP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={exportToExcel} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
            <Download className="w-4 h-4" /> Exportar para Excel
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#8DC63F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all shadow-lg shadow-[#8DC63F]/20">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/50 w-fit">
        {[
          { id: 'upload', label: 'Upload MB51', icon: <Download className="w-4 h-4" /> },
          { id: 'list', label: 'Movimentos', icon: <TableIcon className="w-4 h-4" /> },
          { id: 'reconciliation', label: 'Conciliação', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'analytics', label: 'Análise Mensal', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'types', label: 'Configuração de Tipos', icon: <Settings className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? (darkMode ? 'bg-slate-700 text-[#8DC63F] shadow-lg' : 'bg-white text-[#78AF32] shadow-sm') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Info Message */}
            <div className={`p-6 rounded-3xl border-2 border-[#8DC63F]/20 ${darkMode ? 'bg-[#8DC63F]/5' : 'bg-[#8DC63F]/5'} flex items-start gap-4`}>
              <div className="p-2 rounded-xl bg-[#8DC63F] text-white">
                <Box className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Layout Padrão: Guilherme Souza
                </p>
                <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Por padrão, o programa utiliza o layout SAP de movimentação de estoque de Guilherme Souza (Colunas A-G). 
                  Você pode personalizar o mapeamento das colunas caso sua planilha siga um padrão diferente.
                </p>
                <button 
                  onClick={() => setShowMappingConfig(!showMappingConfig)}
                  className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#8DC63F] hover:text-[#78AF32] transition-all"
                >
                  <Settings className={`w-3 h-3 transition-transform ${showMappingConfig ? 'rotate-90' : ''}`} />
                  {showMappingConfig ? 'Ocultar Personalização' : 'Personalizar Mapeamento de Coluna'}
                </button>
              </div>
            </div>

            {/* Custom Mapping UI */}
            <AnimatePresence>
              {showMappingConfig && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`}>
                    {[
                      { key: 'movementType', label: 'Tipo Mov. (Ex: A=0)', icon: <ArrowUpRight className="w-3 h-3" /> },
                      { key: 'material', label: 'Material (Ex: B=1)', icon: <Box className="w-3 h-3" /> },
                      { key: 'description', label: 'Texto Breve (Ex: C=2)', icon: <Edit2 className="w-3 h-3" /> },
                      { key: 'batch', label: 'Lote (Ex: D=3)', icon: <Box className="w-3 h-3" /> },
                      { key: 'quantity', label: 'Quantidade (Ex: E=4)', icon: <Plus className="w-3 h-3" /> },
                      { key: 'storageLocation', label: 'Depósito (Ex: F=5)', icon: <ArrowDownLeft className="w-3 h-3" /> },
                      { key: 'date', label: 'Data Lanç. (Ex: G=6)', icon: <Calendar className="w-3 h-3" /> },
                      { key: 'docNumber', label: 'Doc. Material', icon: <TableIcon className="w-3 h-3" /> },
                    ].map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {field.icon}
                          {field.label}
                        </label>
                        <input 
                          type="number"
                          value={(movementColumnMapping as any)[field.key] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? -1 : parseInt(e.target.value);
                            const updated = { ...movementColumnMapping, [field.key]: val };
                            setMovementColumnMapping(updated);
                            safeLocalStorageSet('miniSapMovementMapping', updated);
                          }}
                          className={`w-full px-4 py-2 rounded-xl border text-xs font-bold transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#78AF32]'}`}
                        />
                      </div>
                    ))}
                    <div className="col-span-full flex justify-end">
                      <button 
                        onClick={() => {
                          const def = { movementType: 0, material: 1, description: 2, batch: 3, quantity: 4, storageLocation: 5, date: 6 };
                          setMovementColumnMapping(def);
                          safeLocalStorageSet('miniSapMovementMapping', def);
                        }}
                        className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-700'}`}
                      >
                        Resetar para Guilherme Souza
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Plant Selection */}
              <div className={`col-span-1 md:col-span-2 p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase tracking-widest text-[#8DC63F]">Seleção de Centro (Obrigatório)</h3>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Selecione o centro para filtrar os dados das planilhas de posição de estoque.</p>
                  </div>
                  <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                    <button 
                      onClick={() => setSelectedPlant('1001')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlant === '1001' ? (darkMode ? 'bg-slate-700 text-[#8DC63F]' : 'bg-white text-[#78AF32] shadow-sm') : 'text-slate-500'}`}
                    >
                      1001 (LAB)
                    </button>
                    <button 
                      onClick={() => setSelectedPlant('1005')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlant === '1005' ? (darkMode ? 'bg-slate-700 text-[#8DC63F]' : 'bg-white text-[#78AF32] shadow-sm') : 'text-slate-500'}`}
                    >
                      1005 (LIFE)
                    </button>
                  </div>
                </div>
              </div>

              {/* MB51 Movements */}
              <div className={`p-8 rounded-[40px] border-4 border-dashed transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} text-center`}>
                <div className="max-w-md mx-auto space-y-4">
                  <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
                    <Download className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight">Movimentações MB51</h2>
                    <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Arquivos MB51 (.xlsx)</p>
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="file" 
                      multiple
                      accept=".xlsx, .xls"
                      onChange={(e) => {
                        if (e.target.files) {
                          setMovementFiles(Array.from(e.target.files));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className={`px-6 py-3 rounded-2xl border-2 border-dashed ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'} text-xs font-bold`}>
                      {movementFiles.length > 0 ? `${movementFiles.length} arquivos selecionados` : 'Clique para selecionar MB51'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stock Positions */}
              <div className="space-y-4">
                {/* Initial Stock */}
                <div className={`p-6 rounded-[30px] border-2 border-dashed transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-widest">Estoque Inicial (E8)</h3>
                      <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Planilha "ESTOQUE INICIAL-Anterior"</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" multiple accept=".xlsx, .xls"
                        onChange={(e) => {
                          if (e.target.files) {
                            setInitialStockFiles(Array.from(e.target.files));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`px-4 py-2 rounded-xl border ${initialStockFiles.length > 0 ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'} text-[10px] font-black uppercase`}>
                        {initialStockFiles.length > 0 ? 'OK' : 'Selecionar'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Stock */}
                <div className={`p-6 rounded-[30px] border-2 border-dashed transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <h3 className="text-xs font-black uppercase tracking-widest">Estoque Final (S8)</h3>
                      <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Planilha "ESTOQUE FINAL-MES ATUAL"</p>
                    </div>
                    <div className="relative">
                      <input 
                        type="file" multiple accept=".xlsx, .xls"
                        onChange={(e) => {
                          if (e.target.files) {
                            setFinalStockFiles(Array.from(e.target.files));
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`px-4 py-2 rounded-xl border ${finalStockFiles.length > 0 ? 'bg-[#8DC63F]/10 border-[#8DC63F] text-[#8DC63F]' : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-500'} text-[10px] font-black uppercase`}>
                        {finalStockFiles.length > 0 ? 'OK' : 'Selecionar'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <button 
                onClick={processarMovimentacoes}
                disabled={isProcessingMovements || (movementFiles.length === 0 && initialStockFiles.length === 0 && finalStockFiles.length === 0)}
                className={`flex items-center gap-3 px-10 py-4 rounded-2xl bg-[#8DC63F] text-white text-sm font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all shadow-xl shadow-[#8DC63F]/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessingMovements ? (
                  <>
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                    Processando... {movementProgressPercent}%
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Iniciar Processamento Consolidado
                  </>
                )}
              </button>
            </div>

            {isProcessingMovements && (
              <div className="max-w-md mx-auto space-y-3 font-black">
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#8DC63F]"
                    initial={{ width: 0 }}
                    animate={{ width: `${movementProgressPercent}%` }}
                  />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest text-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {movementProcessingStatus}
                </p>
              </div>
            )}
            
            <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100 shadow-sm'}`}>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <Box className="w-5 h-5 text-[#8DC63F]" />
                Instruções de Importação
              </h3>
              <ul className={`text-xs space-y-3 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] mt-1.5 shrink-0" />
                  O arquivo deve ser extraído diretamente do SAP através da transação MB51.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] mt-1.5 shrink-0" />
                  Não altere os nomes das colunas originais para garantir o mapeamento automático.
                </li>
                <li className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F] mt-1.5 shrink-0" />
                  Você pode subir múltiplos arquivos de períodos diferentes ao mesmo tempo.
                </li>
              </ul>
            </div>
          </motion.div>
        )}

        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex flex-col md:flex-row gap-4`}>
              <div className="relative flex-1">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input 
                  type="text"
                  placeholder="Pesquisar por material, descrição ou documento..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-[#8DC63F]'}`}
                />
              </div>
              <div className="flex gap-3">
                <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <MousePointer2 className="w-4 h-4" /> Arraste para rolar
                </div>
              </div>
            </div>

            {/* Pagination Info */}
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Exibindo {paginatedMovements.length} de {filteredMovements.length} registros
              </p>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
                    PÁGINA {currentPage} DE {totalPages}
                  </div>

                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div 
              ref={listTableRef}
              className={`rounded-3xl border overflow-hidden cursor-grab active:cursor-grabbing ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="overflow-x-auto select-none pointer-events-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Documento</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Material</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Quantidade</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Centro/Dep</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedMovements.length > 0 ? (
                      paginatedMovements.map(m => {
                        const type = movementTypes.find(t => t.code === m.movementType);
                        return (
                          <tr key={m.id} className={`group transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                            <td className="px-6 py-4">
                              <span className="text-xs font-black font-mono">{m.docNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{new Date(m.date).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-lg ${type?.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : type?.direction === 'Saída' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {type?.direction === 'Entrada' ? <ArrowDownLeft className="w-3 h-3" /> : type?.direction === 'Saída' ? <ArrowUpRight className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-black">{m.movementType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black">{m.material}</span>
                                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[200px]">{m.description}</span>
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right text-xs font-black ${type?.direction === 'Entrada' ? 'text-emerald-500' : type?.direction === 'Saída' ? 'text-rose-500' : ''}`}>
                              {type?.direction === 'Saída' ? '-' : ''}{m.quantity.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.plant} / {m.storageLocation}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{m.user}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Box className="w-12 h-12" />
                            <span className="text-sm font-black uppercase tracking-widest">Nenhum movimento encontrado</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'reconciliation' && (
          <motion.div
            key="reconciliation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex flex-col md:flex-row gap-4`}>
              <div className="relative flex-1">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input 
                  type="text"
                  placeholder="Filtrar por material ou descrição..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-[#8DC63F]'}`}
                />
              </div>
              <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <MousePointer2 className="w-4 h-4" /> Arraste para rolar
              </div>
              <div className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                <BarChart3 className="w-4 h-4" /> 
                {reconciliationData.length} Materiais
              </div>
            </div>

            {/* Pagination for Reconciliation */}
            <div className="flex items-center justify-between">
              <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Exibindo {paginatedReconciliation.length} de {reconciliationData.length} materiais
              </p>
              
              {totalPagesRecon > 1 && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => goToPageRecon(1)}
                    disabled={currentPageRecon === 1}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPageRecon(currentPageRecon - 1)}
                    disabled={currentPageRecon === 1}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black">
                    PÁGINA {currentPageRecon} DE {totalPagesRecon}
                  </div>

                  <button 
                    onClick={() => goToPageRecon(currentPageRecon + 1)}
                    disabled={currentPageRecon === totalPagesRecon}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === totalPagesRecon ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => goToPageRecon(totalPagesRecon)}
                    disabled={currentPageRecon === totalPagesRecon}
                    className={`p-2 rounded-lg transition-all ${currentPageRecon === totalPagesRecon ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div 
              ref={reconciliationTableRef}
              className={`rounded-3xl border overflow-hidden cursor-grab active:cursor-grabbing ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="overflow-x-auto select-none">
                <table className="w-full text-left border-collapse min-w-[1500px]">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50/50 text-slate-500'}>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest sticky left-0 z-10 bg-inherit min-w-[200px]">Material</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center border-l bg-blue-500/5">Est. Inicial (E8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Prod. (G8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Dev. (H8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Aju. Ent (I8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/10 font-bold border-r">Tot. Ent (J8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Aju. Saí (K8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Out. Saí (L8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Bonif. (M8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Venda (N8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Perda (O8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Req. (P8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/10 font-bold border-r">Tot. Saí (Q8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-amber-500/10 font-bold">Subtotal (R8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-emerald-500/10 font-bold">Est. Real (S8)</th>
                      <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-red-500/10 font-bold">Diferença (T8)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {/* Totals Row */}
                    <tr className={`font-black ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                      <td className="px-4 py-4 sticky left-0 z-10 bg-inherit text-[11px] border-r">TOTAL</td>
                      <td className="px-4 py-4 text-center text-[11px] border-l">{columnTotals.initial.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px]">{columnTotals.prod.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px]">{columnTotals.dev.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px]">{columnTotals.adjIn.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-blue-500 border-r">{columnTotals.totalIn.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500">{columnTotals.adjOut.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500">{columnTotals.otherOut.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500">{columnTotals.bonif.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500">{columnTotals.sale.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500">{columnTotals.loss.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-500">{columnTotals.req.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-rose-600 border-r">{columnTotals.totalOut.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-amber-600">{columnTotals.subtotal.toLocaleString()}</td>
                      <td className="px-4 py-4 text-center text-[11px] text-emerald-600">{columnTotals.finalStockReal.toLocaleString()}</td>
                      <td className={`px-4 py-4 text-center text-[11px] ${Math.abs(columnTotals.difference) > 0.01 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {columnTotals.difference.toLocaleString()}
                      </td>
                    </tr>
                    {paginatedReconciliation.map(m => (
                      <tr key={m.material} className={`group transition-colors ${darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-4 py-4 sticky left-0 z-10 transition-colors bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black">{m.material}</span>
                            <span className="text-[9px] font-medium text-slate-400 truncate max-w-[150px]">{m.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold border-l">{m.initial.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold">{m.prod.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold">{m.dev.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold">{m.adjIn.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-black text-blue-500 bg-blue-500/5 border-r">{m.totalIn.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold text-rose-500">{m.adjOut.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold text-rose-500">{m.otherOut.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold text-rose-500">{m.bonif.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold text-rose-500">{m.sale.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold text-rose-500">{m.loss.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-bold text-rose-500">{m.req.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-black text-rose-600 bg-rose-500/10 border-r">{m.totalOut.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-black text-amber-600 bg-amber-500/5">{m.subtotal.toLocaleString()}</td>
                        <td className="px-4 py-4 text-center text-[11px] font-black text-emerald-600 bg-emerald-500/5">{m.finalStockReal.toLocaleString()}</td>
                        <td className={`px-4 py-4 text-center text-[11px] font-black ${Math.abs(m.difference) > 0.01 ? 'text-red-500 bg-red-500/10' : 'text-emerald-500 bg-emerald-500/10'}`}>
                          {m.difference.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Monthly Chart */}
            <div className={`lg:col-span-8 p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-8`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Volume de Movimentação Mensal</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entradas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saídas</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: darkMode ? '#64748b' : '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: darkMode ? '#64748b' : '#94a3b8' }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={`p-4 rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                              <p className="text-xs font-black mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">{payload[0].payload.month}</p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-8">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entradas:</span>
                                  <span className="text-xs font-black text-emerald-500">+{payload[0].value?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-8">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saídas:</span>
                                  <span className="text-xs font-black text-rose-500">-{payload[1].value?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-8 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saldo:</span>
                                  <span className={`text-xs font-black ${Number(payload[0].value) - Number(payload[1].value) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {(Number(payload[0].value) - Number(payload[1].value)).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="entrada" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="saida" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="lg:col-span-4 space-y-6">
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h4 className={`text-xs font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Resumo do Período</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Total Entradas</span>
                    </div>
                    <span className="text-lg font-black text-emerald-500">
                      {movements.filter(m => movementTypes.find(t => t.code === m.movementType)?.direction === 'Entrada').reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Total Saídas</span>
                    </div>
                    <span className="text-lg font-black text-rose-500">
                      {movements.filter(m => movementTypes.find(t => t.code === m.movementType)?.direction === 'Saída').reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-500">Giro de Estoque</span>
                    <span className="text-2xl font-black text-[#8DC63F]">1.2x</span>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Top Materiais Movimentados</h4>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">MAT-000{i}</span>
                        <span className="text-[10px] font-medium text-slate-400">Material de Exemplo {i}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black">{(1500 / i).toLocaleString()}</div>
                        <div className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">+12%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'types' && (
          <motion.div
            key="types"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tipos de Movimentação SAP</h3>
              <button 
                onClick={() => setShowAddType(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8DC63F]/10 text-[#8DC63F] text-xs font-black uppercase tracking-widest hover:bg-[#8DC63F]/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Adicionar Tipo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {showAddType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-6 rounded-3xl border-2 border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código</label>
                        <input 
                          type="text" 
                          value={newType.code || ''}
                          onChange={e => setNewType({ ...newType, code: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                          placeholder="Ex: 101"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Direção</label>
                        <select 
                          value={newType.direction}
                          onChange={e => setNewType({ ...newType, direction: e.target.value as any })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        >
                          <option value="Entrada">Entrada</option>
                          <option value="Saída">Saída</option>
                          <option value="Transferência">Transferência</option>
                        </select>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria de Conciliação</label>
                        <select 
                          value={newType.category || ''}
                          onChange={e => setNewType({ ...newType, category: e.target.value as any })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        >
                          <option value="">Nenhuma</option>
                          <option value="INITIAL_STOCK">Estoque Inicial (E8)</option>
                          <option value="PRODUCTION_PURCHASE">Produção/Compras (G8)</option>
                          <option value="RETURN_ENTRY">Devolução/Entradas (H8)</option>
                          <option value="ADJUSTMENT_ENTRY">Ajuste Entrada (I8)</option>
                          <option value="ADJUSTMENT_EXIT">Ajuste Saída (K8)</option>
                          <option value="OTHER_EXIT">Outras Saídas (L8)</option>
                          <option value="BONIFICATION">Bonificação (M8)</option>
                          <option value="SALE">Venda (N8)</option>
                          <option value="LOSS">Perda (O8)</option>
                          <option value="REQUISITION">Requisição (P8)</option>
                          <option value="FINAL_STOCK">Estoque Final (S8)</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</label>
                      <input 
                        type="text" 
                        value={newType.description || ''}
                        onChange={e => setNewType({ ...newType, description: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        placeholder="Descrição do movimento..."
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddType} className="flex-1 py-2 rounded-xl bg-[#8DC63F] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all">Salvar</button>
                      <button onClick={() => setShowAddType(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Cancelar</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {movementTypes.map(type => (
                <div 
                  key={type.code}
                  className={`p-6 rounded-3xl border transition-all group ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-[#8DC63F]/50' : 'bg-white border-slate-100 hover:border-[#8DC63F]/50 shadow-sm'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${type.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : type.direction === 'Saída' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {type.direction === 'Entrada' ? <ArrowDownLeft className="w-5 h-5" /> : type.direction === 'Saída' ? <ArrowUpRight className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xl font-black">{type.code}</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${type.direction === 'Entrada' ? 'text-emerald-500' : type.direction === 'Saída' ? 'text-rose-500' : 'text-blue-500'}`}>
                          {type.direction}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingType(type.code)}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteType(type.code)}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-red-50 text-red-500'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {editingType === type.code ? (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input 
                        type="text" 
                        defaultValue={type.description}
                        onBlur={(e) => handleUpdateType(type.code, { description: e.target.value })}
                        autoFocus
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                      <select 
                        defaultValue={type.category || ''}
                        onChange={(e) => handleUpdateType(type.code, { category: e.target.value as any })}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      >
                        <option value="">Nenhuma Categoria</option>
                        <option value="INITIAL_STOCK">Estoque Inicial (E8)</option>
                        <option value="PRODUCTION_PURCHASE">Produção/Compras (G8)</option>
                        <option value="RETURN_ENTRY">Devolução/Entradas (H8)</option>
                        <option value="ADJUSTMENT_ENTRY">Ajuste Entrada (I8)</option>
                        <option value="ADJUSTMENT_EXIT">Ajuste Saída (K8)</option>
                        <option value="OTHER_EXIT">Outras Saídas (L8)</option>
                        <option value="BONIFICATION">Bonificação (M8)</option>
                        <option value="SALE">Venda (N8)</option>
                        <option value="LOSS">Perda (O8)</option>
                        <option value="REQUISITION">Requisição (P8)</option>
                        <option value="FINAL_STOCK">Estoque Final (S8)</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingType(null)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {type.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovementsPage;
