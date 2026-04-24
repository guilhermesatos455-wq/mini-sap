import React, { useState, useMemo, useEffect, useCallback, useDeferredValue, useRef } from 'react';
import XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Search, 
  Download, 
  FileText, 
  Filter,
  ChevronRight,
  ArrowRight,
  Table as TableIcon,
  Users,
  Hash,
  TrendingUp,
  FileDown,
  FileUp,
  FileJson,
  Layout,
  Check,
  X,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Settings,
  FileSpreadsheet,
  Code,
  HelpCircle,
  Terminal,
  Maximize2,
  Minimize2,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  ListChecks,
  HelpCircle as HelpIcon,
  Cpu,
  Edit3,
  CheckSquare
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { Link } from 'react-router-dom';
import { SAPExportModal } from '../components/SAPExportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { TableVirtuoso } from 'react-virtuoso';
import Tooltip from '../components/Tooltip';
import { EditableCell } from '../components/AuditDetails/EditableCell';
import { MultiSelect } from '../components/AuditDetails/MultiSelect';
import { StatusBadge } from '../components/AuditDetails/StatusBadge';
import { TableRowMemo, ExpandedRowMemo } from '../components/AuditDetails/AuditTableRows';
import { ExportModal } from '../components/AuditDetails/ExportModal';
import { BulkEditModal } from '../components/AuditDetails/BulkEditModal';
import { QUICK_EXAMPLES } from '../constants/auditExamples';
import { EXPORT_COLUMNS, QUICK_EXPORT_COLUMNS } from '../constants/auditConstants';
import { useDraggableScroll } from '../hooks/useDraggableScroll';
import { Divergencia, ShowColunas } from '../types/audit';

const formatoNumero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const AuditDetailsPage: React.FC = () => {
  const { 
    resultado, darkMode, addToast,
    filterCfopDefault, setFilterCfopDefault,
    filterSupplierDefault, setFilterSupplierDefault,
    filterTipoDefault, setFilterTipoDefault,
    filterImpactoMinDefault, setFilterImpactoMinDefault,
    dataInicio: dataInicioContext, setDataInicio: setFilterDataInicioContext,
    dataFim: dataFimContext, setDataFim: setFilterDataFimContext,
    updateDivergencia, bulkUpdateDivergencias,
    currency, warnings, showFinancialImpact,
    askAI, aproveDivergencia, rejeitarDivergencia, recipes
  } = useAudit();

  const aiUser = useMemo(() => ({ nome: 'Auditor Natulab', cargo: 'Fiscal' }), []);

  const formatoMoeda = useMemo(() => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: currency || 'BRL' 
    });
  }, [currency]);
  const [activeTab, setActiveTab] = useState<'divergencias' | 'todos' | 'cfop' | 'fornecedores' | 'top5' | 'pivot' | 'config' | 'warnings' | 'comentarios' | 'reverse'>('divergencias');
  
  const exportFilters = () => {
    const filterData = {
      filterCfop,
      filterSupplier,
      filterTipo,
      filterImpactoMin,
      filterDataInicio,
      filterDataFim,
      filterTipoMaterial,
      filterCategoriaNF,
      filterOrigemMaterial,
      filterEmpresa,
      filterStatus,
      showAdvancedFilter,
      advancedFilterExpression,
      showColunas
    };
    const blob = new Blob([JSON.stringify(filterData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `filtros_auditoria_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Filtros exportados com sucesso!', 'success');
  };

  const importFilters = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Basic validation and state updates
        if (typeof data.filterCfop === 'string') setFilterCfop(data.filterCfop);
        if (typeof data.filterSupplier === 'string') setFilterSupplier(data.filterSupplier);
        if (typeof data.filterTipo === 'string') setFilterTipo(data.filterTipo as any);
        if (typeof data.filterImpactoMin === 'number') setFilterImpactoMin(data.filterImpactoMin);
        if (typeof data.filterDataInicio === 'string') setFilterDataInicio(data.filterDataInicio);
        if (typeof data.filterDataFim === 'string') setFilterDataFim(data.filterDataFim);
        if (Array.isArray(data.filterTipoMaterial)) setFilterTipoMaterial(data.filterTipoMaterial);
        if (Array.isArray(data.filterCategoriaNF)) setFilterCategoriaNF(data.filterCategoriaNF);
        if (Array.isArray(data.filterOrigemMaterial)) setFilterOrigemMaterial(data.filterOrigemMaterial);
        if (Array.isArray(data.filterEmpresa)) setFilterEmpresa(data.filterEmpresa);
        if (typeof data.filterStatus === 'string') setFilterStatus(data.filterStatus);
        if (typeof data.showAdvancedFilter === 'boolean') setShowAdvancedFilter(data.showAdvancedFilter);
        if (typeof data.advancedFilterExpression === 'string') setAdvancedFilterExpression(data.advancedFilterExpression);
        
        // Import column visibility if present
        if (data.showColunas && typeof data.showColunas === 'object') {
          setShowColunas(data.showColunas);
        } else {
          // If importing old JSON without column data, enable some defaults to avoid "empty table" bug
          setShowColunas({
            empresa: true,
            numeroNF: true,
            tipoMaterial: true,
            categoriaNF: true,
            origemMaterial: true,
            dataLancamento: true,
            precoSemFrete: true,
            precoComFrete: true,
            valorLiqSemFrete: true,
            valorLiqComFrete: true,
            valorTotalSemFrete: true,
            valorTotalComFrete: true,
          });
        }

        addToast('Filtros importados com sucesso!', 'success');
      } catch (err) {
        console.error('Erro ao importar filtros:', err);
        addToast('Erro ao importar filtros. Arquivo inválido.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [filterCfop, setFilterCfop] = useState(filterCfopDefault);
  const [filterSupplier, setFilterSupplier] = useState(filterSupplierDefault);
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Divergências' | 'acima do custo padrão' | 'abaixo do custo padrão' | 'Não Encontrado no CKM3' | 'Sem Divergência'>(filterTipoDefault as any);
  const [filterImpactoMin, setFilterImpactoMin] = useState<number>(filterImpactoMinDefault);
  const [filterDataInicio, setFilterDataInicio] = useState<string>(dataInicioContext);
  const [filterDataFim, setFilterDataFim] = useState<string>(dataFimContext);
  const [filterTipoMaterial, setFilterTipoMaterial] = useState<string[]>([]);
  const [filterCategoriaNF, setFilterCategoriaNF] = useState<string[]>([]);
  const [filterOrigemMaterial, setFilterOrigemMaterial] = useState<string[]>([]);
  const [filterEmpresa, setFilterEmpresa] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [exportProgress, setExportProgress] = useState<{ active: boolean, progress: number, status: string }>({ active: false, progress: 0, status: '' });
  
  const dragScrollMain = useDraggableScroll();
  const dragScrollSummary = useDraggableScroll();
  const dragScrollQuickExamples = useDraggableScroll();
  const dragScrollCfopChips = useDraggableScroll();
  const dragScrollTabs = useDraggableScroll();

  // Sync local filters with context defaults (for drill-down)
  useEffect(() => {
    if (filterCfopDefault) setFilterCfop(filterCfopDefault);
    if (filterSupplierDefault) setFilterSupplier(filterSupplierDefault);
    if (filterTipoDefault) setFilterTipo(filterTipoDefault as any);
    if (filterImpactoMinDefault) setFilterImpactoMin(filterImpactoMinDefault);
  }, [filterCfopDefault, filterSupplierDefault, filterTipoDefault, filterImpactoMinDefault]);

  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [advancedFilterExpression, setAdvancedFilterExpression] = useState('');
  const deferredAdvancedFilterExpression = useDeferredValue(advancedFilterExpression);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [activeTextarea, setActiveTextarea] = useState<HTMLTextAreaElement | null>(null);
  const [suggestionCoords, setSuggestionCoords] = useState({ top: 0, left: 0 });

  const hasActiveFilters = useMemo(() => {
    return (
      filterCfop !== '' ||
      filterSupplier !== '' ||
      filterTipo !== 'Todos' ||
      filterImpactoMin > 0 ||
      filterDataInicio !== '' ||
      filterDataFim !== '' ||
      filterStatus !== 'Todos' ||
      filterTipoMaterial.length > 0 ||
      filterCategoriaNF.length > 0 ||
      filterOrigemMaterial.length > 0 ||
      filterEmpresa.length > 0 ||
      showAdvancedFilter ||
      advancedFilterExpression !== ''
    );
  }, [filterCfop, filterSupplier, filterTipo, filterImpactoMin, filterDataInicio, filterDataFim, filterStatus, filterTipoMaterial, filterCategoriaNF, filterOrigemMaterial, filterEmpresa, showAdvancedFilter, advancedFilterExpression]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<{name: string, type: string, icon: React.ReactNode}[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const [activeExampleCategory, setActiveExampleCategory] = useState(QUICK_EXAMPLES[0].category);

  const renderQuickExamples = () => (
    <div className={`border-b transition-colors ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-100/50 border-slate-200'}`}>
      <div 
        className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto no-scrollbar"
        ref={dragScrollQuickExamples.ref}
        onMouseDown={dragScrollQuickExamples.onMouseDown}
        onMouseLeave={dragScrollQuickExamples.onMouseLeave}
        onMouseUp={dragScrollQuickExamples.onMouseUp}
        onMouseMove={dragScrollQuickExamples.onMouseMove}
        style={dragScrollQuickExamples.style}
      >
        {QUICK_EXAMPLES.map(cat => (
          <button
            key={cat.category}
            onClick={() => setActiveExampleCategory(cat.category)}
            className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all whitespace-nowrap ${
              activeExampleCategory === cat.category
                ? (darkMode ? 'bg-[#8DC63F] text-slate-900' : 'bg-[#8DC63F] text-white')
                : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600')
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>
      <div 
        className="flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar"
        ref={dragScrollCfopChips.ref}
        onMouseDown={dragScrollCfopChips.onMouseDown}
        onMouseLeave={dragScrollCfopChips.onMouseLeave}
        onMouseUp={dragScrollCfopChips.onMouseUp}
        onMouseMove={dragScrollCfopChips.onMouseMove}
        style={dragScrollCfopChips.style}
      >
        {QUICK_EXAMPLES.find(c => c.category === activeExampleCategory)?.examples.map(ex => (
            <button
              key={ex.name}
              onClick={() => {
                if (advancedFilterExpression.trim()) {
                  setAdvancedFilterExpression(prev => prev + (prev.endsWith('\n') ? '' : '\n') + ex.code);
                } else {
                  setAdvancedFilterExpression(ex.code);
                }
              }}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-black font-mono whitespace-nowrap transition-all flex items-center gap-2 group ${
                darkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-400 hover:border-[#8DC63F] hover:text-[#8DC63F]' 
                  : 'bg-white border-slate-200 text-slate-500 hover:border-[#8DC63F] hover:text-[#78AF32] shadow-sm'
              }`}
            >
            <Code className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            {ex.name}
          </button>
        ))}
      </div>
    </div>
  );

  const allSuggestions = useMemo(() => [
    { name: 'material', type: 'field', icon: <Hash className="w-3 h-3" /> },
    { name: 'cfop', type: 'field', icon: <Hash className="w-3 h-3" /> },
    { name: 'fornecedor', type: 'field', icon: <Users className="w-3 h-3" /> },
    { name: 'impactoFinanceiro', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'precoEfetivo', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'custoPadrao', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'quantidade', type: 'field', icon: <Hash className="w-3 h-3" /> },
    { name: 'variacaoPerc', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'empresa', type: 'field', icon: <Users className="w-3 h-3" /> },
    { name: 'numeroNF', type: 'field', icon: <Hash className="w-3 h-3" /> },
    { name: 'tipoMaterial', type: 'field', icon: <FileText className="w-3 h-3" /> },
    { name: 'categoriaNF', type: 'field', icon: <FileText className="w-3 h-3" /> },
    { name: 'origemMaterial', type: 'field', icon: <FileText className="w-3 h-3" /> },
    { name: 'data', type: 'field', icon: <Clock className="w-3 h-3" /> },
    { name: 'status', type: 'field', icon: <AlertCircle className="w-3 h-3" /> },
    { name: 'comentarios', type: 'field', icon: <MessageSquare className="w-3 h-3" /> },
    { name: 'impostos.icms', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'impostos.ipi', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'impostos.st', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'impostos.pis', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'impostos.cofins', type: 'field', icon: <TrendingUp className="w-3 h-3" /> },
    { name: 'UPPER(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'LOWER(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'PROPER(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'LEN(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'ABS(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'TRIM(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'ROUND(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'YEAR(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'MONTH(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'DAY(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'WEEKDAY(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'LEFT(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'RIGHT(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'SUBSTITUTE(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'CONTAINS(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'STARTSWITH(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'ENDSWITH(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'TODAY()', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'ISNULL(', type: 'func', icon: <Cpu className="w-3 h-3" /> },
    { name: 'ISNOTNULL(', type: 'func', icon: <Cpu className="w-3 h-3" /> }
  ], []);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const value = textarea.value;
    const pos = textarea.selectionStart;
    setAdvancedFilterExpression(value);
    setCursorPos(pos);
    setActiveTextarea(textarea);

    // Calculate coordinates for suggestions
    const textBefore = value.substring(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length - 1;
    const colNum = lines[lines.length - 1].length;
    
    // Approximations for text-xs font-mono
    const lineHeight = 16; 
    const charWidth = 7.2;
    
    setSuggestionCoords({
      top: 12 + (lineNum + 1) * lineHeight - textarea.scrollTop,
      left: Math.min(textarea.clientWidth - 160, 16 + colNum * charWidth)
    });

    // Find current word
    const lastWordMatch = textBefore.match(/[\w.]+$/);
    const currentWord = lastWordMatch ? lastWordMatch[0].toUpperCase() : '';

    if (currentWord.length > 0) {
      const filtered = allSuggestions.filter(s => s.name.toUpperCase().startsWith(currentWord));
      setSuggestions(filtered);
      setSuggestionIndex(0);
    } else {
      setSuggestions([]);
    }
  };

  const applySuggestion = (suggestion: {name: string, type: string, icon: React.ReactNode}) => {
    const textBefore = advancedFilterExpression.substring(0, cursorPos);
    const textAfter = advancedFilterExpression.substring(cursorPos);
    
    const lastWordMatch = textBefore.match(/[\w.]+$/);
    const lastWord = lastWordMatch ? lastWordMatch[0] : '';
    
    const newTextBefore = textBefore.substring(0, textBefore.length - lastWord.length) + suggestion.name;
    setAdvancedFilterExpression(newTextBefore + textAfter);
    setSuggestions([]);
    
    // Set focus back and move cursor
    if (activeTextarea) {
      activeTextarea.focus();
      const newPos = newTextBefore.length;
      setTimeout(() => {
        activeTextarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
      } else if (e.key === 'Escape') {
        setSuggestions([]);
      }
    }
  };
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const deferredFilterCfop = useDeferredValue(filterCfop);
  const deferredFilterSupplier = useDeferredValue(filterSupplier);
  const deferredFilterTipo = useDeferredValue(filterTipo);
  const deferredFilterImpactoMin = useDeferredValue(filterImpactoMin);
  const deferredFilterDataInicio = useDeferredValue(filterDataInicio);
  const deferredFilterDataFim = useDeferredValue(filterDataFim);
  const deferredFilterTipoMaterial = useDeferredValue(filterTipoMaterial);
  const deferredFilterCategoriaNF = useDeferredValue(filterCategoriaNF);
  const deferredFilterOrigemMaterial = useDeferredValue(filterOrigemMaterial);
  const deferredFilterEmpresa = useDeferredValue(filterEmpresa);
  const deferredFilterStatus = useDeferredValue(filterStatus);

  const [showColunas, setShowColunas] = useState<ShowColunas>({
    empresa: false,
    numeroNF: false,
    tipoMaterial: false,
    categoriaNF: false,
    origemMaterial: false,
    dataLancamento: false,
    precoSemFrete: false,
    precoComFrete: false,
    valorLiqSemFrete: false,
    valorLiqComFrete: false,
    valorTotalSemFrete: false,
    valorTotalComFrete: false,
  });
  const [expandedRows, setExpandedRows] = useState<Set<number | string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSAPExportModalOpen, setIsSAPExportModalOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number | string>>(new Set());
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [isGrouped, setIsGrouped] = useState(false);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  // Use pre-calculated unique values from the worker if available, otherwise calculate them
  const uniqueValues = useMemo(() => {
    if (!resultado) return { cfops: [], suppliers: [], tipoMaterial: [], categoriaNF: [], origemMaterial: [], empresa: [] };
    
    if (resultado.uniqueValues) {
      return resultado.uniqueValues;
    }

    const cfops = new Set<string>();
    const suppliers = new Set<string>();
    const tipoMaterial = new Set<string>();
    const categoriaNF = new Set<string>();
    const origemMaterial = new Set<string>();
    const empresa = new Set<string>();
    
    const items = resultado.todosOsItens;
    for (let i = 0; i < items.length; i++) {
      const d = items[i];
      if (d.cfop) cfops.add(d.cfop);
      if (d.fornecedor) suppliers.add(d.fornecedor);
      if (d.tipoMaterial) tipoMaterial.add(d.tipoMaterial);
      if (d.categoriaNF) categoriaNF.add(d.categoriaNF);
      if (d.origemMaterial) origemMaterial.add(d.origemMaterial);
      if (d.empresa) empresa.add(d.empresa);
    }
    
    return {
      cfops: Array.from(cfops).sort(),
      suppliers: Array.from(suppliers).sort(),
      tipoMaterial: Array.from(tipoMaterial).sort(),
      categoriaNF: Array.from(categoriaNF).sort(),
      origemMaterial: Array.from(origemMaterial).sort(),
      empresa: Array.from(empresa).sort()
    };
  }, [resultado]);

  const { cfops: uniqueCfops, suppliers: uniqueSuppliers, tipoMaterial: uniqueTipoMaterial, categoriaNF: uniqueCategoriaNF, origemMaterial: uniqueOrigemMaterial, empresa: uniqueEmpresa } = uniqueValues;
  
  // Pre-calculate tax percentages and variations for all items
  // This ensures complex calculations don't happen during main render or row rendering
  const enrichedItems = useMemo(() => {
    if (!resultado || !resultado.todosOsItens) return [];
    
    return resultado.todosOsItens.map((item: Divergencia) => {
      if (!item) return null;
      // If already has all percentages, return as is
      if (item.totalImpostosPerc !== undefined && item.ipiEfetivoPerc !== undefined) {
        return item;
      }
      
      const preco = item.precoEfetivo || 0;
      const custo = item.custoPadrao || 0;
      const qtd = item.quantidade || 0;
      const totalValor = preco * qtd;
      
      const icms = item.impostos?.icms || 0;
      const ipi = item.impostos?.ipi || 0;
      const pis = item.impostos?.pis || 0;
      const cofins = item.impostos?.cofins || 0;
      const st = item.impostos?.st || 0;
      const totalImpostos = icms + ipi + pis + cofins + st;
      
      return {
        ...item,
        icmsEfetivoPerc: totalValor > 0 ? (icms / totalValor) * 100 : 0,
        ipiEfetivoPerc: totalValor > 0 ? (ipi / totalValor) * 100 : 0,
        pisEfetivoPerc: totalValor > 0 ? (pis / totalValor) * 100 : 0,
        cofinsEfetivoPerc: totalValor > 0 ? (cofins / totalValor) * 100 : 0,
        stEfetivoPerc: totalValor > 0 ? (st / totalValor) * 100 : 0,
        totalImpostosPerc: totalValor > 0 ? (totalImpostos / totalValor) * 100 : 0,
        // Ensure variation is also pre-calculated if missing
        variacaoPerc: item.variacaoPerc ?? (custo !== 0 ? ((preco / custo) - 1) * 100 : 0),
        impactoFinanceiro: item.impactoFinanceiro ?? ((preco - custo) * qtd)
      };
    });
  }, [resultado]);

  // Heavy O(N) pass: Filtering and Summary calculation
  // This only runs when filters change, NOT when the page changes.
  const filteredResult = useMemo(() => {
    if (!resultado || enrichedItems.length === 0) {
      return { 
        allFilteredItems: [], 
        selectableItems: [],
        cfopSummary: [], 
        supplierSummary: [], 
        materialSummary: [], 
        pivotSummary: [],
        totals: { prejuizo: 0, economia: 0 },
        advancedFilterError: null
      };
    }

    const term = deferredSearchTerm.toLowerCase();
    const items = enrichedItems;
    const len = items.length;
    
    const allFilteredItems: Divergencia[] = [];
    const selectableItems: Divergencia[] = [];
    const cfopMap: Record<string, any> = {};
    const supplierMap: Record<string, any> = {};
    const materialMap: Record<string, any> = {};
    const pivotMap: Record<string, any> = {};
    const totals = { prejuizo: 0, economia: 0 };
    let advancedFilterError: string | null = null;
    
    for (let i = 0; i < len; i++) {
      const d = items[i] as Divergencia;
      if (!d) continue;
      
      // Filtering logic
      const matchesSearch = term === '' || d._search.includes(term);
      if (!matchesSearch) continue;
      
      const matchesCfop = deferredFilterCfop === '' || d.cfop === deferredFilterCfop;
      if (!matchesCfop) continue;
      
      const matchesSupplier = deferredFilterSupplier === '' || d.fornecedor === deferredFilterSupplier;
      if (!matchesSupplier) continue;
      
      let matchesTipo = true;
      if (deferredFilterTipo !== 'Todos') {
        matchesTipo = d.tipo === deferredFilterTipo;
      }
      if (!matchesTipo) continue;

      const matchesStatus = deferredFilterStatus === 'Todos' || d.status === deferredFilterStatus;
      if (!matchesStatus) continue;

      const matchesImpacto = deferredFilterTipo !== 'Todos' || Math.abs(d.impactoFinanceiro) >= deferredFilterImpactoMin;
      if (!matchesImpacto) continue;
      
      const matchesData = (!deferredFilterDataInicio || !d.data || d.data >= deferredFilterDataInicio) &&
                          (!deferredFilterDataFim || !d.data || d.data <= deferredFilterDataFim);
      if (!matchesData) continue;

      const matchesTipoMaterial = !showColunas.tipoMaterial || deferredFilterTipoMaterial.length === 0 || (d.tipoMaterial && deferredFilterTipoMaterial.includes(d.tipoMaterial));
      if (!matchesTipoMaterial) continue;
      
      const matchesCategoriaNF = !showColunas.categoriaNF || deferredFilterCategoriaNF.length === 0 || (d.categoriaNF && deferredFilterCategoriaNF.includes(d.categoriaNF));
      if (!matchesCategoriaNF) continue;
      
      const matchesOrigemMaterial = !showColunas.origemMaterial || deferredFilterOrigemMaterial.length === 0 || (d.origemMaterial && deferredFilterOrigemMaterial.includes(d.origemMaterial));
      if (!matchesOrigemMaterial) continue;
      
      const matchesEmpresa = !showColunas.empresa || deferredFilterEmpresa.length === 0 || deferredFilterEmpresa.includes(d.empresa);
      if (!matchesEmpresa) continue;

      // Advanced Filter Logic
      if ((showAdvancedFilter || activeTab === 'config') && deferredAdvancedFilterExpression.trim()) {
        try {
          const conditions = deferredAdvancedFilterExpression.split(/&&|\n/).filter(c => c.trim() !== '');
          const matchesAdvanced = conditions.every(condition => {
            const trimmed = condition.trim();
            const match = trimmed.match(/^\s*(.+?)\s*(==|!=|>=|<=|>|<|===|!==)\s*(.*)\s*$/);
            
            // Helper to evaluate a part (field, function, or method)
            const evaluatePart = (part: string, item: Divergencia): any => {
              const pTrimmed = part.trim();
              
              // Handle method calls like field.includes('value')
              const methodMatch = pTrimmed.match(/^(.+)\.(\w+)\((.*)\)$/);
              if (methodMatch) {
                const [_, objPath, methodName, argsStr] = methodMatch;
                const obj = objPath.split('.').reduce((acc: any, k) => acc && acc[k], item);
                const args = argsStr.split(',').map(a => a.trim().replace(/['"]/g, ''));
                
                if (obj !== undefined && obj !== null) {
                  if (methodName === 'includes') {
                    return String(obj).toLowerCase().includes(args[0].toLowerCase());
                  }
                }
              }

              const funcMatch = pTrimmed.match(/^(\w+)\((.*)\)$/);
              if (funcMatch) {
                const [_, funcName, argsStr] = funcMatch;
                const args = argsStr.split(',').map(a => a.trim().replace(/['"]/g, ''));
                const firstVal = args[0].split('.').reduce((acc: any, k) => acc && acc[k], item);
                
                switch (funcName.toUpperCase()) {
                  case 'UPPER': return String(firstVal).toUpperCase();
                  case 'LOWER': return String(firstVal).toLowerCase();
                  case 'PROPER': return String(firstVal).replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                  case 'LEN': return String(firstVal).length;
                  case 'ABS': return Math.abs(Number(firstVal));
                  case 'TRIM': return String(firstVal).trim();
                  case 'ROUND': return Number(Number(firstVal).toFixed(parseInt(args[1]) || 0));
                  case 'YEAR': return firstVal ? new Date(firstVal).getFullYear() : null;
                  case 'MONTH': return firstVal ? new Date(firstVal).getMonth() + 1 : null;
                  case 'DAY': return firstVal ? new Date(firstVal).getDate() : null;
                  case 'WEEKDAY': return firstVal ? new Date(firstVal).getDay() + 1 : null;
                  case 'TODAY': return new Date();
                  case 'ISNULL': return firstVal === null || firstVal === undefined;
                  case 'ISNOTNULL': return firstVal !== null && firstVal !== undefined;
                  case 'LEFT': return String(firstVal).substring(0, parseInt(args[1]) || 0);
                  case 'RIGHT': {
                    const s = String(firstVal);
                    const n = parseInt(args[1]) || 0;
                    return s.substring(s.length - n);
                  }
                  case 'SUBSTITUTE': {
                    const oldText = args[1].replace(/['"]/g, '');
                    const newText = args[2].replace(/['"]/g, '');
                    return String(firstVal).replace(new RegExp(oldText, 'g'), newText);
                  }
                  case 'CONTAINS': {
                    const search = args[1].replace(/['"]/g, '');
                    return String(firstVal).toLowerCase().includes(search.toLowerCase());
                  }
                  case 'STARTSWITH': {
                    const search = args[1].replace(/['"]/g, '');
                    return String(firstVal).toLowerCase().startsWith(search.toLowerCase());
                  }
                  case 'ENDSWITH': {
                    const search = args[1].replace(/['"]/g, '');
                    return String(firstVal).toLowerCase().endsWith(search.toLowerCase());
                  }
                  default: return firstVal;
                }
              }
              
              // Handle property access
              const val = pTrimmed.split('.').reduce((acc: any, p) => acc && acc[p], item);
              if (val !== undefined) return val;

              // Handle literals
              if (pTrimmed.startsWith("'") || pTrimmed.startsWith('"')) {
                return pTrimmed.replace(/['"]/g, '');
              }
              if (!isNaN(Number(pTrimmed))) {
                return Number(pTrimmed);
              }
              return pTrimmed;
            };

            if (!match) {
              // Try to evaluate as a standalone boolean expression
              const val = evaluatePart(trimmed, d);
              return val === true;
            }
            
            const [_, leftPart, operator, rawValue] = match;
            const itemValue = evaluatePart(leftPart, d);
            let compareValue: any = rawValue.trim();
            
            // Handle strings in quotes
            if ((compareValue.startsWith("'") && compareValue.endsWith("'")) || 
                (compareValue.startsWith('"') && compareValue.endsWith('"'))) {
              compareValue = compareValue.substring(1, compareValue.length - 1);
            } else if (compareValue === 'true') {
              compareValue = true;
            } else if (compareValue === 'false') {
              compareValue = false;
            } else if (compareValue === 'null') {
              compareValue = null;
            } else if (!isNaN(Number(compareValue)) && compareValue !== '') {
              compareValue = Number(compareValue);
            }
            
            switch (operator) {
              case '==': return itemValue == compareValue;
              case '!=': return itemValue != compareValue;
              case '>': return itemValue > compareValue;
              case '<': return itemValue < compareValue;
              case '>=': return itemValue >= compareValue;
              case '<=': return itemValue <= compareValue;
              case '===': return itemValue === compareValue;
              case '!==': return itemValue !== compareValue;
              default: return true;
            }
          });
          if (!matchesAdvanced) continue;
        } catch (e) {
          advancedFilterError = e instanceof Error ? e.message : String(e);
          // If expression is invalid, don't filter by it
        }
      }

      // If we reach here, the item matches all filters
      allFilteredItems.push(d);
      if (d.impactoFinanceiro !== 0) {
        selectableItems.push(d);
      }
      
      // 1. Totals
      if (d.tipo === 'acima do custo padrão') totals.prejuizo += d.impactoFinanceiro;
      else if (d.tipo === 'abaixo do custo padrão') totals.economia += Math.abs(d.impactoFinanceiro);
      
      // 2. Summaries (Calculate all for instant tab switching)
      if (!cfopMap[d.cfop]) cfopMap[d.cfop] = { cfop: d.cfop, count: 0, countDiv: 0, prejuizo: 0, economia: 0 };
      cfopMap[d.cfop].count++;
      if (d.tipo !== 'Sem Divergência') cfopMap[d.cfop].countDiv++;
      if (d.tipo === 'acima do custo padrão') cfopMap[d.cfop].prejuizo += d.impactoFinanceiro;
      else if (d.tipo === 'abaixo do custo padrão') cfopMap[d.cfop].economia += Math.abs(d.impactoFinanceiro);
      
      if (!supplierMap[d.fornecedor]) supplierMap[d.fornecedor] = { name: d.fornecedor, count: 0, countDiv: 0, prejuizo: 0, economia: 0 };
      supplierMap[d.fornecedor].count++;
      if (d.tipo !== 'Sem Divergência') supplierMap[d.fornecedor].countDiv++;
      if (d.tipo === 'acima do custo padrão') supplierMap[d.fornecedor].prejuizo += d.impactoFinanceiro;
      else if (d.tipo === 'abaixo do custo padrão') supplierMap[d.fornecedor].economia += Math.abs(d.impactoFinanceiro);
      
      const key = `${d.material} - ${d.descricao}`;
      if (!materialMap[key]) materialMap[key] = { material: d.material, descricao: d.descricao, count: 0, countDiv: 0, prejuizo: 0, economia: 0 };
      materialMap[key].count++;
      if (d.tipo !== 'Sem Divergência') materialMap[key].countDiv++;
      if (d.tipo === 'acima do custo padrão') materialMap[key].prejuizo += d.impactoFinanceiro;
      else if (d.tipo === 'abaixo do custo padrão') materialMap[key].economia += Math.abs(d.impactoFinanceiro);

      // Pivot Summary (Combined)
      const pivotKey = `${d.cfop}|${d.fornecedor}|${d.material}`;
      if (!pivotMap[pivotKey]) pivotMap[pivotKey] = { 
        cfop: d.cfop, 
        fornecedor: d.fornecedor, 
        material: d.material, 
        descricao: d.descricao,
        count: 0, 
        countDiv: 0, 
        prejuizo: 0, 
        economia: 0 
      };
      pivotMap[pivotKey].count++;
      if (d.tipo !== 'Sem Divergência') pivotMap[pivotKey].countDiv++;
      if (d.tipo === 'acima do custo padrão') pivotMap[pivotKey].prejuizo += d.impactoFinanceiro;
      else if (d.tipo === 'abaixo do custo padrão') pivotMap[pivotKey].economia += Math.abs(d.impactoFinanceiro);
    }
    
    // Sort if needed
    if (sortConfig) {
      allFilteredItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Divergencia];
        let bValue: any = b[sortConfig.key as keyof Divergencia];
        
        if (sortConfig.key.includes('.')) {
          const parts = sortConfig.key.split('.');
          aValue = parts.reduce((obj: any, key) => obj && obj[key], a);
          bValue = parts.reduce((obj: any, key) => obj && obj[key], b);
        }

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Apply Material/Description Grouping if enabled
    if (isGrouped) {
      const groupedMap: Record<string, any> = {};
      
      allFilteredItems.forEach(item => {
        const key = `${item.material}|${item.descricao}`;
        if (!groupedMap[key]) {
          groupedMap[key] = {
            ...item,
            id: `grouped_${key}`, // Use string ID for groups
            quantidade: 0,
            impactoFinanceiro: 0,
            custoTotalRealCKM3: 0, // quantidade * custoPadrao
            valorTotalNF: 0, // quantidade * precoEfetivo
            count: 0,
            numeroNF: 'Vários',
            empresa: 'Várias',
            arquivo: 'Vários',
            tipoMaterial: item.tipoMaterial,
            categoriaNF: item.categoriaNF,
            origemMaterial: item.origemMaterial,
            status: 'Agrupado',
            _isGroupRoot: true,
            children: [] // Store children items
          };
        }
        
        groupedMap[key].quantidade += item.quantidade || 0;
        groupedMap[key].impactoFinanceiro += item.impactoFinanceiro || 0;
        groupedMap[key].custoTotalRealCKM3 += (item.quantidade || 0) * (item.custoPadrao || 0);
        groupedMap[key].valorTotalNF += (item.quantidade || 0) * (item.precoEfetivo || 0);
        groupedMap[key].count++;
        groupedMap[key].children.push(item);
      });

      // Recalculate average costs/prices for visualization
      const finalGroupedItems = Object.values(groupedMap).map(group => {
        if (group.quantidade > 0) {
          group.custoPadrao = group.custoTotalRealCKM3 / group.quantidade;
          group.precoEfetivo = group.valorTotalNF / group.quantidade;
          group.variacaoPerc = group.custoPadrao !== 0 ? ((group.precoEfetivo / group.custoPadrao) - 1) * 100 : 0;
        }
        return group;
      });

      return {
        allFilteredItems: finalGroupedItems,
        selectableItems: [], // Disable selection in grouped mode or handle separately
        cfopSummary: Object.values(cfopMap).sort((a: any, b: any) => (b.prejuizo - b.economia) - (a.prejuizo - a.economia)),
        supplierSummary: Object.values(supplierMap).sort((a: any, b: any) => (b.prejuizo - b.economia) - (a.prejuizo - a.economia)),
        materialSummary: Object.values(materialMap).sort((a: any, b: any) => (b.prejuizo - b.economia) - (a.prejuizo - a.economia)),
        pivotSummary: Object.values(pivotMap).sort((a: any, b: any) => (b.prejuizo - b.economia) - (a.prejuizo - a.economia)),
        totals,
        advancedFilterError
      };
    }

    return {
      allFilteredItems,
      selectableItems,
      cfopSummary: Object.values(cfopMap).sort((a: any, b: any) => (b.prejuizo - b.economia) - (a.prejuizo - a.economia)),
      supplierSummary: Object.values(supplierMap).sort((a: any, b: any) => b.prejuizo - a.prejuizo),
      materialSummary: Object.values(materialMap).sort((a: any, b: any) => b.prejuizo - a.prejuizo),
      pivotSummary: Object.values(pivotMap).sort((a: any, b: any) => b.prejuizo - a.prejuizo),
      totals,
      advancedFilterError
    };
  }, [resultado, deferredSearchTerm, deferredFilterCfop, deferredFilterSupplier, deferredFilterTipo, deferredFilterStatus, deferredFilterImpactoMin, deferredFilterDataInicio, deferredFilterDataFim, 
      deferredFilterTipoMaterial, deferredFilterCategoriaNF, deferredFilterOrigemMaterial, deferredFilterEmpresa, showColunas, showAdvancedFilter, activeTab, deferredAdvancedFilterExpression, sortConfig]);

  const { 
    allFilteredItems, 
    selectableItems, 
    cfopSummary, 
    supplierSummary, 
    materialSummary, 
    pivotSummary, 
    totals, 
    advancedFilterError 
  } = filteredResult;
  const filteredCount = allFilteredItems.length;

  const currentCount = useMemo(() => {
    if (activeTab === 'cfop') return cfopSummary.length;
    if (activeTab === 'fornecedores') return supplierSummary.length;
    if (activeTab === 'top5') return materialSummary.length;
    if (activeTab === 'pivot') return pivotSummary.length;
    return allFilteredItems.length;
  }, [activeTab, allFilteredItems.length, cfopSummary.length, supplierSummary.length, materialSummary.length, pivotSummary.length]);

  const summaryTotals = useMemo(() => {
    const currentSummary = activeTab === 'cfop' ? cfopSummary : 
                          activeTab === 'fornecedores' ? supplierSummary : 
                          activeTab === 'top5' ? materialSummary : 
                          pivotSummary;
    
    const totalItens = currentSummary.reduce((acc, i) => acc + (i.count || 0), 0);
    const totalDiv = currentSummary.reduce((acc, i) => acc + (i.countDiv || 0), 0);
    const divPerc = totalItens > 0 ? (totalDiv / totalItens) * 100 : 0;
    
    return { totalItens, totalDiv, divPerc };
  }, [activeTab, cfopSummary, supplierSummary, materialSummary, pivotSummary]);

  // Reset scroll when filters or tab change
  useEffect(() => {
    // Scroll to top if needed
  }, [searchTerm, filterCfop, filterSupplier, filterTipo, filterImpactoMin, filterDataInicio, filterDataFim, 
      filterTipoMaterial, filterCategoriaNF, filterOrigemMaterial, filterEmpresa, activeTab]);

  const handleFilterBySummary = (type: 'cfop' | 'fornecedor' | 'material', value: string) => {
    if (type === 'cfop') {
      setFilterCfop(value);
      setFilterCfopDefault(value);
    } else if (type === 'fornecedor') {
      setFilterSupplier(value);
      setFilterSupplierDefault(value);
    } else if (type === 'material') {
      setSearchTerm(value);
    }
    setActiveTab('divergencias');
    addToast(`Filtrado por ${type}: ${value}`, 'info');
  };

  const toggleRow = React.useCallback((id: number | string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedRows(new Set());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const salvarFiltros = React.useCallback(() => {
    setFilterCfopDefault(filterCfop);
    setFilterSupplierDefault(filterSupplier);
    setFilterTipoDefault(filterTipo);
    setFilterImpactoMinDefault(filterImpactoMin);
    addToast('Filtros salvos com sucesso!', 'success');
  }, [filterCfop, filterSupplier, filterTipo, filterImpactoMin, setFilterCfopDefault, setFilterSupplierDefault, setFilterTipoDefault, setFilterImpactoMinDefault, addToast]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const handleExportActionPlan = React.useCallback(() => {
    if (!resultado) return;
    
    setExportProgress({ active: true, progress: 10, status: 'Preparando Plano de Ação...' });
    
    setTimeout(() => {
      // Filter items for action plan (Pending or In Analysis)
      const actionPlanItems = resultado.divergencias.filter((d: any) => 
        d.status === 'Pendente' || d.status === 'Em Análise'
      );

      if (actionPlanItems.length === 0) {
        addToast('Nenhum item pendente ou em análise para o plano de ação.', 'info');
        setExportProgress({ active: false, progress: 0, status: '' });
        return;
      }

      setExportProgress(prev => ({ ...prev, progress: 40, status: 'Formatando dados...' }));

    const headers = [
      'Status', 'Material', 'Descrição', 'Fornecedor', 'CFOP', 
      'Impacto Financeiro', 'Preço Efetivo', 'Custo Padrão', 
      'Quantidade', 'Data', 'Comentários'
    ];

    const data = actionPlanItems.map((d: any) => [
      d.status,
      d.material,
      d.descricao,
      d.fornecedor,
      d.cfop,
      d.impactoFinanceiro,
      d.precoEfetivo,
      d.custoPadrao,
      d.quantidade,
      d.data,
      d.comentarios || ''
    ]);

    setExportProgress(prev => ({ ...prev, progress: 70, status: 'Gerando planilha...' }));

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plano de Ação");

    // Auto-size columns
    const maxWidths = headers.map((h, i) => {
      let max = h.length;
      data.forEach(row => {
        const val = String(row[i] || '');
        if (val.length > max) max = val.length;
      });
      return { wch: Math.min(max + 2, 50) };
    });
    ws['!cols'] = maxWidths;

    setExportProgress(prev => ({ ...prev, progress: 90, status: 'Finalizando arquivo...' }));

    XLSX.writeFile(wb, `Plano_de_Acao_Auditoria_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast('Plano de ação exportado com sucesso!', 'success');
    
    setTimeout(() => setExportProgress({ active: false, progress: 0, status: '' }), 500);
    }, 100);
  }, [resultado, addToast]);

  const handleExportExcel = React.useCallback((customCols?: Set<string>, includeAllItems: boolean = false, includeSummaries: boolean = true, includePivot: boolean = true) => {
    if (!resultado) return;

    setExportProgress({ active: true, progress: 5, status: 'Iniciando exportação Excel...' });

    setTimeout(() => {
      const wb = XLSX.utils.book_new();

      // Determine data to process
      let dataToProcess: any[] = [];
      
      if (selectedItems.size > 0) {
        dataToProcess = resultado.todosOsItens.filter((d: any) => selectedItems.has(d.id));
      } else if (includeAllItems) {
        const term = searchTerm.toLowerCase();
        dataToProcess = resultado.todosOsItens.filter((d: any) => {
          const matchesSearch = term === '' || d._search.includes(term);
          const matchesCfop = filterCfop === '' || d.cfop === filterCfop;
          const matchesSupplier = filterSupplier === '' || d.fornecedor === filterSupplier;
          const matchesData = (!filterDataInicio || !d.data || d.data >= filterDataInicio) &&
                              (!filterDataFim || !d.data || d.data <= filterDataFim);
          const matchesEmpresa = filterEmpresa.length === 0 || filterEmpresa.includes(d.empresa);
          
          return matchesSearch && matchesCfop && matchesSupplier && matchesData && matchesEmpresa;
        });
      } else {
        dataToProcess = allFilteredItems;
      }

      if (dataToProcess.length === 0) {
        addToast('Nenhum dado para exportar com os filtros atuais.', 'info');
        setExportProgress({ active: false, progress: 0, status: '' });
        return;
      }

      setExportProgress(prev => ({ ...prev, progress: 15, status: 'Preparando estilos...' }));

    const colsToExport = customCols || new Set(EXPORT_COLUMNS.map(c => c.id));

    // Common Styles
    const headerStyle = {
      fill: { fgColor: { rgb: "78AF32" } },
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "666666" } },
        bottom: { style: "thin", color: { rgb: "666666" } },
        left: { style: "thin", color: { rgb: "666666" } },
        right: { style: "thin", color: { rgb: "666666" } }
      }
    };

    const dataStyle = {
      font: { sz: 10 },
      alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "EEEEEE" } },
        bottom: { style: "thin", color: { rgb: "EEEEEE" } },
        left: { style: "thin", color: { rgb: "EEEEEE" } },
        right: { style: "thin", color: { rgb: "EEEEEE" } }
      }
    };

    const numberStyle = {
      ...dataStyle,
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0.00"
    };

    const styleSheet = (ws: any) => {
      if (!ws['!ref']) return;
      const r = XLSX.utils.decode_range(ws['!ref']);
      for (let R = r.s.r; R <= r.e.r; ++R) {
        for (let C = r.s.c; C <= r.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellRef]) continue;
          if (R === 0) {
            ws[cellRef].s = headerStyle;
          } else {
            const val = ws[cellRef].v;
            ws[cellRef].s = typeof val === 'number' ? numberStyle : dataStyle;
          }
        }
      }
    };

    // 0. Capa Sheet
    setExportProgress(prev => ({ ...prev, progress: 25, status: 'Gerando capa...' }));
    const capaAoa = [
      ["RELATÓRIO DE AUDITORIA - MINI-SAP WEB"],
      [""],
      ["INFORMAÇÕES GERAIS"],
      ["Empresa", resultado.empresa || "Todas"],
      ["Data da Auditoria", new Date().toLocaleDateString('pt-BR')],
      ["Período", `${filterDataInicio || 'Início'} até ${filterDataFim || 'Fim'}`],
      ["Total de Itens Auditados", dataToProcess.length],
      [""],
      ["RESUMO FINANCEIRO"],
      ["Total Acima do Custo Padrão", resultado.totalPrejuizo],
      ["Total Abaixo do Custo Padrão", resultado.totalEconomia],
      ["Impacto Líquido", resultado.totalPrejuizo - resultado.totalEconomia],
      [""],
      ["FILTROS APLICADOS"],
      ["CFOP", filterCfop || "Todos"],
      ["Fornecedor", filterSupplier || "Todos"],
      ["Termo de Busca", searchTerm || "Nenhum"]
    ];

    const wsCapa = XLSX.utils.aoa_to_sheet(capaAoa);
    
    // Capa Styling
    wsCapa['A1'].s = { font: { bold: true, sz: 20, color: { rgb: "78AF32" } } };
    wsCapa['A3'].s = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "F3F4F6" } } };
    wsCapa['A9'].s = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "F3F4F6" } } };
    wsCapa['A14'].s = { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: "F3F4F6" } } };
    
    const currencySymbol = formatoMoeda.formatToParts(0).find(p => p.type === 'currency')?.value || 'R$';
    
    // Format numbers in Capa
    ['B10', 'B11', 'B12'].forEach(ref => {
      if (wsCapa[ref]) wsCapa[ref].s = { numFmt: `"${currencySymbol} "#,##0.00`, font: { bold: true } };
    });

    wsCapa['!cols'] = [{ wch: 30 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsCapa, "Capa");

    // 1. Prepare "PREÇO ENTRADA" Sheet (Pivot by Month)
    if (includePivot) {
      setExportProgress(prev => ({ ...prev, progress: 40, status: 'Processando dados de entrada...' }));
      const groups: { [key: string]: any } = {};
      dataToProcess.forEach((item: any) => {
        const key = `${item.centro}_${item.material}`;
        if (!groups[key]) {
          groups[key] = {
            centro: item.centro,
            material: item.material,
            descricao: item.descricao,
            tipoMaterial: item.tipoMaterial,
            months: Array.from({ length: 12 }, () => ({
              entrada: 0, frete: 0, ckm3: 0, taxa: 0, fornecedor: '-', count: 0,
              totalEntrada: 0, totalFrete: 0, totalCkm3: 0, totalTaxa: 0, suppliers: new Set<string>()
            }))
          };
        }

        const dateStr = item.dataLancamento || item.data;
        const date = dateStr ? new Date(dateStr) : null;
        if (date && !isNaN(date.getTime())) {
          const monthIdx = date.getMonth();
          const m = groups[key].months[monthIdx];
          m.count++;
          m.totalEntrada += item.precoEfetivo || 0;
          m.totalFrete += (item.precoComFrete || 0) - (item.precoSemFrete || 0);
          m.totalCkm3 += item.custoPadrao || 0;
          m.totalTaxa += (item.impostos?.icms || 0) + (item.impostos?.ipi || 0) + (item.impostos?.pis || 0) + (item.impostos?.cofins || 0);
          if (item.fornecedor) m.suppliers.add(item.fornecedor);
          m.entrada = m.totalEntrada / m.count;
          m.frete = m.totalFrete / m.count;
          m.ckm3 = m.totalCkm3 / m.count;
          m.taxa = m.totalTaxa / m.count;
          m.fornecedor = Array.from(m.suppliers).join(', ');
        }
      });

      const showEntrada = colsToExport.has('precoEfetivo');
      const showFrete = colsToExport.has('precoComFrete') || colsToExport.has('precoSemFrete');
      const showCkm3 = colsToExport.has('custoPadrao');
      const showTaxa = colsToExport.has('icms') || colsToExport.has('ipi') || colsToExport.has('pis') || colsToExport.has('cofins');
      const showFornecedor = colsToExport.has('fornecedor');

      const activeSubCols: string[] = [];
      if (showEntrada) activeSubCols.push("Entrada");
      if (showFrete) activeSubCols.push("Frete");
      if (showCkm3) activeSubCols.push("CKM3");
      if (showTaxa) activeSubCols.push("Taxa");
      if (showFornecedor) activeSubCols.push("Fornecedor");

      const subColCount = activeSubCols.length || 1;
      const aoa: any[][] = [];
      
      const titleRow = new Array(4 + (12 * subColCount)).fill("");
      titleRow[0] = "PREÇO ENTRADA";
      aoa.push(titleRow);
      aoa.push(new Array(4 + (12 * subColCount)).fill("")); // Spacer

      const mainHeaders = ["Centro", "Material", "Texto breve material", "Tipo de Material"];
      const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      months.forEach(m => {
        mainHeaders.push(m);
        for (let i = 1; i < subColCount; i++) mainHeaders.push("");
      });
      aoa.push(mainHeaders);

      const subHeaders = ["", "", "", ""];
      for (let i = 0; i < 12; i++) {
        if (activeSubCols.length > 0) activeSubCols.forEach(sc => subHeaders.push(sc));
        else subHeaders.push("-");
      }
      aoa.push(subHeaders);

      Object.values(groups).forEach((g: any) => {
        const row = [g.centro, g.material, g.descricao, g.tipoMaterial];
        g.months.forEach((m: any) => {
          if (activeSubCols.length === 0) row.push("-");
          else {
            if (showEntrada) row.push(m.count > 0 ? m.entrada : 0);
            if (showFrete) row.push(m.count > 0 ? m.frete : 0);
            if (showCkm3) row.push(m.count > 0 ? m.ckm3 : 0);
            if (showTaxa) row.push(m.count > 0 ? m.taxa : 0);
            if (showFornecedor) row.push(m.count > 0 ? m.fornecedor : "-");
          }
        });
        aoa.push(row);
      });

      const wsPreco = XLSX.utils.aoa_to_sheet(aoa);
      const range = XLSX.utils.decode_range(wsPreco['!ref'] || 'A1');
      
      const subHeaderStyle = {
        fill: { fgColor: { rgb: "EAF4DC" } },
        font: { color: { rgb: "333333" }, bold: true, sz: 10 },
        alignment: { horizontal: "center", vertical: "center" },
        border: headerStyle.border
      };

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsPreco[cellRef]) continue;
          if (R === 0) wsPreco[cellRef].s = { font: { bold: true, sz: 16, color: { rgb: "78AF32" } } };
          else if (R === 2) wsPreco[cellRef].s = headerStyle;
          else if (R === 3) wsPreco[cellRef].s = subHeaderStyle;
          else {
            const val = wsPreco[cellRef].v;
            wsPreco[cellRef].s = typeof val === 'number' ? numberStyle : dataStyle;
          }
        }
      }

      wsPreco['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];
      for (let i = 0; i < 12; i++) {
        const startCol = 4 + (i * subColCount);
        if (subColCount > 1) {
          wsPreco['!merges'].push({ s: { r: 2, c: startCol }, e: { r: 2, c: startCol + subColCount - 1 } });
        }
      }
      
      wsPreco['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, ...new Array(12 * subColCount).fill({ wch: 12 })];
      XLSX.utils.book_append_sheet(wb, wsPreco, "PREÇO ENTRADA");
    }

    // 2. Original Detailed Sheet
    setExportProgress(prev => ({ ...prev, progress: 60, status: 'Processando dados detalhados...' }));
    const buildExportRow = (d: any) => {
      const row: any = {};
      EXPORT_COLUMNS.forEach(col => {
        if (colsToExport.has(col.id)) {
          if (col.id === 'dataLancamento') row[col.label] = d.dataLancamento ? new Date(d.dataLancamento).toLocaleDateString('pt-BR') : '-';
          else if (col.id.startsWith('impostos.')) {
            const impKey = col.id.split('.')[1];
            row[col.label] = d.impostos?.[impKey] || 0;
          } else if (['icms', 'ipi', 'pis', 'cofins'].includes(col.id)) {
             row[col.label] = d.impostos?.[col.id] || 0;
          } else row[col.label] = d[col.id];
        }
      });
      return row;
    };

    const wsMain = XLSX.utils.json_to_sheet(dataToProcess.map(buildExportRow));
    styleSheet(wsMain);
    XLSX.utils.book_append_sheet(wb, wsMain, includeAllItems ? "Itens Detalhados" : "Divergências Detalhadas");

    if (includeSummaries) {
      setExportProgress(prev => ({ ...prev, progress: 80, status: 'Gerando resumos...' }));
      // 3. CFOP Summary Sheet
      const localCfopMap: any = {};
      dataToProcess.forEach(d => {
        if (!localCfopMap[d.cfop]) localCfopMap[d.cfop] = { cfop: d.cfop, count: 0, prejuizo: 0, economia: 0 };
        localCfopMap[d.cfop].count++;
        if (d.tipo === 'acima do custo padrão') localCfopMap[d.cfop].prejuizo += d.impactoFinanceiro;
        else if (d.tipo === 'abaixo do custo padrão') localCfopMap[d.cfop].economia += Math.abs(d.impactoFinanceiro);
      });

      const wsCfop = XLSX.utils.json_to_sheet(Object.values(localCfopMap).map((item: any) => ({
        'CFOP': item.cfop, 'Qtd Itens': item.count, 'Acima do Custo Padrão': item.prejuizo,
        'Abaixo do Custo Padrão': item.economia, 'Impacto Líquido': item.prejuizo - item.economia
      })));
      styleSheet(wsCfop);
      XLSX.utils.book_append_sheet(wb, wsCfop, "Resumo CFOP");

      // 4. Supplier Summary Sheet
      const localSupplierMap: any = {};
      dataToProcess.forEach(d => {
        if (!localSupplierMap[d.fornecedor]) localSupplierMap[d.fornecedor] = { name: d.fornecedor, count: 0, prejuizo: 0, economia: 0 };
        localSupplierMap[d.fornecedor].count++;
        if (d.tipo === 'acima do custo padrão') localSupplierMap[d.fornecedor].prejuizo += d.impactoFinanceiro;
        else if (d.tipo === 'abaixo do custo padrão') localSupplierMap[d.fornecedor].economia += Math.abs(d.impactoFinanceiro);
      });

      const wsSupplier = XLSX.utils.json_to_sheet(Object.values(localSupplierMap).map((item: any) => ({
        'Fornecedor': item.name, 'Qtd Itens': item.count, 'Acima do Custo Padrão': item.prejuizo, 'Abaixo do Custo Padrão': item.economia
      })));
      styleSheet(wsSupplier);
      XLSX.utils.book_append_sheet(wb, wsSupplier, "Fornecedores");

      // 5. Material Summary Sheet
      const localMaterialMap: any = {};
      dataToProcess.forEach(d => {
        if (!localMaterialMap[d.material]) localMaterialMap[d.material] = { material: d.material, descricao: d.descricao, count: 0, prejuizo: 0, economia: 0 };
        localMaterialMap[d.material].count++;
        if (d.tipo === 'acima do custo padrão') localMaterialMap[d.material].prejuizo += d.impactoFinanceiro;
        else if (d.tipo === 'abaixo do custo padrão') localMaterialMap[d.material].economia += Math.abs(d.impactoFinanceiro);
      });

      const wsMaterial = XLSX.utils.json_to_sheet(Object.values(localMaterialMap).map((item: any) => ({
        'Material': item.material, 'Descrição': item.descricao, 'Qtd Itens': item.count,
        'Acima do Custo Padrão': item.prejuizo, 'Abaixo do Custo Padrão': item.economia, 'Impacto Líquido': item.prejuizo - item.economia
      })));
      styleSheet(wsMaterial);
      XLSX.utils.book_append_sheet(wb, wsMaterial, "Materiais");

      // 6. Pivot Summary Sheet (Combined)
      const localPivotMap: any = {};
      dataToProcess.forEach(d => {
        const key = `${d.cfop}|${d.fornecedor}|${d.material}`;
        if (!localPivotMap[key]) localPivotMap[key] = { 
          cfop: d.cfop, 
          fornecedor: d.fornecedor, 
          material: d.material, 
          descricao: d.descricao,
          count: 0, 
          prejuizo: 0, 
          economia: 0 
        };
        localPivotMap[key].count++;
        if (d.tipo === 'acima do custo padrão') localPivotMap[key].prejuizo += d.impactoFinanceiro;
        else if (d.tipo === 'abaixo do custo padrão') localPivotMap[key].economia += Math.abs(d.impactoFinanceiro);
      });

      const wsPivot = XLSX.utils.json_to_sheet(Object.values(localPivotMap).map((item: any) => ({
        'CFOP': item.cfop, 'Fornecedor': item.fornecedor, 'Material': item.material, 
        'Descrição': item.descricao, 'Qtd Itens': item.count,
        'Acima do Custo Padrão': item.prejuizo, 'Abaixo do Custo Padrão': item.economia, 
        'Impacto Líquido': item.prejuizo - item.economia
      })));
      styleSheet(wsPivot);
      XLSX.utils.book_append_sheet(wb, wsPivot, "Resumo Consolidado");
    }

    setExportProgress(prev => ({ ...prev, progress: 95, status: 'Finalizando arquivo...' }));
    XLSX.writeFile(wb, `Auditoria_MiniSAP_${new Date().toISOString().split('T')[0]}.xlsx`);
    setIsExportModalOpen(false);
    addToast('Excel exportado com sucesso!', 'success');
    setTimeout(() => setExportProgress({ active: false, progress: 0, status: '' }), 500);
    }, 100);
  }, [resultado, allFilteredItems, searchTerm, filterCfop, filterSupplier, filterDataInicio, filterDataFim, filterEmpresa, addToast, selectedItems]);

  const handleExportPDF = React.useCallback((customCols?: Set<string>, includeAllItems: boolean = false) => {
    setExportProgress({ active: true, progress: 5, status: 'Iniciando exportação PDF...' });

    setTimeout(() => {
      try {
        if (!resultado) return;
        
        const jsPDFLib = (jsPDF as any).jsPDF || jsPDF;
        const doc = new jsPDFLib({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const date = new Date().toLocaleString('pt-BR');
        const colsToExport = customCols || new Set(['material', 'cfop', 'fornecedor', 'precoEfetivo', 'custoPadrao', 'impactoFinanceiro', 'tipo', 'status', 'comentarios']);

        // 1. Cover Page
        setExportProgress(prev => ({ ...prev, progress: 15, status: 'Gerando capa e resumos...' }));
        
        // Header Background
        doc.setFillColor(120, 175, 50); // #78AF32
        doc.rect(0, 0, 297, 45, 'F');
        
        // Logo Placeholder or App Name
        doc.setFontSize(28);
        doc.setTextColor(255, 255, 255);
        doc.text('AUDITORIA DE PREÇOS', 14, 25);
        
        doc.setFontSize(10);
        doc.text(`Mini-SAP Web Auditoria - Relatório Gerencial`, 14, 33);
        doc.text(`Gerado em: ${date}`, 14, 38);

        // Summary Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(18);
        doc.text('1. Resumo Executivo', 14, 60);

        // Info Grid
        doc.setFontSize(11);
        doc.text(`Empresa: ${String(resultado.empresa || "Todas")}`, 14, 70);
        doc.text(`Período: ${String(filterDataInicio || 'Início')} até ${String(filterDataFim || 'Fim')}`, 14, 77);
        doc.text(`Total de Itens Analisados: ${resultado.todosOsItens?.length || 0}`, 14, 84);
        
        // Financial Summary Box
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(14, 95, 130, 45, 2, 2, 'FD');
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Impacto Financeiro', 20, 105);
        doc.setFont(undefined, 'normal');
        
        doc.setFontSize(11);
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`Acima do Custo: ${formatoMoeda.format(resultado.totalPrejuizo || 0)}`, 20, 115);
        doc.setTextColor(22, 163, 74); // Green
        doc.text(`Abaixo do Custo: ${formatoMoeda.format(resultado.totalEconomia || 0)}`, 20, 123);
        doc.setTextColor(0, 0, 0);
        doc.setFont(undefined, 'bold');
        doc.text(`Impacto Líquido: ${formatoMoeda.format((resultado.totalPrejuizo || 0) - (resultado.totalEconomia || 0))}`, 20, 133);
        doc.setFont(undefined, 'normal');

        // Stats Box
        doc.roundedRect(150, 95, 130, 45, 2, 2, 'FD');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Estatísticas', 156, 105);
        doc.setFont(undefined, 'normal');
        
        doc.setFontSize(11);
        doc.text(`Total de Divergências: ${resultado.qtdDiv || 0}`, 156, 115);
        doc.text(`CFOPs com Divergência: ${Array.isArray(cfopSummary) ? cfopSummary.filter((c: any) => c.countDiv > 0).length : 0}`, 156, 123);
        doc.text(`Itens com Plano de Ação: ${resultado.divergencias.filter((d: any) => d.comentarios || d.status !== 'Pendente').length}`, 156, 133);

        // 2. Summary Tables
        setExportProgress(prev => ({ ...prev, progress: 35, status: 'Gerando tabelas de resumo...' }));
        doc.setFontSize(16);
        doc.text('2. Análise por CFOP e Fornecedor', 14, 160);
        
        const cfopData = Array.isArray(cfopSummary) ? [...cfopSummary]
          .sort((a, b) => (b.prejuizo || 0) - (a.prejuizo || 0))
          .slice(0, 8)
          .map(c => [
            String(c.cfop || '-'), 
            String(c.countDiv || 0), 
            formatoMoeda.format(c.prejuizo || 0), 
            formatoMoeda.format(c.economia || 0)
          ]) : [];

        if (cfopData.length > 0) {
          autoTable(doc, {
            startY: 165,
            margin: { right: 155 },
            head: [['CFOP', 'Diverg.', 'Acima Padrão', 'Abaixo Padrão']],
            body: cfopData,
            theme: 'grid',
            headStyles: { fillColor: [120, 175, 50], fontSize: 9 },
            styles: { fontSize: 8 }
          });
        }

        const supplierData = Array.isArray(supplierSummary) ? [...supplierSummary]
          .sort((a, b) => (b.prejuizo || 0) - (a.prejuizo || 0))
          .slice(0, 8)
          .map(s => [
            String(s.name || '-').substring(0, 25), 
            String(s.countDiv || 0), 
            formatoMoeda.format(s.prejuizo || 0)
          ]) : [];

        if (supplierData.length > 0) {
          autoTable(doc, {
            startY: 165,
            margin: { left: 150 },
            head: [['Fornecedor', 'Diverg.', 'Acima Padrão']],
            body: supplierData,
            theme: 'grid',
            headStyles: { fillColor: [120, 175, 50], fontSize: 9 },
            styles: { fontSize: 8 }
          });
        }

        // 3. Action Plan Section (Items with comments)
        const actionItems = resultado.divergencias.filter((d: any) => d.comentarios || d.status !== 'Pendente');
        if (actionItems.length > 0) {
          setExportProgress(prev => ({ ...prev, progress: 55, status: 'Gerando plano de ação...' }));
          doc.addPage();
          doc.setFontSize(18);
          doc.text('3. Plano de Ação e Comentários', 14, 20);
          doc.setFontSize(10);
          doc.text('Itens que possuem observações ou status alterado durante a auditoria.', 14, 27);
          
          const actionData = actionItems.slice(0, 100).map(d => [
            String(d.status || 'Pendente'),
            String(d.material || '-'),
            String(d.descricao || '-').substring(0, 30),
            formatoMoeda.format(d.impactoFinanceiro || 0),
            String(d.comentarios || 'Sem comentários')
          ]);

          autoTable(doc, {
            startY: 32,
            head: [['Status', 'Material', 'Descrição', 'Impacto', 'Comentários']],
            body: actionData,
            theme: 'grid',
            headStyles: { fillColor: [120, 175, 50] },
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 25 },
              2: { cellWidth: 60 },
              3: { cellWidth: 30, halign: 'right' },
              4: { cellWidth: 'auto' }
            },
            styles: { fontSize: 8, overflow: 'linebreak' }
          });
        }

        // 4. Detailed Table
        setExportProgress(prev => ({ ...prev, progress: 75, status: 'Gerando listagem detalhada...' }));
        doc.addPage();
        doc.setFontSize(18);
        doc.text('4. Detalhamento Geral das Divergências', 14, 20);

        let dataToProcess = includeAllItems ? resultado.todosOsItens : allFilteredItems;
        if (selectedItems.size > 0) {
          dataToProcess = resultado.todosOsItens.filter((d: any) => selectedItems.has(d.id));
        }

        const MAX_PDF_ROWS = 2000;
        if (dataToProcess.length > MAX_PDF_ROWS) {
          doc.setFontSize(10);
          doc.setTextColor(255, 0, 0);
          doc.text(`Aviso: Exportação limitada aos primeiros ${MAX_PDF_ROWS} itens.`, 14, 28);
          doc.setTextColor(0, 0, 0);
          dataToProcess = dataToProcess.slice(0, MAX_PDF_ROWS);
        }

        const activeCols = EXPORT_COLUMNS.filter(c => colsToExport.has(c.id));
        const tableHeaders = activeCols.map(c => c.label);

        const tableRows = dataToProcess.map((d: any) => {
          return activeCols.map(c => {
            const val = d[c.id];
            if (typeof val === 'number') {
              if (c.id.includes('Perc')) return `${val.toFixed(2)}%`;
              return formatoMoeda.format(val);
            }
            if (c.id === 'dataLancamento') return d.dataLancamento ? new Date(d.dataLancamento).toLocaleDateString('pt-BR') : '-';
            return String(val ?? '-').substring(0, 40);
          });
        });

        autoTable(doc, {
          startY: 32,
          head: [tableHeaders],
          body: tableRows,
          theme: 'grid',
          styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [120, 175, 50], textColor: 255 },
          alternateRowStyles: { fillColor: [248, 250, 252] }
        });

        setExportProgress(prev => ({ ...prev, progress: 95, status: 'Finalizando PDF...' }));
        doc.save(`Auditoria_MiniSAP_${new Date().toISOString().split('T')[0]}.pdf`);
        addToast('PDF exportado com sucesso!', 'success');
        setTimeout(() => setExportProgress({ active: false, progress: 0, status: '' }), 500);
      } catch (error) {
        console.error('Erro crítico na exportação PDF:', error);
        addToast('Erro ao gerar PDF. Tente filtrar menos dados.', 'error');
        setExportProgress({ active: false, progress: 0, status: '' });
      }
    }, 100);
  }, [resultado, allFilteredItems, cfopSummary, supplierSummary, pivotSummary, filterDataInicio, filterDataFim, addToast, selectedItems]);

  const handleExportSAP = React.useCallback((config: { delimiter: string, columns: string[] }) => {
    if (!resultado) return;

    setExportProgress({ active: true, progress: 10, status: 'Iniciando exportação SAP...' });

    setTimeout(() => {
      let dataToProcess: any[] = [];
      if (selectedItems.size > 0) {
        dataToProcess = resultado.todosOsItens.filter((d: any) => selectedItems.has(d.id));
      } else {
        dataToProcess = allFilteredItems;
      }

      if (dataToProcess.length === 0) {
        addToast('Nenhum dado para exportar.', 'info');
        setExportProgress({ active: false, progress: 0, status: '' });
        return;
      }

      setExportProgress(prev => ({ ...prev, progress: 40, status: 'Formatando dados SAP...' }));
    const headers = config.columns;
    const csvRows = [headers.join(config.delimiter)];

    dataToProcess.forEach(item => {
      const row = config.columns.map(col => {
        let val: any = '';
        switch (col) {
          case 'Material': val = item.material; break;
          case 'Descrição': val = item.descricao; break;
          case 'Fornecedor': val = item.fornecedor; break;
          case 'CFOP': val = item.cfop; break;
          case 'Empresa': val = item.empresa; break;
          case 'Número NF': val = item.numeroNF; break;
          case 'Qtd': val = item.quantidade; break;
          case 'Taxa de Câmbio': val = item.precoEfetivo; break;
          case 'Custo SAP': val = item.custoPadrao; break;
          case 'Impacto': val = item.impactoFinanceiro; break;
          case 'Status': val = item.status; break;
          case 'Data': val = item.dataLancamento ? new Date(item.dataLancamento).toLocaleDateString('pt-BR') : '-'; break;
          case 'Tipo Material': val = item.tipoMaterial; break;
          case 'Categoria NF': val = item.categoriaNF; break;
          case 'Origem Material': val = item.origemMaterial; break;
          case 'ICMS': val = item.icms; break;
          case 'IPI': val = item.ipi; break;
          case 'PIS': val = item.pis; break;
          case 'COFINS': val = item.cofins; break;
          case 'ST': val = item.st; break;
          case 'Divergência': val = item.impactoFinanceiro !== 0 ? 'Sim' : 'Não'; break;
          case 'Comentário': val = item.comentario || ''; break;
          default: val = item[col] || '';
        }
        
        // Formatting numbers for CSV (using comma or dot depending on delimiter)
        if (typeof val === 'number') {
          val = val.toFixed(2);
          if (config.delimiter === ';') val = val.replace('.', ',');
        }

        // Escape delimiter and newlines
        const strVal = String(val ?? '').replace(new RegExp(config.delimiter, 'g'), ' ').replace(/\n/g, ' ');
        return strVal;
      });
      csvRows.push(row.join(config.delimiter));
    });

    setExportProgress(prev => ({ ...prev, progress: 80, status: 'Gerando arquivo CSV...' }));
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Carga_SAP_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportProgress(prev => ({ ...prev, progress: 95, status: 'Concluído!' }));
    setIsSAPExportModalOpen(false);
    addToast('Arquivo de carga SAP gerado com sucesso!', 'success');
    setTimeout(() => setExportProgress({ active: false, progress: 0, status: '' }), 500);
    }, 100);
  }, [resultado, allFilteredItems, selectedItems, addToast]);

  const toggleSelectItem = React.useCallback((id: number | string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkSave = (updates: any) => {
    bulkUpdateDivergencias(Array.from(selectedItems), updates);
    setSelectedItems(new Set());
    addToast(`${selectedItems.size} itens atualizados com sucesso!`, 'success');
  };

  if (!resultado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className={`p-6 rounded-full mb-6 ${darkMode ? 'bg-slate-900 text-slate-700' : 'bg-gray-100 text-gray-300'}`}>
          <TableIcon className="w-16 h-16" />
        </div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Nenhum dado disponível</h2>
        <p className={`mt-2 max-w-md ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
          Inicie uma nova auditoria na página de Upload para visualizar os detalhes aqui.
        </p>
        <Link 
          to="/" 
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-[#8DC63F] text-white rounded-xl font-bold hover:bg-[#78AF32] transition-all"
        >
          Ir para Upload <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  const isAllSelected = selectableItems.length > 0 && selectableItems.every(d => selectedItems.has(d.id));
  const isAllExpanded = selectableItems.length > 0 && selectableItems.every(d => expandedRows.has(d.id));

  const toggleSelectAll = () => {
    const pageIds = selectableItems.map(d => d.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedItems.has(id));

    if (allSelected) {
      setSelectedItems(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedItems(prev => {
        const next = new Set(prev);
        pageIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const selectAllFiltered = () => {
    const allIds = allFilteredItems.filter(d => 'id' in d).map(d => d.id);
    setSelectedItems(new Set(allIds));
    addToast(`Todos os ${allIds.length} itens filtrados foram selecionados.`, 'info');
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    addToast('Seleção limpa.', 'info');
  };

  const toggleAllRows = () => {
    const allIds = selectableItems.map(d => d.id);
    const allExpanded = allIds.every(id => expandedRows.has(id));
    
    if (allExpanded) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setExpandedRows(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-30 rotate-90" />;
    return sortConfig.direction === 'asc' ? <ChevronRight className="w-2.5 h-2.5 -rotate-90 text-brand-green" /> : <ChevronRight className="w-2.5 h-2.5 rotate-90 text-brand-green" />;
  };

  const SortableHeader = ({ label, columnKey, width, align = 'left', tooltip }: { label: string; columnKey: string; width: string; align?: 'left' | 'right' | 'center'; tooltip?: string }) => (
    <div 
      className={`flex items-center ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''} px-2 shrink-0 ${width} h-full cursor-pointer hover:text-brand-green transition-colors group`}
      onClick={() => handleSort(columnKey)}
    >
      <Tooltip content={tooltip || `Ordenar por ${label}`} darkMode={darkMode}>
        <div className="flex items-center gap-1">
          {label}
          <SortIcon columnKey={columnKey} />
        </div>
      </Tooltip>
    </div>
  );

  const VirtuosoComponents = useMemo(() => ({
    Table: (props: any) => <div {...props} className="min-w-[3300px] flex flex-col" />,
    TableBody: (props: any) => <div {...props} className="flex flex-col" />,
    TableRow: (props: any) => <div {...props} />
  }), []);

  const VirtuosoHeader = useCallback(() => (
    <div className={`flex items-center text-[10px] uppercase tracking-wider font-black border-b sticky top-0 z-30 h-12 transition-colors duration-500 ${selectedItems.size > 0 ? (darkMode ? 'bg-brand-green/10 border-brand-green/30' : 'bg-brand-green/5 border-brand-green/20') : (darkMode ? 'bg-slate-800 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm')} ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
      <div className={`flex items-center justify-center shrink-0 w-10 h-full sticky left-0 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] transition-colors duration-500 ${selectedItems.size > 0 ? (darkMode ? 'bg-slate-800' : 'bg-brand-light') : (darkMode ? 'bg-slate-800' : 'bg-slate-50')}`}>
        <Tooltip content={isAllSelected ? "Desmarcar todos" : "Selecionar itens visíveis"} darkMode={darkMode}>
          <input 
            type="checkbox" 
            checked={isAllSelected}
            onChange={toggleSelectAll}
            className="w-3.5 h-3.5 rounded border-gray-300 text-brand-green focus:ring-brand-green cursor-pointer"
          />
        </Tooltip>
        {selectedItems.size > 0 && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-green rounded-full border-2 border-white dark:border-slate-800 animate-pulse" />
        )}
      </div>
      <div className={`flex items-center justify-center shrink-0 w-80 h-full sticky left-10 z-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <div className="flex items-center justify-center gap-2">
          <Tooltip content={isAllExpanded ? "Recolher Todos" : "Expandir Todos"} darkMode={darkMode}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAllRows();
              }}
              className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
            >
              <div className={`transition-transform duration-200 ${isAllExpanded ? 'rotate-90' : ''}`}>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          </Tooltip>
          Material / Descrição
        </div>
      </div>
      <SortableHeader label="CFOP" columnKey="cfop" width="w-24" />
      <SortableHeader label="Fornecedor" columnKey="fornecedor" width="w-64" />
      {showColunas.empresa && <SortableHeader label="Empresa" columnKey="empresa" width="w-48" />}
      {showColunas.numeroNF && <SortableHeader label="Número NF" columnKey="numeroNF" width="w-32" />}
      {showColunas.tipoMaterial && <SortableHeader label="Tipo Material" columnKey="tipoMaterial" width="w-40" />}
      {showColunas.categoriaNF && <SortableHeader label="Categoria NF" columnKey="categoriaNF" width="w-40" />}
      {showColunas.origemMaterial && <SortableHeader label="Origem Material" columnKey="origemMaterial" width="w-40" />}
      {showColunas.dataLancamento && <SortableHeader label="Data Lançamento" columnKey="dataLancamento" width="w-32" />}
      {showColunas.precoSemFrete && <SortableHeader label="Preço Unit. s/ Frete" columnKey="precoSemFrete" width="w-32" align="right" />}
      {showColunas.precoComFrete && <SortableHeader label="Preço Unit. c/ Frete" columnKey="precoComFrete" width="w-32" align="right" />}
      {showColunas.valorLiqSemFrete && <SortableHeader label="V. Liq s/ Frete" columnKey="valorLiqSemFrete" width="w-32" align="right" />}
      {showColunas.valorLiqComFrete && <SortableHeader label="V. Liq c/ Frete" columnKey="valorLiqComFrete" width="w-32" align="right" />}
      {showColunas.valorTotalSemFrete && <SortableHeader label="Total s/ Frete" columnKey="valorTotalSemFrete" width="w-32" align="right" />}
      {showColunas.valorTotalComFrete && <SortableHeader label="Total c/ Frete" columnKey="valorTotalComFrete" width="w-32" align="right" />}
      <SortableHeader label={isGrouped ? "Σ Qtde." : "K - Qtde."} columnKey="quantidade" width="w-24" align="right" tooltip={isGrouped ? "Soma das quantidades agrupadas" : "Quantidade total"} />
      <SortableHeader label={isGrouped ? "Preço Médio Ent." : "Taxa de Câmbio"} columnKey="precoEfetivo" width="w-32" align="right" tooltip={isGrouped ? "Preço médio efetivo de entrada" : "Preço unitário de entrada"} />
      <SortableHeader label={isGrouped ? "Σ Vlr. Real CKM3" : "L - Vlr. Real CKM3"} columnKey="custoPadrao" width="w-32" align="right" tooltip={isGrouped ? "Soma do valor real do CKM3" : "Custo padrão unitário SAP"} />
      <SortableHeader label="Variação" columnKey="variacaoPerc" width="w-32" align="right" />
      {showFinancialImpact && <SortableHeader label={isGrouped ? "Σ Impacto" : "Impacto"} columnKey="impactoFinanceiro" width="w-32" align="right" tooltip={isGrouped ? "Soma do impacto financeiro" : "Impacto financeiro individual"} />}
      <div className="flex items-center justify-center px-2 shrink-0 w-24 h-full text-center">Notas</div>
      <SortableHeader label="Status" columnKey="status" width="w-24" align="center" />
      <SortableHeader label="Tipo" columnKey="tipo" width="w-24" align="center" />
    </div>
  ), [darkMode, isAllSelected, toggleSelectAll, isAllExpanded, toggleAllRows, showColunas, SortableHeader]);


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
            Detalhes da Auditoria
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Explore os dados detalhados por divergência, CFOP ou fornecedor.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type="text" 
              placeholder="Buscar material, fornecedor..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={`pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all focus:ring-2 outline-none border w-full sm:w-64 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:ring-[#8DC63F]/50' : 'bg-slate-50 border-slate-200 focus:bg-white focus:ring-[#8DC63F]/30 text-slate-700'}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Tooltip content="Exportar dados para Excel" darkMode={darkMode}>
                <button 
                  onClick={() => handleExportExcel(QUICK_EXPORT_COLUMNS)}
                  disabled={exportProgress.active}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${exportProgress.active ? 'opacity-50 cursor-not-allowed' : (darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700' : 'bg-white border border-slate-200 text-[#78AF32] hover:bg-slate-50 hover:border-slate-300 shadow-sm')}`}
                >
                  {exportProgress.active && exportProgress.status.includes('Excel') ? (
                    <div className="w-4 h-4 border-2 border-[#8DC63F]/30 border-t-[#8DC63F] rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Excel
                </button>
              </Tooltip>
              <div className="absolute top-full right-0 mt-1 hidden group-hover:block z-30">
                <div className={`p-1 rounded-xl border shadow-xl min-w-[200px] ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <button 
                    onClick={() => handleExportExcel(QUICK_EXPORT_COLUMNS)}
                    className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-100 text-gray-600'}`}
                  >
                    <FileSpreadsheet className="w-3 h-3" /> Exportação Rápida
                  </button>
                  <button 
                    onClick={() => setIsExportModalOpen(true)}
                    className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-[#8DC63F]' : 'hover:bg-gray-100 text-[#78AF32]'}`}
                  >
                    <Settings className="w-3 h-3" /> Personalizada...
                  </button>
                  <div className={`h-px my-1 ${darkMode ? 'bg-slate-700' : 'bg-gray-100'}`} />
                  <button 
                    onClick={handleExportActionPlan}
                    className={`w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 ${darkMode ? 'hover:bg-slate-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'}`}
                  >
                    <FileDown className="w-3 h-3" /> Plano de Ação
                  </button>
                </div>
              </div>
            </div>
            <Tooltip content="Exportar relatório gerencial para PDF" darkMode={darkMode}>
              <button 
                onClick={() => handleExportPDF()}
                disabled={exportProgress.active}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${exportProgress.active ? 'opacity-50 cursor-not-allowed' : (darkMode ? 'bg-slate-800 text-red-400 hover:bg-slate-700' : 'bg-gray-100 text-red-600 hover:bg-gray-200')}`}
              >
                {exportProgress.active && exportProgress.status.includes('PDF') ? (
                  <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                PDF
              </button>
            </Tooltip>
            <Tooltip content="Gerar arquivo de carga para o SAP" darkMode={darkMode}>
              <button 
                onClick={() => setIsSAPExportModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'bg-slate-800 text-blue-400 hover:bg-slate-700' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'}`}
              >
                <Cpu className="w-4 h-4" /> SAP
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      {/* Quick Summary Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Resumo Executivo</h2>
          <Tooltip content="Entenda como os impactos financeiros são calculados" darkMode={darkMode} position="left">
            <button 
              onClick={() => setShowMethodology(!showMethodology)}
              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'text-slate-500 hover:text-[#8DC63F]' : 'text-slate-400 hover:text-[#78AF32]'}`}
            >
              <HelpIcon className="w-3.5 h-3.5" />
              Metodologia de Cálculo
            </button>
          </Tooltip>
        </div>

        <AnimatePresence>
          {showMethodology && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`p-6 rounded-[2rem] border mb-4 ${darkMode ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-blue-50/50 border-blue-100 text-slate-600'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                    <Cpu className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black uppercase tracking-widest mb-2">Metodologia de Cálculo do Impacto</h4>
                    <p className="text-xs leading-relaxed mb-4 opacity-80">
                      O impacto financeiro é calculado comparando o custo real da Nota Fiscal com o custo padrão registrado no SAP (CKM3). 
                      Isso permite identificar variações orçamentárias precisas.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-950/50' : 'bg-white/80'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-blue-500">Fórmula Aplicada</p>
                        <div className="font-mono text-lg font-black tracking-tighter">
                          BI = (C × Q) - S
                        </div>
                        <div className="mt-3 space-y-1 text-[10px] font-bold opacity-70">
                          <p><span className="text-blue-500">BI:</span> Impacto Orçamentário Líquido</p>
                          <p><span className="text-blue-500">C:</span> Custo Unitário Efetivo (NF)</p>
                          <p><span className="text-blue-500">Q:</span> Quantidade de Itens</p>
                          <p><span className="text-blue-500">S:</span> Custo Padrão Total (SAP × Q)</p>
                        </div>
                      </div>
                      <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-950/50' : 'bg-white/80'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-emerald-500">Exemplo Prático</p>
                        <p className="text-[10px] leading-relaxed italic opacity-80">
                          "Se compramos 100 itens a R$ 50 (C=50, Q=100) e o custo esperado no SAP era R$ 5.000 (S=5000), 
                          o impacto financeiro será neutro (R$ 0,00), pois o custo real igualou a economia esperada."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Acima do Custo Padrão</p>
          <p className="text-2xl font-black text-red-500">{formatoMoeda.format(totals.prejuizo)}</p>
        </div>
        <div className={`p-5 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Abaixo dos Custo Padrão</p>
          <p className="text-2xl font-black text-[#8DC63F]">{formatoMoeda.format(totals.economia)}</p>
        </div>
        <div className={`p-5 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Impacto Líquido</p>
          <p className="text-2xl font-black flex items-center gap-2">
            <span className={totals.prejuizo - totals.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}>
              {formatoMoeda.format(totals.prejuizo - totals.economia)}
            </span>
            {totals.prejuizo - totals.economia > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <TrendingUp className="w-5 h-5 text-[#8DC63F] rotate-180" />
            )}
          </p>
        </div>
      </div>
    </div>

      {/* Filters Bar */}
      <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/50'} ${isFilterExpanded ? 'ring-1 ring-[#8DC63F]/20' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Tooltip content="Painel de filtros para refinar a auditoria" darkMode={darkMode} position="right">
              <div className={`p-4 rounded-2xl transition-all ${darkMode ? 'bg-slate-800' : 'bg-slate-50'} ${hasActiveFilters ? 'ring-2 ring-[#8DC63F]/30 scale-110' : ''}`}>
                <Filter className={`w-6 h-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`} />
              </div>
            </Tooltip>
            <div>
              <h3 className={`text-base font-black uppercase tracking-widest ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>Painel de Controle de Filtros</h3>
              <div className="flex items-center gap-3 mt-1">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${hasActiveFilters ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]') : (darkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}>
                  {hasActiveFilters ? (
                    <>
                      <span className="flex h-2 w-2 rounded-full bg-[#8DC63F] animate-pulse"></span>
                      Filtros Ativos
                    </>
                  ) : "Nenhum Filtro"}
                </div>
                <span className={`text-[11px] font-bold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {filteredCount} de {resultado?.todosOsItens?.length || 0} itens visíveis
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {hasActiveFilters && (
              <Tooltip content="Remover todos os filtros aplicados" darkMode={darkMode}>
                <button 
                  onClick={() => { 
                    setFilterCfop(filterCfopDefault); 
                    setFilterSupplier(filterSupplierDefault); 
                    setFilterTipo(filterTipoDefault as any);
                    setFilterImpactoMin(filterImpactoMinDefault);
                    setFilterDataInicio(dataInicioContext);
                    setFilterDataFim(dataFimContext);
                    setFilterTipoMaterial([]);
                    setFilterCategoriaNF([]);
                    setFilterOrigemMaterial([]);
                    setFilterEmpresa([]);
                    setLocalSearch(''); 
                    setShowAdvancedFilter(false);
                    setAdvancedFilterExpression('');
                    setShowColunas({
                      empresa: false,
                      numeroNF: false,
                      tipoMaterial: false,
                      categoriaNF: false,
                      origemMaterial: false,
                      dataLancamento: false,
                      precoSemFrete: false,
                      precoComFrete: false,
                      valorLiqSemFrete: false,
                      valorLiqComFrete: false,
                      valorTotalSemFrete: false,
                      valorTotalComFrete: false,
                    });
                    addToast('Filtros limpos!', 'info');
                  }}
                  className={`group flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'text-red-400 hover:bg-red-400/10' : 'text-red-600 hover:bg-red-50'}`}
                >
                  <X className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" /> Limpar Tudo
                </button>
              </Tooltip>
            )}
            <Tooltip content="Salvar filtros atuais como padrão" darkMode={darkMode}>
              <button 
                onClick={salvarFiltros}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'text-[#8DC63F] hover:bg-[#8DC63F]/10' : 'text-[#78AF32] hover:bg-[#8DC63F]/10'}`}
              >
                <CheckSquare className="w-3.5 h-3.5" /> Salvar Preset
              </button>
            </Tooltip>
            <div className={`w-px h-8 mx-1 ${darkMode ? 'bg-slate-800' : 'bg-gray-100'}`} />
            <Tooltip content={isFilterExpanded ? "Ocultar painel de filtros" : "Mostrar filtros avançados"} darkMode={darkMode}>
              <button 
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-sm ${darkMode ? 'bg-slate-800 text-slate-100 hover:bg-slate-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
              >
                {isFilterExpanded ? "Ocultar" : "Filtros Avançados"}
                <div className={`transition-transform duration-300 ${isFilterExpanded ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
            </Tooltip>
          </div>
        </div>

        <AnimatePresence>
          {isFilterExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-8 mt-8 border-t border-gray-100 dark:border-slate-800 space-y-10">
                
                {/* Quick Presets Row */}
                <div className="space-y-3">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>Atalhos Rápidos</label>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    <Tooltip content="Mostrar apenas itens com divergência" darkMode={darkMode}>
                      <button 
                        onClick={() => setFilterTipo('Divergências')}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${filterTipo === 'Divergências' ? 'bg-[#8DC63F] border-[#8DC63F] text-white shadow-lg shadow-[#8DC63F]/20' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}`}
                      >
                        Divergências
                      </button>
                    </Tooltip>
                    <Tooltip content="Filtrar por itens aguardando análise" darkMode={darkMode}>
                      <button 
                        onClick={() => setFilterStatus('Pendente')}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${filterStatus === 'Pendente' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}`}
                      >
                        Pendentes
                      </button>
                    </Tooltip>
                    <Tooltip content="Itens com impacto financeiro > R$ 5.000" darkMode={darkMode}>
                      <button 
                        onClick={() => setFilterImpactoMin(5000)}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${filterImpactoMin >= 5000 ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}`}
                      >
                        Alto Impacto
                      </button>
                    </Tooltip>
                    <Tooltip content="Itens com preço NF maior que custo SAP" darkMode={darkMode}>
                      <button 
                        onClick={() => setFilterTipo('acima do custo padrão')}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${filterTipo === 'acima do custo padrão' ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-600/20' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}`}
                      >
                        Acima do Custo
                      </button>
                    </Tooltip>
                    <Tooltip content="Itens com preço NF menor que custo SAP" darkMode={darkMode}>
                      <button 
                        onClick={() => setFilterTipo('abaixo do custo padrão')}
                        className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${filterTipo === 'abaixo do custo padrão' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300')}`}
                      >
                        Abaixo do Custo
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Main Filters Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Identification Group */}
                  <div className={`lg:col-span-5 space-y-5 p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50/30 border-slate-100'}`}>
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-2 h-5 bg-[#8DC63F] rounded-full shadow-lg shadow-[#8DC63F]/20" />
                      <h4 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Identificação e Origem</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>CFOP</label>
                        <select 
                          value={filterCfop}
                          onChange={(e) => { setFilterCfop(e.target.value); }}
                          className={`w-full px-4 py-3 rounded-2xl text-xs font-black outline-none border transition-all ${filterCfop ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-700 focus:border-[#8DC63F] shadow-sm'}`}
                        >
                          <option value="">Todos os CFOPs</option>
                          {uniqueCfops.map(cfop => (
                            <option key={cfop as string} value={cfop as string}>{cfop as string}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Fornecedor</label>
                        <select 
                          value={filterSupplier}
                          onChange={(e) => { setFilterSupplier(e.target.value); }}
                          className={`w-full px-4 py-3 rounded-2xl text-xs font-black outline-none border transition-all ${filterSupplier ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-700 focus:border-[#8DC63F] shadow-sm'}`}
                        >
                          <option value="">Todos os Fornecedores</option>
                          {uniqueSuppliers.map(supplier => (
                            <option key={supplier as string} value={supplier as string}>{supplier as string}</option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Empresa</label>
                        <MultiSelect 
                          label="Selecionar Empresas" 
                          options={uniqueEmpresa} 
                          selected={filterEmpresa} 
                          onChange={setFilterEmpresa} 
                          darkMode={darkMode} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Classification Group */}
                  <div className={`lg:col-span-4 space-y-5 p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50/30 border-slate-100'}`}>
                    <div className="flex items-center gap-3 px-1">
                      <div className="w-2 h-5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/20" />
                      <h4 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Classificação e Status</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Tipo de Item</label>
                        <select 
                          value={filterTipo}
                          onChange={(e) => { setFilterTipo(e.target.value as any); }}
                          className={`w-full px-4 py-3 rounded-2xl text-xs font-black outline-none border transition-all ${filterTipo !== 'Todos' ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-700 focus:border-[#8DC63F] shadow-sm'}`}
                        >
                          <option value="Todos">Todos os Itens</option>
                          <option value="Divergências">Apenas Divergências</option>
                          <option value="acima do custo padrão">Acima do Custo Padrão</option>
                          <option value="abaixo do custo padrão">Abaixo do Custo Padrão</option>
                          <option value="Não Encontrado no CKM3">Não Encontrado</option>
                          <option value="Sem Divergência">Sem Divergência</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Status</label>
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl text-xs font-black outline-none border transition-all ${filterStatus !== 'Todos' ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-700 focus:border-[#8DC63F] shadow-sm'}`}
                        >
                          <option value="Todos">Todos os Status</option>
                          <option value="Pendente">Pendente</option>
                          <option value="Em Análise">Em Análise</option>
                          <option value="Corrigido">Corrigido</option>
                          <option value="Ignorado">Ignorado</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Tipo Material</label>
                        <MultiSelect 
                          label="Selecionar Tipos" 
                          options={uniqueTipoMaterial} 
                          selected={filterTipoMaterial} 
                          onChange={setFilterTipoMaterial} 
                          darkMode={darkMode} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Values Group */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Valores e Datas</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Impacto Mínimo</label>
                        <div className="relative">
                          <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>R$</div>
                          <input 
                            type="number"
                            value={filterImpactoMin}
                            onChange={(e) => { setFilterImpactoMin(Number(e.target.value)); }}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-bold outline-none border transition-all ${filterImpactoMin > 0 ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-[#8DC63F]'}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Início do Período</label>
                        <input 
                          type="date"
                          value={filterDataInicio}
                          onChange={(e) => { setFilterDataInicio(e.target.value); }}
                          className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold outline-none border transition-all ${filterDataInicio ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-[#8DC63F]'}`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className={`text-[9px] font-bold uppercase tracking-wider ml-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Fim do Período</label>
                        <input 
                          type="date"
                          value={filterDataFim}
                          onChange={(e) => { setFilterDataFim(e.target.value); }}
                          className={`w-full px-4 py-2.5 rounded-2xl text-xs font-bold outline-none border transition-all ${filterDataFim ? 'border-[#8DC63F] ring-2 ring-[#8DC63F]/10' : ''} ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-gray-50 border-gray-200 text-gray-700 focus:border-[#8DC63F]'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Multi-Selects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Categorias de NF</h4>
                    </div>
                    <MultiSelect 
                      label="Selecionar Categorias" 
                      options={uniqueCategoriaNF} 
                      selected={filterCategoriaNF} 
                      onChange={setFilterCategoriaNF} 
                      darkMode={darkMode} 
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <div className="w-1.5 h-4 bg-orange-500 rounded-full" />
                      <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Origens de Material</h4>
                    </div>
                    <MultiSelect 
                      label="Selecionar Origens" 
                      options={uniqueOrigemMaterial} 
                      selected={filterOrigemMaterial} 
                      onChange={setFilterOrigemMaterial} 
                      darkMode={darkMode} 
                    />
                  </div>
                </div>

                {/* Column Visibility Section */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-slate-400 rounded-full" />
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Visibilidade de Colunas na Tabela</h4>
                  </div>
                  <div className={`p-6 rounded-3xl border flex flex-wrap gap-x-8 gap-y-4 ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-gray-50 border-gray-100'}`}>
                    {[
                      { id: 'empresa', label: 'Empresa' },
                      { id: 'numeroNF', label: 'Número NF' },
                      { id: 'tipoMaterial', label: 'Tipo Material' },
                      { id: 'categoriaNF', label: 'Categoria NF' },
                      { id: 'origemMaterial', label: 'Origem Material' },
                      { id: 'dataLancamento', label: 'Data Lançamento' },
                      { id: 'precoSemFrete', label: 'Preço s/ Frete' },
                      { id: 'precoComFrete', label: 'Preço c/ Frete' },
                      { id: 'valorLiqSemFrete', label: 'V. Liq s/ Frete' },
                      { id: 'valorLiqComFrete', label: 'V. Liq c/ Frete' },
                      { id: 'valorTotalSemFrete', label: 'Total s/ Frete' },
                      { id: 'valorTotalComFrete', label: 'Total c/ Frete' },
                    ].map(col => (
                      <label key={col.id} className="flex items-center gap-3 text-[10px] font-black uppercase cursor-pointer group">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={(showColunas as any)[col.id]} 
                            onChange={() => {
                              const newVal = !(showColunas as any)[col.id];
                              setShowColunas(prev => ({...prev, [col.id]: newVal}));
                              if (!newVal) {
                                if (col.id === 'empresa') setFilterEmpresa([]);
                                if (col.id === 'tipoMaterial') setFilterTipoMaterial([]);
                                if (col.id === 'categoriaNF') setFilterCategoriaNF([]);
                                if (col.id === 'origemMaterial') setFilterOrigemMaterial([]);
                              }
                            }} 
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${ (showColunas as any)[col.id] ? 'bg-[#8DC63F] border-[#8DC63F] shadow-lg shadow-[#8DC63F]/20' : (darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-white') }`}>
                            {(showColunas as any)[col.id] && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                          </div>
                        </div>
                        <span className={`transition-colors ${ (showColunas as any)[col.id] ? (darkMode ? 'text-slate-100' : 'text-gray-900') : (darkMode ? 'text-slate-500' : 'text-gray-400') } group-hover:text-[#8DC63F]`}>
                          {col.label}
                        </span>
                      </label>
                    ))}
                    <div className={`w-px h-6 mx-2 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    <label className="flex items-center gap-3 text-[10px] font-black uppercase cursor-pointer group text-[#8DC63F]">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          checked={showAdvancedFilter} 
                          onChange={() => setShowAdvancedFilter(!showAdvancedFilter)} 
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${ showAdvancedFilter ? 'bg-[#8DC63F] border-[#8DC63F] shadow-lg shadow-[#8DC63F]/20' : (darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-300 bg-white') }`}>
                          {showAdvancedFilter && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                        </div>
                      </div>
                      <span>Ativar Console Programático</span>
                    </label>

                    <div className={`w-px h-6 mx-2 ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`} />
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={exportFilters}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#8DC63F] hover:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-500 hover:text-[#78AF32] hover:border-[#8DC63F] shadow-sm'}`}
                        title="Exportar filtros para JSON"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Exportar JSON
                      </button>
                      
                      <label 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-[#8DC63F] hover:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-500 hover:text-[#78AF32] hover:border-[#8DC63F] shadow-sm'}`}
                        title="Importar filtros de JSON"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                        Importar JSON
                        <input 
                          type="file" 
                          accept=".json" 
                          onChange={importFilters} 
                          className="sr-only" 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {showAdvancedFilter && (
                  <div className="space-y-4 pt-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-[#8DC63F]" />
                        <label className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Console de Filtros Programático</label>
                      </div>
                      <div className="group relative">
                        <Tooltip content="Clique para ver o guia de operadores e exemplos" darkMode={darkMode} position="left">
                          <HelpCircle className={`w-4 h-4 cursor-help transition-colors ${darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600'}`} />
                        </Tooltip>
                        <div className={`absolute bottom-full right-0 mb-4 hidden group-hover:block w-80 p-5 rounded-3xl border shadow-2xl z-50 text-[11px] leading-relaxed animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-slate-700">
                            <Code className="w-4 h-4 text-[#8DC63F]" />
                            <span className="font-black uppercase tracking-widest">Guia do Desenvolvedor</span>
                          </div>
                          <p className="font-bold mb-2 text-[#8DC63F]">Operadores Suportados:</p>
                          <div className="grid grid-cols-4 gap-1 font-mono text-[9px] bg-black/10 dark:bg-black/20 p-2 rounded-xl mb-3">
                            <span className="text-center">==</span>
                            <span className="text-center">!=</span>
                            <span className="text-center">&gt;</span>
                            <span className="text-center">&lt;</span>
                            <span className="text-center">&gt;=</span>
                            <span className="text-center">&lt;=</span>
                            <span className="text-center">===</span>
                            <span className="text-center">!==</span>
                          </div>
                          <p className="font-bold mb-1 text-[#8DC63F]">Exemplo Prático:</p>
                          <p className="font-mono bg-black/10 dark:bg-black/20 p-2 rounded-xl italic text-[10px]">impactoFinanceiro &gt; 5000 &amp;&amp; status == 'Pendente'</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`flex flex-col rounded-3xl border transition-all shadow-2xl overflow-hidden relative ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-900 border-gray-800'}`}>
                      <div className={`flex items-center px-4 py-2.5 border-b text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                        <div className="flex gap-1.5 mr-4">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                        </div>
                        <span className="flex-1">audit_filter_editor.sh</span>
                        <button 
                          onClick={() => setIsTerminalExpanded(!isTerminalExpanded)}
                          className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${darkMode ? 'text-slate-500 hover:text-[#8DC63F]' : 'text-gray-400 hover:text-[#8DC63F]'}`}
                        >
                          {isTerminalExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      
                      {renderQuickExamples()}
                      
                      {suggestions.length > 0 && (
                        <div 
                          className={`absolute rounded-xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                          style={{ 
                            top: `${suggestionCoords.top}px`, 
                            left: `${suggestionCoords.left}px` 
                          }}
                        >
                          <div className="max-h-64 overflow-y-auto">
                            {suggestions.map((s, i) => (
                              <div 
                                key={s.name}
                                onClick={() => applySuggestion(s)}
                                onMouseEnter={() => setSuggestionIndex(i)}
                                className={`px-3 py-2 text-xs font-mono cursor-pointer flex items-center gap-3 transition-colors ${i === suggestionIndex ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]') : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-50')}`}
                              >
                                <div className={`p-1 rounded ${i === suggestionIndex ? (darkMode ? 'bg-[#8DC63F]/20' : 'bg-[#8DC63F]/10') : (darkMode ? 'bg-slate-800' : 'bg-gray-100')}`}>
                                  {s.icon}
                                </div>
                                <div className="flex-1 flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span className="font-bold">{s.name}</span>
                                    <span className={`text-[8px] uppercase tracking-tighter opacity-50 ${s.type === 'func' ? 'text-blue-400' : 'text-amber-400'}`}>
                                      {s.type === 'func' ? 'Função' : 'Campo'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea 
                        placeholder="Ex: impactoFinanceiro > 1000&#10;cfop == '5102'&#10;fornecedor.includes('NATULAB')"
                        value={advancedFilterExpression}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        onKeyUp={(e) => handleTextareaChange(e as any)}
                        onClick={(e) => handleTextareaChange(e as any)}
                        onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                        rows={isTerminalExpanded ? 12 : 3}
                        className={`w-full px-4 py-3 text-xs font-mono outline-none bg-transparent resize-none transition-all duration-300 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}
                      />
                      
                      {advancedFilterError && (
                        <div className={`px-4 py-2 text-[10px] font-mono border-t animate-in slide-in-from-bottom-1 duration-200 ${darkMode ? 'bg-red-900/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                          <div className="flex items-center gap-2">
                            <X className="w-3 h-3" />
                            <span className="font-bold uppercase">Erro de Sintaxe:</span>
                            <span>{advancedFilterError}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && !isFilterExpanded && (
        <div className="flex flex-wrap gap-2 px-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {filterCfop && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              CFOP: {filterCfop}
              <button onClick={() => setFilterCfop('')} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filterSupplier && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              Fornecedor: {filterSupplier}
              <button onClick={() => setFilterSupplier('')} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filterTipo !== 'Todos' && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              Tipo: {filterTipo}
              <button onClick={() => setFilterTipo('Todos' as any)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filterStatus !== 'Todos' && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              Status: {filterStatus}
              <button onClick={() => setFilterStatus('Todos')} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filterImpactoMin > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              Min: R$ {filterImpactoMin}
              <button onClick={() => setFilterImpactoMin(0)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
          {filterTipoMaterial.length > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              Materiais: {filterTipoMaterial.length}
              <button onClick={() => setFilterTipoMaterial([])} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
          {showAdvancedFilter && advancedFilterExpression && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${darkMode ? 'bg-[#8DC63F]/10 border-[#8DC63F]/30 text-[#8DC63F]' : 'bg-[#8DC63F]/5 border-[#8DC63F]/20 text-[#78AF32]'}`}>
              Filtro Avançado Ativo
              <button onClick={() => { setShowAdvancedFilter(false); setAdvancedFilterExpression(''); }} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div 
        className={`flex gap-2 p-1.5 rounded-2xl border w-fit overflow-x-auto max-w-full scrollbar-hide backdrop-blur-md transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/80 border-slate-200/60 shadow-inner'}`}
        ref={dragScrollTabs.ref}
        onMouseDown={dragScrollTabs.onMouseDown}
        onMouseLeave={dragScrollTabs.onMouseLeave}
        onMouseUp={dragScrollTabs.onMouseUp}
        onMouseMove={dragScrollTabs.onMouseMove}
        style={dragScrollTabs.style}
      >
        {[
          { id: 'divergencias', label: 'Itens Auditados', icon: <TableIcon className="w-4 h-4" /> },
          { id: 'pivot', label: 'Resumo Dinâmico', icon: <Layout className="w-4 h-4" /> },
          { id: 'cfop', label: 'Resumo CFOP', icon: <Hash className="w-4 h-4" /> },
          { id: 'fornecedores', label: 'Fornecedores', icon: <Users className="w-4 h-4" /> },
          { id: 'top5', label: 'Materiais', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'reverse', label: 'Auditoria Reversa', icon: <FileJson className="w-4 h-4" /> },
          { id: 'comentarios', label: 'Comentários', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'warnings', label: 'Alertas', icon: (
            <div className="relative">
              <AlertCircle className="w-4 h-4" />
              {warnings && warnings.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
          )},
          { id: 'config', label: 'Configurações', icon: <Settings className="w-4 h-4" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? (darkMode ? 'bg-[#8DC63F] text-slate-900 shadow-lg shadow-[#8DC63F]/20' : 'bg-white text-[#78AF32] shadow-sm shadow-slate-200 border border-slate-100') : (darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        {activeTab === 'reverse' && (
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-orange-500/10 rounded-2xl">
                <FileJson className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Auditoria Reversa (Notas Não Lançadas)</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  Identificamos notas fiscais presentes nos arquivos enviados que não possuem nenhum item correspondente no CKM3.
                </p>
              </div>
            </div>

            {resultado?.notasNaoLancadas && resultado.notasNaoLancadas.length > 0 ? (
              <div className="grid gap-6">
                {resultado.notasNaoLancadas.map((nota: any) => (
                  <div 
                    key={nota.id}
                    className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'} transition-all hover:shadow-lg`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-white shadow-sm'}`}>
                          <FileText className="w-5 h-5 text-brand-green" />
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Número da NF</div>
                          <div className="text-lg font-black">{nota.numeroNF}</div>
                        </div>
                      </div>
                      
                      {/* Deadline Indicators */}
                      <div className="flex items-center gap-3">
                        {(() => {
                          const nfDate = nota.data ? new Date(nota.data) : new Date();
                          const now = new Date();
                          const diffHours = (now.getTime() - nfDate.getTime()) / (1000 * 60 * 60);
                          const remainingManifest = Math.max(0, 72 - diffHours);
                          const remainingEscritura = Math.max(0, 720 - diffHours); // 30 days

                          return (
                            <>
                              <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center ${remainingManifest < 12 ? 'bg-red-500/10 border-red-500/30 text-red-500' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500')}`}>
                                <span className="text-[8px] font-black uppercase tracking-tighter">Manifestação</span>
                                <span className="text-xs font-black">{remainingManifest.toFixed(0)}h</span>
                              </div>
                              <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center ${remainingEscritura < 48 ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-gray-200 text-gray-500')}`}>
                                <span className="text-[8px] font-black uppercase tracking-tighter">Escrituração</span>
                                <span className="text-xs font-black">{Math.ceil(remainingEscritura / 24)}d</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      <div className="flex flex-wrap gap-6">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fornecedor</div>
                          <div className="text-sm font-bold truncate max-w-[200px]">{nota.fornecedor}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data</div>
                          <div className="text-sm font-bold">{nota.data ? new Date(nota.data).toLocaleDateString('pt-BR') : 'N/A'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Total</div>
                          <div className="text-sm font-black text-brand-green">{formatoMoeda.format(nota.valorTotal)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => addToast(`Manifestação da NF ${nota.numeroNF} enviada com sucesso!`, 'success')}
                            className="px-4 py-2 bg-brand-green text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
                          >
                            Manifestar
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Itens da Nota (Pendentes de Lançamento)</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {nota.itens.map((item: any, idx: number) => (
                          <div key={idx} className={`p-3 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200'} flex items-center justify-between gap-3`}>
                            <div className="overflow-hidden">
                              <div className="text-[9px] font-mono text-brand-green">{item.material}</div>
                              <div className="text-[10px] font-bold truncate" title={item.descricao}>{item.descricao}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[9px] font-bold text-slate-500">{item.quantidade} UN</div>
                              <div className="text-[10px] font-black">{formatoMoeda.format(item.preco)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center p-20 rounded-3xl border-2 border-dashed ${darkMode ? 'bg-slate-800/20 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <CheckCircle2 className="w-16 h-16 text-brand-green mb-4 opacity-20" />
                <h4 className={`text-lg font-bold ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Tudo em dia!</h4>
                <p className={`text-sm text-center max-w-md ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                  Não encontramos nenhuma nota fiscal pendente de lançamento no SAP para os materiais auditados.
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'comentarios' && (
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-2xl">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Histórico de Comentários</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  Visualize e gerencie todas as notas e planos de ação registrados.
                </p>
              </div>
            </div>

            {(allFilteredItems || []).filter(d => d.comentarios || d.status !== 'Pendente').length > 0 ? (
              <div className="grid gap-4">
                {(allFilteredItems || [])
                  .filter(d => d.comentarios || d.status !== 'Pendente')
                  .map((d, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={d.id}
                      className={`flex flex-col gap-4 p-6 rounded-2xl border ${
                        darkMode 
                          ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                          : 'bg-white border-gray-200 hover:shadow-md'
                      } transition-all group`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                            <MessageSquare className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                              {d.descricao}
                            </h4>
                            <p className={`text-[10px] uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                              NF: {d.numeroNF} | Fornecedor: {d.fornecedor}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            d.status === 'Corrigido' ? 'bg-[#8DC63F]/10 text-[#8DC63F]' :
                            d.status === 'Em Análise' ? 'bg-blue-500/10 text-blue-500' :
                            d.status === 'Ignorado' ? 'bg-gray-500/10 text-gray-500' :
                            'bg-amber-500/10 text-amber-500'
                          }`}>
                            {d.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            d.impactoFinanceiro > 0 ? 'bg-red-500/10 text-red-500' : 'bg-[#8DC63F]/10 text-[#8DC63F]'
                          }`}>
                            {formatoMoeda.format(Math.abs(d.impactoFinanceiro))}
                          </span>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                        <p className={`text-sm italic ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {d.comentarios || "Nenhum comentário registrado."}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => {
                            setActiveTab('divergencias');
                            setLocalSearch(d.descricao);
                          }}
                          className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-colors ${
                            darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </motion.div>
                  ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                  <MessageSquare className={`w-10 h-10 ${darkMode ? 'text-slate-700' : 'text-gray-200'}`} />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Nenhum comentário</h4>
                <p className={`text-sm text-center max-w-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  Você ainda não registrou nenhum comentário ou plano de ação nesta auditoria.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'warnings' && (
          <div className="p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-500/10 rounded-2xl">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Alertas e Avisos do Sistema</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  Mensagens geradas automaticamente durante o processamento da auditoria.
                </p>
              </div>
            </div>

            {warnings && warnings.length > 0 ? (
              <div className="grid gap-4">
                {warnings.map((warning, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx}
                    className={`flex items-start gap-4 p-5 rounded-2xl border ${
                      darkMode 
                        ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' 
                        : 'bg-white border-gray-200 hover:shadow-md'
                    } transition-all group`}
                  >
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                          Alerta #{idx + 1}
                        </span>
                        <span className={`text-[10px] font-medium ${darkMode ? 'text-slate-600' : 'text-gray-300'}`}>
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        {warning}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed ${darkMode ? 'border-slate-800 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                  <CheckCircle2 className="w-10 h-10 text-[#8DC63F]" />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Nenhum alerta detectado</h4>
                <p className={`text-sm text-center max-w-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                  O processamento foi concluído sem avisos ou inconsistências críticas identificadas.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-[#8DC63F]/10 rounded-2xl">
                <Settings className="w-6 h-6 text-[#8DC63F]" />
              </div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Configurações Avançadas</h3>
                <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Gerencie filtros complexos e comportamentos do sistema.</p>
              </div>
            </div>

            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-[#8DC63F]" />
                  <h4 className={`font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Console de Filtros Global</h4>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                     onClick={() => setAdvancedFilterExpression('')}
                     className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-slate-700 text-slate-400 hover:text-red-400' : 'bg-white text-gray-400 hover:text-red-600 border border-gray-200'}`}
                   >
                     Limpar Console
                   </button>
                </div>
              </div>
              
              <p className={`text-xs mb-4 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                O console abaixo permite aplicar filtros programáticos em toda a base de dados. 
                As condições inseridas aqui são aplicadas em tempo real em todas as visualizações.
              </p>

              <div className={`flex flex-col rounded-xl border transition-all shadow-inner overflow-hidden relative ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center px-3 py-1 border-b text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                  <Terminal className="w-3 h-3 mr-2" />
                  <span className="flex-1">Editor de Filtros</span>
                </div>
                
                {renderQuickExamples()}
                
                {suggestions.length > 0 && (
                  <div 
                    className={`absolute rounded-xl border shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[200px] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
                    style={{ 
                      top: `${suggestionCoords.top}px`, 
                      left: `${suggestionCoords.left}px` 
                    }}
                  >
                    <div className="max-h-64 overflow-y-auto">
                      {suggestions.map((s, i) => (
                        <div 
                          key={s.name}
                          onClick={() => applySuggestion(s)}
                          onMouseEnter={() => setSuggestionIndex(i)}
                          className={`px-3 py-2 text-xs font-mono cursor-pointer flex items-center gap-3 transition-colors ${i === suggestionIndex ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]') : (darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-50')}`}
                        >
                          <div className={`p-1 rounded ${i === suggestionIndex ? (darkMode ? 'bg-[#8DC63F]/20' : 'bg-[#8DC63F]/10') : (darkMode ? 'bg-slate-800' : 'bg-gray-100')}`}>
                            {s.icon}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-bold">{s.name}</span>
                              <span className={`text-[8px] uppercase tracking-tighter opacity-50 ${s.type === 'func' ? 'text-blue-400' : 'text-amber-400'}`}>
                                {s.type === 'func' ? 'Função' : 'Campo'}
                              </span>
                            </div>
                            {i === suggestionIndex && (
                              <span className="text-[9px] opacity-50 font-bold uppercase tracking-tighter bg-black/10 dark:bg-white/10 px-1 rounded">Tab</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea 
                  placeholder="Digite suas condições aqui..."
                  value={advancedFilterExpression}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  onKeyUp={(e) => handleTextareaChange(e as any)}
                  onClick={(e) => handleTextareaChange(e as any)}
                  onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                  rows={15}
                  className={`w-full px-4 py-3 text-xs font-mono outline-none bg-transparent resize-none transition-all duration-300 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}
                />

                {advancedFilterError && (
                  <div className={`px-4 py-2 text-[10px] font-mono border-t animate-in slide-in-from-bottom-1 duration-200 ${darkMode ? 'bg-red-900/20 border-red-900/30 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                    <div className="flex items-center gap-2">
                      <X className="w-3 h-3" />
                      <span className="font-bold uppercase">Erro de Sintaxe:</span>
                      <span>{advancedFilterError}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${advancedFilterExpression ? 'bg-[#8DC63F] animate-pulse' : 'bg-gray-400'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${advancedFilterExpression ? 'text-[#8DC63F]' : 'text-gray-400'}`}>
                    {advancedFilterExpression ? 'Filtro Ativo e Sincronizado' : 'Aguardando Expressão'}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    addToast('Filtro global atualizado!', 'success');
                    setActiveTab('divergencias');
                  }}
                  className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${darkMode ? 'bg-[#8DC63F] text-slate-900 hover:bg-[#78AF32]' : 'bg-[#8DC63F] text-white hover:bg-[#78AF32]'}`}
                >
                  <ArrowRight className="w-3 h-3" />
                  Ver Resultados
                </button>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-100'}`}>
                  <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Dica de Uso</h5>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Você pode usar funções como <span className="text-[#8DC63F] font-mono">YEAR(data) == 2024</span> para filtrar por ano, 
                    ou <span className="text-[#8DC63F] font-mono">impactoFinanceiro &gt; 1000</span> para focar em grandes divergências.
                  </p>
                </div>
                <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-100'}`}>
                  <h5 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Status do Filtro</h5>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${advancedFilterExpression ? 'bg-[#8DC63F] animate-pulse' : 'bg-gray-400'}`} />
                    <span className={`text-xs font-bold ${advancedFilterExpression ? 'text-[#8DC63F]' : 'text-gray-400'}`}>
                      {advancedFilterExpression ? 'Filtro Ativo' : 'Nenhum filtro aplicado'}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-600' : 'text-gray-400'}`}>
                    {advancedFilterExpression ? `${advancedFilterExpression.split('\n').filter(l => l.trim()).length} condições detectadas.` : 'O console está vazio.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'divergencias' || activeTab === 'todos' || activeTab === 'cfop' || activeTab === 'fornecedores' || activeTab === 'top5') && (
          <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ${darkMode ? 'border-slate-800 bg-slate-900/30' : 'border-gray-100 bg-white/50'}`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${darkMode ? 'bg-slate-800/50 border-slate-700 shadow-inner' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <ListChecks className={`w-3.5 h-3.5 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`} />
                  <p className={`text-[11px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Total de Itens: <span className="text-[#8DC63F] ml-1">{currentCount}</span>
                  </p>
                </div>
                
                {selectedItems.size > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border animate-in zoom-in duration-300 ${darkMode ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' : 'bg-brand-green/5 border-brand-green/20 text-[#78AF32]'}`}>
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      {selectedItems.size} selecionados
                    </span>
                  </div>
                )}
              </div>

              {(activeTab === 'divergencias' || activeTab === 'todos') && (
                <div className="flex items-center gap-4 ml-4 h-8 pl-6 border-l border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsGrouped(!isGrouped)}>
                    <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isGrouped ? 'text-[#8DC63F]' : (darkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-gray-400 group-hover:text-gray-600')}`}>
                      Agrupar por Material
                    </p>
                    <button 
                      className={`relative inline-flex h-5 w-10 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none shadow-inner ${isGrouped ? 'bg-[#8DC63F]' : (darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-200')}`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-all duration-300 ${isGrouped ? 'translate-x-5.5' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                  
                  {isGrouped && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#8DC63F]/10 border border-[#8DC63F]/20">
                      <div className="w-1 h-1 rounded-full bg-[#8DC63F] animate-pulse" />
                      <span className="text-[8px] font-black text-[#8DC63F] uppercase tracking-tighter">Otimizado</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
               <div className={`p-1 rounded-lg border flex items-center transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-gray-100 border-gray-200'}`}>
                  <button 
                    onClick={() => setItemsPerPage(25)}
                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${itemsPerPage === 25 ? (darkMode ? 'bg-slate-800 text-[#8DC63F] shadow-lg' : 'bg-white text-[#78AF32] shadow-sm') : (darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600')}`}
                  >
                    25 items
                  </button>
                  <button 
                    onClick={() => setItemsPerPage(100)}
                    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${itemsPerPage === 100 ? (darkMode ? 'bg-slate-800 text-[#8DC63F] shadow-lg' : 'bg-white text-[#78AF32] shadow-sm') : (darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-gray-400 hover:text-gray-600')}`}
                  >
                    100 items
                  </button>
               </div>
            </div>
          </div>
        )}

        {(activeTab === 'divergencias' || activeTab === 'todos') ? (
          <div className="relative flex-1 flex flex-col min-h-0">
            {/* Enhanced Bulk Action Bar */}
            {selectedItems.size > 0 && (
              <div className={`mt-4 px-6 py-3 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300 shadow-2xl z-50 ${darkMode ? 'bg-slate-800 border-brand-green/30 shadow-brand-green/5' : 'bg-white border-brand-green/20 shadow-brand-green/10'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${darkMode ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-green/10 text-brand-green'}`}>
                     <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>MODO DE SELEÇÃO ATIVA</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${darkMode ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-green/10 text-brand-green'}`}>
                        {selectedItems.size} {selectedItems.size === 1 ? 'ITEM SELECIONADO' : 'ITENS SELECIONADOS'}
                      </span>
                    </div>
                    <p className={`text-[10px] font-medium ${darkMode ? 'text-slate-500' : 'text-gray-400 uppercase tracking-wider'}`}>
                      {selectedItems.size === allFilteredItems.length ? 'Todos os itens filtrados estão selecionados' : `Você pode editar todos estes ${selectedItems.size} itens de uma só vez.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedItems.size < allFilteredItems.length && (
                    <button 
                      onClick={selectAllFiltered}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      <ListChecks className="w-4 h-4" />
                      Selecionar Todos ({allFilteredItems.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setIsBulkEditModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-brand-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar em Massa
                  </button>
                  <div className={`w-px h-6 mx-1 ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  <button 
                    onClick={clearSelection}
                    className={`p-2 rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                    title="Limpar seleção"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            <div 
              onMouseDown={dragScrollMain.onMouseDown}
              onMouseLeave={dragScrollMain.onMouseLeave}
              onMouseUp={dragScrollMain.onMouseUp}
              onMouseMove={dragScrollMain.onMouseMove}
              className={`mt-4 rounded-xl border overflow-hidden flex flex-col transition-all duration-500 ${selectedItems.size > 0 ? (darkMode ? 'ring-2 ring-brand-green/30 border-brand-green/20' : 'ring-2 ring-brand-green/10 border-brand-green/10 shadow-lg') : ''} ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
              style={{ height: 'calc(100vh - 280px)', minHeight: '650px', ...dragScrollMain.style }}
            >
              <TableVirtuoso
              scrollerRef={(elem) => { if (elem) dragScrollMain.ref.current = elem as HTMLDivElement; }}
              data={allFilteredItems}
              totalCount={allFilteredItems.length}
              style={{ height: '100%' }}
              components={VirtuosoComponents}
              fixedHeaderContent={VirtuosoHeader}
              context={{ expandedRows, selectedItems }}
              itemContent={(_index, div, context) => {
                if (!div) return null;
                const isExpanded = context.expandedRows.has(div.id);
                const isSelected = context.selectedItems.has(div.id);

                return (
                  <div key={div.id} className="flex flex-col w-full">
                    <TableRowMemo 
                      div={div} 
                      isExpanded={isExpanded} 
                      isSelected={isSelected}
                      toggleRow={toggleRow} 
                      toggleSelectItem={toggleSelectItem} 
                      updateDivergencia={updateDivergencia} 
                      showColunas={showColunas} 
                      formatoMoeda={formatoMoeda} 
                      darkMode={darkMode} 
                      showFinancialImpact={showFinancialImpact}
                      askAI={askAI}
                      aiUser={aiUser}
                    />
                    {isExpanded && (
                      <ExpandedRowMemo 
                        div={div} 
                        darkMode={darkMode} 
                        updateDivergencia={updateDivergencia} 
                        aproveDivergencia={aproveDivergencia}
                        rejeitarDivergencia={rejeitarDivergencia}
                        formatoMoeda={formatoMoeda} 
                        showFinancialImpact={showFinancialImpact}
                        askAI={askAI}
                        aiUser={aiUser}
                      />
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Stats for Summary Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                  {activeTab === 'cfop' ? 'CFOP Mais Crítico' : 
                   activeTab === 'fornecedores' ? 'Fornecedor Mais Crítico' : 
                   activeTab === 'top5' ? 'Material Mais Crítico' : 'Combinação Mais Crítica'}
                </p>
                <div className="flex items-end justify-between">
                  <h4 className="text-lg font-bold truncate max-w-[180px]">
                    {activeTab === 'cfop' ? cfopSummary[0]?.cfop : 
                     activeTab === 'fornecedores' ? supplierSummary[0]?.name : 
                     activeTab === 'top5' ? materialSummary[0]?.material : 
                     (pivotSummary?.[0]?.cfop && pivotSummary?.[0]?.fornecedor ? 
                     `${pivotSummary[0].cfop} / ${pivotSummary[0].fornecedor}` : '-')}
                  </h4>
                  {showFinancialImpact && (
                    <span className="text-red-500 font-bold text-sm">
                      {formatoMoeda.format(
                        activeTab === 'cfop' ? cfopSummary[0]?.prejuizo || 0 : 
                        activeTab === 'fornecedores' ? supplierSummary[0]?.prejuizo || 0 : 
                        activeTab === 'top5' ? materialSummary[0]?.prejuizo || 0 : 
                        pivotSummary[0]?.prejuizo || 0
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Maior Abaixo dos Custo Padrão</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-lg font-bold truncate max-w-[180px]">
                    {activeTab === 'cfop' ? [...cfopSummary].sort((a,b) => b.economia - a.economia)[0]?.cfop : 
                     activeTab === 'fornecedores' ? [...supplierSummary].sort((a,b) => b.economia - a.economia)[0]?.name : 
                     activeTab === 'top5' ? [...materialSummary].sort((a,b) => b.economia - a.economia)[0]?.material :
                     (pivotSummary?.length > 0 ? [...pivotSummary].sort((a,b) => b.economia - a.economia)[0]?.cfop : '-')}
                  </h4>
                  {showFinancialImpact && (
                    <span className="text-[#8DC63F] font-bold text-sm">
                      {formatoMoeda.format(
                        activeTab === 'cfop' ? [...cfopSummary].sort((a,b) => b.economia - a.economia)[0]?.economia : 
                        activeTab === 'fornecedores' ? [...supplierSummary].sort((a,b) => b.economia - a.economia)[0]?.economia : 
                        activeTab === 'top5' ? [...materialSummary].sort((a,b) => b.economia - a.economia)[0]?.economia :
                        [...pivotSummary].sort((a,b) => b.economia - a.economia)[0]?.economia
                      )}
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Volume de Itens</p>
                <div className="flex items-end justify-between">
                  <h4 className="text-lg font-bold">
                    {activeTab === 'cfop' ? cfopSummary.length : 
                     activeTab === 'fornecedores' ? supplierSummary.length : 
                     activeTab === 'top5' ? materialSummary.length :
                     pivotSummary.length}
                  </h4>
                  <span className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Registros Únicos</span>
                </div>
              </div>
            </div>

            <div 
              onMouseDown={dragScrollSummary.onMouseDown}
              onMouseLeave={dragScrollSummary.onMouseLeave}
              onMouseUp={dragScrollSummary.onMouseUp}
              onMouseMove={dragScrollSummary.onMouseMove}
              className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
              style={{ height: 'calc(100vh - 450px)', minHeight: '400px', ...dragScrollSummary.style }}
            >
              <TableVirtuoso
                scrollerRef={(elem) => { if (elem) dragScrollSummary.ref.current = elem as HTMLDivElement; }}
                data={
                  activeTab === 'cfop' ? cfopSummary :
                  activeTab === 'fornecedores' ? supplierSummary :
                  activeTab === 'top5' ? materialSummary :
                  pivotSummary
                }
                style={{ height: '100%' }}
                components={{
                  Table: (props) => <div {...props} className="min-w-full flex flex-col" />,
                  TableBody: (props) => <div {...props} className="flex flex-col" />,
                  TableRow: (props) => <div {...props} className="flex flex-col" />,
                  TableFoot: () => (
                    <div className={`border-t-2 sticky bottom-0 z-10 flex items-center h-12 text-sm font-bold ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                      {activeTab === 'pivot' ? (
                        <>
                          <div className="px-2 shrink-0 w-32">TOTAL GERAL</div>
                          <div className="px-2 shrink-0 w-64"></div>
                          <div className="px-2 shrink-0 w-64"></div>
                          <div className="px-2 shrink-0 w-32 text-right">{summaryTotals.totalItens}</div>
                          <div className="px-2 shrink-0 w-40 text-right">{summaryTotals.divPerc.toFixed(1)}%</div>
                          <div className={`px-2 shrink-0 w-48 text-right ${totals.prejuizo - totals.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                            {formatoMoeda.format(totals.prejuizo - totals.economia)}
                          </div>
                          <div className="px-2 shrink-0 w-24"></div>
                        </>
                      ) : (
                        <>
                          <div className="px-2 shrink-0 w-32">TOTAL GERAL</div>
                          <div className="px-2 shrink-0 w-32 text-right">{summaryTotals.totalItens}</div>
                          <div className="px-2 shrink-0 w-40 text-right">{summaryTotals.divPerc.toFixed(1)}%</div>
                          <div className="px-2 shrink-0 w-48 text-right text-red-500">{formatoMoeda.format(totals.prejuizo)}</div>
                          <div className="px-2 shrink-0 w-48 text-right text-[#8DC63F]">{formatoMoeda.format(totals.economia)}</div>
                          <div className={`px-2 shrink-0 w-48 text-right ${totals.prejuizo - totals.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                            {formatoMoeda.format(totals.prejuizo - totals.economia)}
                          </div>
                          <div className="px-2 shrink-0 w-24"></div>
                        </>
                      )}
                    </div>
                  )
                }}
                fixedHeaderContent={() => (
                  <div className={`flex items-center text-[10px] uppercase tracking-wider font-bold border-b sticky top-0 z-20 h-10 ${darkMode ? 'bg-slate-800/50 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                    {activeTab === 'cfop' && (
                      <>
                        <div className="px-2 shrink-0 w-32">CFOP</div>
                        <div className="px-2 shrink-0 w-32 text-right">Total Itens</div>
                        <div className="px-2 shrink-0 w-40 text-right">Divergências %</div>
                        <div className="px-2 shrink-0 w-48 text-right">Acima do Custo Padrão</div>
                        <div className="px-2 shrink-0 w-48 text-right">Abaixo dos Custo Padrão</div>
                        <div className="px-2 shrink-0 w-48 text-right">Impacto Líquido</div>
                        <div className="px-2 shrink-0 w-24 text-center">Ações</div>
                      </>
                    )}
                    {activeTab === 'fornecedores' && (
                      <>
                        <div className="px-2 shrink-0 w-80">Fornecedor</div>
                        <div className="px-2 shrink-0 w-32 text-right">Total Itens</div>
                        <div className="px-2 shrink-0 w-40 text-right">Divergências %</div>
                        <div className="px-2 shrink-0 w-48 text-right">Acima do Custo Padrão</div>
                        <div className="px-2 shrink-0 w-48 text-right">Abaixo dos Custo Padrão</div>
                        <div className="px-2 shrink-0 w-48 text-right">Impacto Líquido</div>
                        <div className="px-2 shrink-0 w-24 text-center">Ações</div>
                      </>
                    )}
                    {activeTab === 'top5' && (
                      <>
                        <div className="px-2 shrink-0 w-80">Material / Descrição</div>
                        <div className="px-2 shrink-0 w-32 text-right">Total Itens</div>
                        <div className="px-2 shrink-0 w-40 text-right">Divergências %</div>
                        <div className="px-2 shrink-0 w-48 text-right">Acima do Custo Padrão</div>
                        <div className="px-2 shrink-0 w-48 text-right">Abaixo dos Custo Padrão</div>
                        <div className="px-2 shrink-0 w-48 text-right">Impacto Líquido</div>
                        <div className="px-2 shrink-0 w-24 text-center">Ações</div>
                      </>
                    )}
                    {activeTab === 'pivot' && (
                      <>
                        <div className="px-2 shrink-0 w-32">CFOP</div>
                        <div className="px-2 shrink-0 w-64">Fornecedor</div>
                        <div className="px-2 shrink-0 w-64">Material</div>
                        <div className="px-2 shrink-0 w-32 text-right">Total Itens</div>
                        <div className="px-2 shrink-0 w-40 text-right">Divergências %</div>
                        <div className="px-2 shrink-0 w-48 text-right">Impacto Líquido</div>
                        <div className="px-2 shrink-0 w-24 text-center">Ações</div>
                      </>
                    )}
                  </div>
                )}
                itemContent={(_index, item) => {
                  const divPerc = (item.countDiv / item.count) * 100;
                  
                  if (activeTab === 'cfop') {
                    return (
                      <div className={`flex items-center text-xs transition-colors h-12 border-b ${darkMode ? 'border-slate-800/50 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <div className="px-2 shrink-0 w-32 font-bold text-[#8DC63F]">{item.cfop}</div>
                        <div className="px-2 shrink-0 w-32 text-right font-medium">{item.count}</div>
                        <div className="px-2 shrink-0 w-40 text-right">
                          <div className="flex flex-col items-end justify-center gap-1">
                            <span className={`font-bold ${divPerc > 20 ? 'text-red-500' : (darkMode ? 'text-slate-300' : 'text-gray-700')}`}>
                              {divPerc.toFixed(1)}%
                            </span>
                            <div className={`w-16 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full transition-all duration-500 ${divPerc > 50 ? 'bg-red-500' : divPerc > 20 ? 'bg-orange-400' : 'bg-[#8DC63F]'}`}
                                style={{ width: `${divPerc}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="px-2 shrink-0 w-48 text-right font-bold text-red-500">{formatoMoeda.format(item.prejuizo)}</div>
                        <div className="px-2 shrink-0 w-48 text-right font-bold text-[#8DC63F]">{formatoMoeda.format(item.economia)}</div>
                        <div className={`px-2 shrink-0 w-48 text-right font-bold ${item.prejuizo - item.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                          {formatoMoeda.format(item.prejuizo - item.economia)}
                        </div>
                        <div className="px-2 shrink-0 w-24 flex justify-center">
                          <button 
                            onClick={() => handleFilterBySummary('cfop', item.cfop)}
                            className={`p-1.5 rounded-lg transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-[#8DC63F]' : 'bg-gray-100 text-gray-500 hover:text-[#78AF32]'}`}
                            title="Ver itens deste CFOP"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (activeTab === 'fornecedores') {
                    return (
                      <div className={`flex items-center text-xs transition-colors h-12 border-b ${darkMode ? 'border-slate-800/50 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <div className="px-2 shrink-0 w-80 font-bold truncate">{item.name}</div>
                        <div className="px-2 shrink-0 w-32 text-right font-medium">{item.count}</div>
                        <div className="px-2 shrink-0 w-40 text-right">
                          <div className="flex flex-col items-end justify-center gap-1">
                            <span className={`font-bold ${divPerc > 20 ? 'text-red-500' : (darkMode ? 'text-slate-300' : 'text-gray-700')}`}>
                              {divPerc.toFixed(1)}%
                            </span>
                            <div className={`w-16 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full transition-all duration-500 ${divPerc > 50 ? 'bg-red-500' : divPerc > 20 ? 'bg-orange-400' : 'bg-[#8DC63F]'}`}
                                style={{ width: `${divPerc}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="px-2 shrink-0 w-48 text-right font-bold text-red-500">{formatoMoeda.format(item.prejuizo)}</div>
                        <div className="px-2 shrink-0 w-48 text-right font-bold text-[#8DC63F]">{formatoMoeda.format(item.economia)}</div>
                        <div className={`px-2 shrink-0 w-48 text-right font-bold ${item.prejuizo - item.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                          {formatoMoeda.format(item.prejuizo - item.economia)}
                        </div>
                        <div className="px-2 shrink-0 w-24 flex justify-center">
                          <button 
                            onClick={() => handleFilterBySummary('fornecedor', item.name)}
                            className={`p-1.5 rounded-lg transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-[#8DC63F]' : 'bg-gray-100 text-gray-500 hover:text-[#78AF32]'}`}
                            title="Ver itens deste fornecedor"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (activeTab === 'top5') {
                    return (
                      <div className={`flex items-center text-xs transition-colors h-12 border-b ${darkMode ? 'border-slate-800/50 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <div className="px-2 shrink-0 w-80">
                          <div className="flex flex-col items-start justify-center overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                {item.material}
                              </span>
                            </div>
                            <div className="font-bold truncate w-full text-xs" title={item.descricao}>{item.descricao}</div>
                          </div>
                        </div>
                        <div className="px-2 shrink-0 w-32 text-right font-medium">{item.count}</div>
                        <div className="px-2 shrink-0 w-40 text-right">
                          <div className="flex flex-col items-end justify-center gap-1">
                            <span className={`font-bold ${divPerc > 20 ? 'text-red-500' : (darkMode ? 'text-slate-300' : 'text-gray-700')}`}>
                              {divPerc.toFixed(1)}%
                            </span>
                            <div className={`w-16 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                              <div 
                                className={`h-full transition-all duration-500 ${divPerc > 50 ? 'bg-red-500' : divPerc > 20 ? 'bg-orange-400' : 'bg-[#8DC63F]'}`}
                                style={{ width: `${divPerc}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="px-2 shrink-0 w-48 text-right font-bold text-red-500">{formatoMoeda.format(item.prejuizo)}</div>
                        <div className="px-2 shrink-0 w-48 text-right font-bold text-[#8DC63F]">{formatoMoeda.format(item.economia)}</div>
                        <div className={`px-2 shrink-0 w-48 text-right font-bold ${item.prejuizo - item.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                          {formatoMoeda.format(item.prejuizo - item.economia)}
                        </div>
                        <div className="px-2 shrink-0 w-24 flex justify-center">
                          <button 
                            onClick={() => handleFilterBySummary('material', item.material)}
                            className={`p-1.5 rounded-lg transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-[#8DC63F]' : 'bg-gray-100 text-gray-500 hover:text-[#78AF32]'}`}
                            title="Ver itens deste material"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  if (activeTab === 'pivot') {
                    return (
                      <div className={`flex items-center text-xs transition-colors h-12 border-b ${darkMode ? 'border-slate-800/50 hover:bg-slate-800/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <div className="px-2 shrink-0 w-32 font-bold text-[#8DC63F]">{item.cfop}</div>
                        <div className="px-2 shrink-0 w-64 truncate">{item.fornecedor}</div>
                        <div className="px-2 shrink-0 w-64">
                          <div className="flex flex-col items-start justify-center overflow-hidden">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] font-mono px-1 py-0.5 rounded ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                                {item.material}
                              </span>
                            </div>
                            <div className="font-medium truncate w-full text-xs" title={item.descricao}>{item.descricao}</div>
                          </div>
                        </div>
                        <div className="px-2 shrink-0 w-32 text-right font-medium">{item.count}</div>
                        <div className="px-2 shrink-0 w-40 text-right">
                          <div className="flex flex-col items-end justify-center gap-1">
                            <span className={`font-bold ${divPerc > 20 ? 'text-red-500' : (darkMode ? 'text-slate-300' : 'text-gray-700')}`}>
                              {divPerc.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className={`px-2 shrink-0 w-48 text-right font-bold ${item.prejuizo - item.economia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                          {formatoMoeda.format(item.prejuizo - item.economia)}
                        </div>
                        <div className="px-2 shrink-0 w-24 flex justify-center">
                          <button 
                            onClick={() => {
                              setFilterCfop(item.cfop);
                              setFilterSupplier(item.fornecedor);
                              setActiveTab('divergencias');
                              addToast(`Filtrado por CFOP ${item.cfop} e Fornecedor ${item.fornecedor}`, 'success');
                            }}
                            className={`p-1.5 rounded-lg transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:text-[#8DC63F]' : 'bg-gray-100 text-gray-500 hover:text-[#78AF32]'}`}
                            title="Ver itens desta combinação"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return null;
                }}
              />
            </div>
          </div>
        )}

        {/* Total Count Summary */}
        <div className={`p-4 border-t flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            Mostrando <span className="font-bold">{currentCount}</span> de <span className="font-bold">{currentCount}</span> itens
          </p>
        </div>
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onExportExcel={handleExportExcel} 
        onExportPDF={handleExportPDF}
        darkMode={darkMode} 
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        onSave={handleBulkSave}
        selectedCount={selectedItems.size}
        darkMode={darkMode}
      />

      {/* Export Progress Modal */}
      <AnimatePresence>
        {exportProgress.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-md p-8 rounded-2xl shadow-2xl ${darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-100'}`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative w-20 h-20 mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className={`${darkMode ? 'stroke-slate-800' : 'stroke-gray-100'}`}
                      strokeWidth="8"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <motion.circle
                      className="stroke-[#8DC63F]"
                      strokeWidth="8"
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      initial={{ strokeDasharray: "0 251.2" }}
                      animate={{ strokeDasharray: `${(exportProgress.progress / 100) * 251.2} 251.2` }}
                      transition={{ duration: 0.5 }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-[#8DC63F]">{exportProgress.progress}%</span>
                  </div>
                </div>

                <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Exportando Relatório
                </h3>
                <p className={`text-sm mb-8 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  {exportProgress.status}
                </p>

                <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                  <motion.div
                    className="bg-[#8DC63F] h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${exportProgress.progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#8DC63F] animate-pulse">
                  <Cpu className="w-3 h-3" /> Processando Dados
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SAPExportModal
        isOpen={isSAPExportModalOpen}
        onClose={() => setIsSAPExportModalOpen(false)}
        onExport={handleExportSAP}
        darkMode={darkMode}
        formatoMoeda={formatoMoeda}
      />

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedItems.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md bg-opacity-90 bg-[#8DC63F] border-[#78AF32] text-white"
          >
            <div className="flex items-center gap-3 border-r border-white/20 pr-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">Itens Selecionados</p>
                <p className="text-lg font-black leading-none">{selectedItems.size}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsBulkEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#8DC63F] font-bold text-sm hover:bg-gray-100 transition-all shadow-lg"
              >
                <Edit3 className="w-4 h-4" /> Edição em Massa
              </button>
              <button 
                onClick={() => setIsSAPExportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg"
              >
                <Cpu className="w-4 h-4" /> Exportar SAP
              </button>
              <button 
                onClick={() => setSelectedItems(new Set())}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all border border-white/20"
                title="Limpar Seleção"
              >
                <X className="w-4 h-4" /> Limpar Seleção
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuditDetailsPage;
