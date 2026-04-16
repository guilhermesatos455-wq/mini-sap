import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Download, Settings, Check, AlertCircle, FileText } from 'lucide-react';

interface SAPExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: { delimiter: string, columns: string[] }) => void;
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

const SAP_COLUMNS = [
  'Material', 'Descrição', 'Fornecedor', 'CFOP', 'Empresa', 
  'Número NF', 'Qtd', 'Preço NF', 'Custo SAP', 'Impacto', 
  'Status', 'Data', 'Tipo Material', 'Categoria NF', 
  'Origem Material', 'ICMS', 'IPI', 'PIS', 'COFINS', 'ST',
  'Divergência', 'Comentário'
];

const PRESETS = {
  CUSTOM: 'Personalizado',
  MR21: 'MR21 (Atualização de Preço)',
  COMPLEMENTAR: 'Nota Complementar'
};

export const SAPExportModal: React.FC<SAPExportModalProps> = ({ isOpen, onClose, onExport, darkMode, formatoMoeda }) => {
  const [delimiter, setDelimiter] = useState(';');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(SAP_COLUMNS);
  const [activePreset, setActivePreset] = useState<string>(PRESETS.CUSTOM);
  const [isProcessing, setIsProcessing] = useState(false);

  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    if (preset === PRESETS.MR21) {
      setSelectedColumns(['Material', 'Centro', 'Preço NF', 'Moeda', 'Data']);
      setDelimiter(';');
    } else if (preset === PRESETS.COMPLEMENTAR) {
      setSelectedColumns(['Número NF', 'Fornecedor', 'Material', 'Impacto', 'ICMS']);
      setDelimiter(';');
    } else {
      setSelectedColumns(SAP_COLUMNS);
    }
  };

  const toggleColumn = (col: string) => {
    setActivePreset(PRESETS.CUSTOM);
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleExport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onExport({ delimiter, columns: selectedColumns });
      setIsProcessing(false);
    }, 50);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={`w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'}`}
        >
          <div className={`p-6 border-b flex items-center justify-between ${darkMode ? 'border-slate-800 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Cpu className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Exportar para SAP</h2>
                <p className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>Configuração de Carga de Dados</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-200 text-gray-400'}`}>
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-8 space-y-8">
            {/* Presets Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-green" />
                <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Layouts SAP-Ready</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.values(PRESETS).map(p => (
                  <button
                    key={p}
                    onClick={() => applyPreset(p)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activePreset === p ? 'border-brand-green bg-brand-green/10 text-brand-green' : (darkMode ? 'border-slate-800 bg-slate-800 text-slate-400 hover:border-slate-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200')}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Delimiter Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-500" />
                <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Delimitador de Arquivo</h3>
              </div>
              <div className="flex gap-3">
                {[';', ',', '|', '\\t'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDelimiter(d)}
                    className={`flex-1 py-3 rounded-2xl font-black text-lg transition-all border-2 ${delimiter === d ? 'border-blue-500 bg-blue-500/10 text-blue-500' : (darkMode ? 'border-slate-800 bg-slate-800 text-slate-400 hover:border-slate-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200')}`}
                  >
                    {d === '\\t' ? 'TAB' : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Column Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-500" />
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Colunas de Dados</h3>
                </div>
                <button 
                  onClick={() => setSelectedColumns(selectedColumns.length === SAP_COLUMNS.length ? [] : SAP_COLUMNS)}
                  className="text-xs font-bold text-blue-500 hover:underline"
                >
                  {selectedColumns.length === SAP_COLUMNS.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SAP_COLUMNS.map(col => (
                  <button
                    key={col}
                    onClick={() => toggleColumn(col)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border ${selectedColumns.includes(col) ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' : (darkMode ? 'border-slate-800 bg-slate-800 text-slate-500 hover:border-slate-700' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200')}`}
                  >
                    {col}
                    {selectedColumns.includes(col) && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Spreadsheet Preview */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-500" />
                <h3 className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Pré-visualização da Planilha</h3>
              </div>
              <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-gray-100 bg-gray-50'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className={darkMode ? 'bg-slate-800/50' : 'bg-gray-100'}>
                        {selectedColumns.map(col => (
                          <th key={col} className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider border-r border-b text-left whitespace-nowrap ${darkMode ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-500'}`}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2].map(row => (
                        <tr key={row}>
                          {selectedColumns.map(col => (
                            <td key={col} className={`px-4 py-2 text-[10px] border-r border-b whitespace-nowrap ${darkMode ? 'border-slate-800 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                              {col === 'Material' ? `MAT-000${row}` : 
                               col === 'Impacto' ? formatoMoeda.format(row * 150) : 
                               col === 'Status' ? 'Divergente' : '...'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className={`p-4 rounded-2xl flex gap-3 ${darkMode ? 'bg-blue-500/5 text-blue-400 border border-blue-500/10' : 'bg-blue-50 bg-opacity-50 text-blue-600 border border-blue-100'}`}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                O arquivo será gerado no formato CSV com o delimitador selecionado. Certifique-se de que o layout das colunas corresponde ao esperado pela sua transação SAP.
              </p>
            </div>
          </div>

          <div className={`p-6 border-t flex gap-4 ${darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-gray-100 bg-gray-50'}`}>
            <button
              onClick={onClose}
              className={`flex-1 py-4 rounded-2xl font-bold transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={selectedColumns.length === 0 || isProcessing}
              className={`flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70' : ''}`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Gerar Arquivo SAP
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
