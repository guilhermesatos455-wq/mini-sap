import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  AlertCircle, 
  Play, 
  Calendar,
  Percent,
  Hash,
  Settings
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { ordenarArquivosPorData } from '../utils/dateUtils';
import FileUploadZone from '../components/Upload/FileUploadZone';
import ColumnMapping from '../components/Upload/ColumnMapping';
import Logo from '../components/Logo';
import { OCRUpload } from '../components/Upload/OCRUpload';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    darkMode,
    filesNF, setFilesNF,
    filesCKM3, setFilesCKM3,
    status,
    warnings,
    progressPercent,
    isProcessing,
    tolerancia, setTolerancia,
    cfops, setCfops,
    dataInicio, setDataInicio,
    dataFim, setDataFim,
    mapColunas, setMapColunas,
    ckm3ManualMapping, setCkm3ManualMapping,
    iniciarProcessamento,
    filterHideZeroes, setFilterHideZeroes,
    addToast
  } = useAudit();

  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [isDraggingNF, setIsDraggingNF] = useState(false);
  const [isDraggingCKM3, setIsDraggingCKM3] = useState(false);
  const [parsedCKM3Header, setParsedCKM3Header] = useState<any[] | null>(null);

  const handleFileNF = React.useCallback((files: FileList | null) => {
    if (files) {
      setFilesNF(prev => {
        const newFiles = Array.from(files);
        const existingNames = new Set(prev.map(f => f.name));
        const filteredNewFiles = newFiles.filter(f => !existingNames.has(f.name));
        return [...prev, ...filteredNewFiles];
      });
    }
  }, [setFilesNF]);

  const handleRemoveFileNF = React.useCallback((fileName: string) => {
    setFilesNF(prev => prev.filter(f => f.name !== fileName));
  }, [setFilesNF]);

  const handleFileCKM3 = React.useCallback((files: FileList | null) => {
    if (files) {
      setFilesCKM3(prev => {
        const newFiles = Array.from(files);
        const existingNames = new Set(prev.map(f => f.name));
        const filteredNewFiles = newFiles.filter(f => !existingNames.has(f.name));
        
        const merged = [...prev, ...filteredNewFiles];
        
        // Diagnostic preview: parse the first of the newly filtered files
        if (filteredNewFiles.length > 0) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
            if (jsonData.length > 0) {
              setParsedCKM3Header(jsonData[0]);
            }
          };
          reader.readAsArrayBuffer(filteredNewFiles[0]);
        }
        
        return ordenarArquivosPorData(merged);
      });
    }
  }, [setFilesCKM3]);

  const handleRemoveFileCKM3 = React.useCallback((fileName: string) => {
    setFilesCKM3(prev => {
        const next = prev.filter(f => f.name !== fileName);
        if (next.length === 0) setParsedCKM3Header(null);
        return next;
    });
  }, [setFilesCKM3]);


  const handleProcess = React.useCallback(async () => {
    try {
      await iniciarProcessamento();
      addToast('Auditoria concluída com sucesso!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro inesperado durante o processamento.';
      addToast(`Falha na Auditoria: ${errorMessage}`, 'error');
    }
  }, [iniciarProcessamento, addToast, navigate]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
          <Logo className="w-8 h-8" />
        </div>
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
            Nova Auditoria
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Carregue seus arquivos e configure os parâmetros para iniciar a análise.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* File Upload Section */}
        <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}>
            <FileSpreadsheet className="w-5 h-5" />
            Bases de Dados (Excel)
          </h3>
          
          <div className="space-y-6">
            <FileUploadZone 
              label="Notas Fiscais"
              files={filesNF}
              isDragging={isDraggingNF}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingNF(true); }}
              onDragLeave={() => setIsDraggingNF(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingNF(false); handleFileNF(e.dataTransfer.files); }}
              onFileSelect={handleFileNF}
              onRemoveFile={handleRemoveFileNF}
              multiple
              darkMode={darkMode}
              id="fileNF"
            />

            <FileUploadZone 
              label="Relatório CKM3"
              files={filesCKM3}
              multiple
              isDragging={isDraggingCKM3}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingCKM3(true); }}
              onDragLeave={() => setIsDraggingCKM3(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingCKM3(false); handleFileCKM3(e.dataTransfer.files); }}
              onFileSelect={handleFileCKM3}
              onRemoveFile={handleRemoveFileCKM3}
              darkMode={darkMode}
              id="fileCKM3"
            />
            {parsedCKM3Header && (
              <>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-green-50 border-green-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-green-800'}`}>Visualização de Cabeçalhos (CKM3)</h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {parsedCKM3Header.map((h, i) => (
                    <span key={i} className={`px-2 py-1 rounded ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-white text-green-700 border border-green-200'}`}>
                      {String(h)}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`mt-4 p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-sm font-bold mb-2 ${darkMode ? 'text-[#8DC63F]' : 'text-blue-800'}`}>Mapeamento Manual (Sobrescrita)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['ckm3Mat', 'ckm3Qtd', 'ckm3Centro', 'ckm3Desc'].map(key => (
                    <div key={key}>
                      <label className={`text-[10px] uppercase font-bold ${darkMode ? 'text-slate-400' : 'text-blue-600'} mb-1 block`}>Coluna para {key.replace('ckm3', '')}</label>
                      <select 
                        value={ckm3ManualMapping[key] || ''} 
                        onChange={(e) => setCkm3ManualMapping({...ckm3ManualMapping, [key]: e.target.value})}
                        className={`w-full p-2 border rounded-lg text-xs ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-blue-200 text-slate-800'}`}
                      >
                         <option value="">Automático</option>
                         {parsedCKM3Header.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              </>
            )}
          </div>
        </section>

        {/* Parameters Section */}
        <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]'}`}>
            <Settings className="w-5 h-5" />
            Filtros e Parâmetros
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tolerancia" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Percent className="w-3 h-3" /> Tolerância de Variação (%)
              </label>
              <input 
                id="tolerancia"
                type="number" 
                value={tolerancia}
                onChange={(e) => setTolerancia(Number(e.target.value))}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div>
              <label htmlFor="cfops" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Hash className="w-3 h-3" /> CFOPs Permitidos
              </label>
              <input 
                id="cfops"
                type="text" 
                value={cfops}
                onChange={(e) => setCfops(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div>
              <label htmlFor="dataInicio" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Calendar className="w-3 h-3" /> Data Início
              </label>
              <input 
                id="dataInicio"
                type="date" 
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div>
              <label htmlFor="dataFim" className={`flex items-center gap-2 text-xs font-bold mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <Calendar className="w-3 h-3" /> Data Fim
              </label>
              <input 
                id="dataFim"
                type="date" 
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className={`w-full p-3 border rounded-xl text-sm transition-all focus:outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-200 focus:ring-[#8DC63F]/50'}`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="filterHideZeroes" className={`flex items-center gap-2 text-xs font-bold cursor-pointer ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <input 
                  id="filterHideZeroes"
                  type="checkbox" 
                  checked={filterHideZeroes}
                  onChange={(e) => setFilterHideZeroes(e.target.checked)}
                  className="w-4 h-4 rounded text-[#8DC63F] focus:ring-[#8DC63F]"
                />
                Ocultar Zeros automáticos
              </label>
            </div>
          </div>

          <ColumnMapping 
            isOpen={isMappingOpen}
            onToggle={() => setIsMappingOpen(!isMappingOpen)}
            darkMode={darkMode}
            mapColunas={mapColunas}
            setMapColunas={setMapColunas}
          />
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <OCRUpload 
          darkMode={darkMode} 
          primaryColor="#8DC63F" 
          onExtractData={(data) => {
            addToast(`Dados extraídos da NF: ${data.numeroNF}`, 'success');
            // Here you could fill some preview state or automatically add to files
          }} 
        />
        <div className={`p-6 rounded-[2rem] border flex flex-col justify-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
          <h4 className="text-sm font-black uppercase tracking-widest text-[#8DC63F] mb-2">Dica de Produtividade</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Use o OCR para digitalizar notas fiscais físicas rapidamente. O NatuAssist identifica campos chave como número da NF e fornecedor automaticamente.
          </p>
        </div>
      </div>

      {/* Action Section */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className={`w-full max-w-md flex items-center justify-center gap-3 py-5 rounded-2xl text-lg font-bold transition-all shadow-xl disabled:opacity-50 ${darkMode ? 'bg-[#8DC63F] hover:bg-[#78AF32] text-slate-900' : 'bg-[#8DC63F] hover:bg-[#78AF32] text-white'}`}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Play className="w-6 h-6" />
          )}
          {isProcessing ? 'Processando...' : 'Iniciar Auditoria'}
        </button>

        {isProcessing && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm font-bold">
              <span className={darkMode ? 'text-slate-400' : 'text-gray-600'}>{status}</span>
              <span className="text-[#8DC63F]">{progressPercent}%</span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-gray-200'}`}>
              <div 
                className="bg-[#8DC63F] h-full transition-all duration-300" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div className={`w-full max-w-2xl p-4 rounded-xl border ${darkMode ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
            <div className="flex items-center gap-2 font-bold mb-2">
              <AlertCircle className="w-5 h-5" />
              Avisos
            </div>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
