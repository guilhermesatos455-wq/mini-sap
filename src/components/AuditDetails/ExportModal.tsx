import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, X, FileSpreadsheet, FileText, Check } from 'lucide-react';

import { EXPORT_COLUMNS } from '../../constants/auditConstants';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportExcel: (selectedCols: Set<string>, includeAllItems: boolean, includeSummaries: boolean, includePivot: boolean) => void;
  onExportPDF: (selectedCols: Set<string>, includeAllItems: boolean) => void;
  darkMode: boolean;
}

export const ExportModal = ({ isOpen, onClose, onExportExcel, onExportPDF, darkMode }: ExportModalProps) => {
  const [selectedCols, setSelectedCols] = useState<Set<string>>(new Set(EXPORT_COLUMNS.map(c => c.id)));
  const [includeAllItems, setIncludeAllItems] = useState(false);
  const [includeSummaries, setIncludeSummaries] = useState(true);
  const [includePivot, setIncludePivot] = useState(true);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const toggleCol = (id: string) => {
    const next = new Set(selectedCols);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCols(next);
  };

  const handleGenerate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (exportType === 'excel') {
        onExportExcel(selectedCols, includeAllItems, includeSummaries, includePivot);
      } else {
        onExportPDF(selectedCols, includeAllItems);
      }
      setIsProcessing(false);
    }, 50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
      >
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-green/10 rounded-lg">
              <Download className="w-5 h-5 text-brand-green" />
            </div>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Opções de Exportação</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setExportType('excel')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${exportType === 'excel' ? 'border-brand-green bg-brand-green/5' : (darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-gray-100 bg-gray-50')}`}
            >
              <FileSpreadsheet className={`w-8 h-8 ${exportType === 'excel' ? 'text-brand-green' : 'text-gray-400'}`} />
              <span className={`text-sm font-bold ${exportType === 'excel' ? (darkMode ? 'text-slate-200' : 'text-gray-800') : 'text-gray-500'}`}>Microsoft Excel</span>
              <span className="text-[10px] text-gray-400">Relatório completo com abas</span>
            </button>
            <button 
              onClick={() => setExportType('pdf')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${exportType === 'pdf' ? 'border-red-500 bg-red-500/5' : (darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-gray-100 bg-gray-50')}`}
            >
              <FileText className={`w-8 h-8 ${exportType === 'pdf' ? 'text-red-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-bold ${exportType === 'pdf' ? (darkMode ? 'text-slate-200' : 'text-gray-800') : 'text-gray-500'}`}>Documento PDF</span>
              <span className="text-[10px] text-gray-400">Resumo executivo visual</span>
            </button>
          </div>

          <div className="space-y-6">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
              <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Configurações Gerais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={includeAllItems} 
                      onChange={() => setIncludeAllItems(!includeAllItems)}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full transition-colors ${includeAllItems ? 'bg-brand-green' : (darkMode ? 'bg-slate-700' : 'bg-gray-300')}`} />
                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includeAllItems ? 'translate-x-5' : ''}`} />
                  </div>
                  <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Incluir itens sem divergência</span>
                </label>

                {exportType === 'excel' && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={includeSummaries} 
                          onChange={() => setIncludeSummaries(!includeSummaries)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${includeSummaries ? 'bg-brand-green' : (darkMode ? 'bg-slate-700' : 'bg-gray-300')}`} />
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includeSummaries ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Incluir Abas de Resumo</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          checked={includePivot} 
                          onChange={() => setIncludePivot(!includePivot)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-5 rounded-full transition-colors ${includePivot ? 'bg-brand-green' : (darkMode ? 'bg-slate-700' : 'bg-gray-300')}`} />
                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${includePivot ? 'translate-x-5' : ''}`} />
                      </div>
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>Incluir Tabela Dinâmica</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Colunas do Relatório</h4>
                  <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                    Selecione as colunas que deseja incluir no detalhamento.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedCols(new Set())}
                    className="text-[10px] font-bold text-brand-green hover:underline"
                  >
                    Nenhuma
                  </button>
                  <button 
                    onClick={() => setSelectedCols(new Set(EXPORT_COLUMNS.map(c => c.id)))}
                    className="text-[10px] font-bold text-brand-green hover:underline"
                  >
                    Todas
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXPORT_COLUMNS.map(col => (
                  <label key={col.id} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${selectedCols.has(col.id) ? (darkMode ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-brand-green/5 border-brand-green text-brand-green') : (darkMode ? 'border-slate-800 text-slate-500 hover:border-slate-700' : 'border-gray-100 text-gray-500 hover:border-gray-200')}`}>
                    <input 
                      type="checkbox" 
                      checked={selectedCols.has(col.id)} 
                      onChange={() => toggleCol(col.id)}
                      className="hidden"
                    />
                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedCols.has(col.id) ? 'bg-brand-green border-brand-green' : (darkMode ? 'border-slate-600' : 'border-gray-300')}`}>
                      {selectedCols.has(col.id) && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="text-[11px] font-bold truncate">{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
          <div className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
            {selectedCols.size} colunas selecionadas
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Cancelar
            </button>
            <button 
              onClick={handleGenerate}
              disabled={selectedCols.size === 0 || isProcessing}
              className={`px-8 py-2 rounded-xl font-bold text-white transition-all shadow-lg flex items-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : (exportType === 'excel' ? 'bg-brand-green hover:bg-brand-green/90 shadow-brand-green/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20')}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>Gerar {exportType === 'excel' ? 'Excel' : 'PDF'}</>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
