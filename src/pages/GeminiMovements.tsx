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

const GeminiMovementsPage: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<'list' | 'types' | 'analytics' | 'upload' | 'reconciliation'>('reconciliation');
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

  // Analytics Logic: Monthly Movement (Keeping original logic for comparison)
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

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1); 
    setCurrentPageRecon(1);
  };

  // ==========================================================
  // OTIMIZADO PELO GEMINI (Comparação na aba Reconciliation)
  // ==========================================================
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
      if (!matKey) return; 
      
      if (!materials[matKey]) materials[matKey] = getBase(p);
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
              Movimentação do Gemini (Comparação)
            </h1>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Versão refatorada do motor de reconciliação para comparação.
          </p>
        </div>
      </div>

       {/* TAB: Reconciliation Only */}
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
            <BarChart3 className="w-4 h-4" /> 
            {reconciliationData.length} Materiais
          </div>
        </div>

        {/* Table for Reconciliation */}
        <div 
          className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
        >
          <div className="overflow-x-auto select-none">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead>
                <tr className={darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-50/50 text-slate-500'}>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest sticky left-0 z-10 bg-inherit min-w-[200px]">Material</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center border-l bg-blue-500/5">Est. Inicial</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Prod.</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Dev.</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/5">Aju. Ent</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-blue-500/10 font-bold border-r">Tot. Ent</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Aju. Saí</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Out. Saí</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Bonif.</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Venda</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Perda</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/5">Req.</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-rose-500/10 font-bold border-r">Tot. Saí</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-amber-500/10 font-bold">Subtotal</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-emerald-500/10 font-bold">Est. Real</th>
                  <th className="px-4 py-4 text-[9px] font-black uppercase tracking-widest text-center bg-red-500/10 font-bold">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedReconciliation.map(m => (
                  <tr key={m.material} className={`group transition-colors ${darkMode ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-4 py-4 sticky left-0 z-10 transition-colors bg-white dark:bg-slate-900">
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
    </div>
  );
};

export default GeminiMovementsPage;
