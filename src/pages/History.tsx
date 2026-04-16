import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  ArrowRight,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Info,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { motion, AnimatePresence } from 'framer-motion';

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const HistoryPage: React.FC = () => {
  const { historico, clearHistorico, darkMode } = useAudit();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleClearHistory = React.useCallback(() => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico?')) {
      clearHistorico();
      setCurrentPage(1);
    }
  }, [clearHistorico]);

  const toggleExpand = React.useCallback((id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(historico.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historico.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = React.useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
            Histórico de Auditorias
          </h1>
          <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Acompanhe o desempenho das últimas auditorias realizadas.
          </p>
        </div>
        {historico.length > 0 && (
          <button 
            onClick={handleClearHistory}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
          >
            <Trash2 className="w-4 h-4" /> Limpar Histórico
          </button>
        )}
      </header>

      {historico.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className={`p-6 rounded-full mb-6 ${darkMode ? 'bg-slate-900 text-slate-700' : 'bg-gray-100 text-gray-300'}`}>
            <HistoryIcon className="w-16 h-16" />
          </div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Nenhum histórico</h2>
          <p className={`mt-2 max-w-md ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
            Suas auditorias concluídas aparecerão aqui automaticamente.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {currentItems.map((item) => (
              <div 
                key={item.id}
                className={`rounded-2xl border transition-all overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-gray-100 text-[#78AF32]'}`}>
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.data}</h4>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>ID: {item.id}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-8">
                      <div className="text-center">
                        <p className={`text-[10px] uppercase font-bold mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Divergências</p>
                        <div className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                          {item.qtdDiv}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className={`text-[10px] uppercase font-bold mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Acima do Custo</p>
                        <div className="flex items-center gap-1 font-bold text-red-500">
                          <TrendingUp className="w-3 h-3" />
                          {formatoMoeda.format(item.totalPrejuizo)}
                        </div>
                      </div>
                      <div className="text-center">
                        <p className={`text-[10px] uppercase font-bold mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Abaixo do Custo</p>
                        <div className="flex items-center gap-1 font-bold text-[#8DC63F]">
                          <TrendingDown className="w-3 h-3" />
                          {formatoMoeda.format(item.totalEconomia)}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleExpand(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${expandedId === item.id ? (darkMode ? 'bg-[#8DC63F] text-slate-900' : 'bg-[#8DC63F] text-white') : (darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
                    >
                      {expandedId === item.id ? 'Fechar Resumo' : 'Ver Detalhes'} 
                      {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === item.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className={`border-t ${darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-gray-100 bg-gray-50/50'}`}
                    >
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <FileText className="w-3 h-3" /> Linhas NF Processadas
                          </div>
                          <p className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            {item.linhasNfProcessadas || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <Hash className="w-3 h-3" /> Linhas CKM3 Processadas
                          </div>
                          <p className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            {item.linhasCkm3Processadas || 'N/A'}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <AlertTriangle className="w-3 h-3" /> Materiais s/ Custo
                          </div>
                          <p className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            {item.qtdAusentes || 0}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <Info className="w-3 h-3" /> Materiais no CKM3
                          </div>
                          <p className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                            {item.materiaisNoCkm3 || 0}
                          </p>
                        </div>
                      </div>
                      <div className="px-6 pb-6">
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-[#8DC63F]/10 text-[#8DC63F]' : 'bg-green-50 text-[#78AF32]'}`}>
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Impacto Líquido</p>
                              <p className={`font-bold ${item.totalPrejuizo - item.totalEconomia > 0 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                                {formatoMoeda.format(item.totalPrejuizo - item.totalEconomia)}
                              </p>
                            </div>
                          </div>
                          <p className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            * Dados resumidos da auditoria realizada em {item.data.split(',')[0]}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
              <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Mostrando <span className="font-bold text-[#8DC63F]">{indexOfFirstItem + 1}</span> a <span className="font-bold text-[#8DC63F]">{Math.min(indexOfLastItem, historico.length)}</span> de <span className="font-bold text-[#8DC63F]">{historico.length}</span> auditorias
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => paginate(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}`}
                  title="Primeira Página"
                >
                  <ChevronsLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}`}
                  title="Página Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === number ? (darkMode ? 'bg-[#8DC63F] text-slate-900' : 'bg-[#8DC63F] text-white') : (darkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-gray-400 hover:bg-gray-100')}`}
                    >
                      {number}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}`}
                  title="Próxima Página"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => paginate(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : (darkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-gray-100 text-gray-600')}`}
                  title="Última Página"
                >
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
