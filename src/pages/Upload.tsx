import React, { useState } from 'react';
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
import FileUploadZone from '../components/Upload/FileUploadZone';
import ColumnMapping from '../components/Upload/ColumnMapping';
import Logo from '../components/Logo';
import { OCRUpload } from '../components/Upload/OCRUpload';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    darkMode,
    filesNF, setFilesNF,
    fileCKM3, setFileCKM3,
    status,
    warnings,
    progressPercent,
    isProcessing,
    tolerancia, setTolerancia,
    cfops, setCfops,
    dataInicio, setDataInicio,
    dataFim, setDataFim,
    mapColunas, setMapColunas,
    iniciarProcessamento,
    addToast
  } = useAudit();

  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [isDraggingNF, setIsDraggingNF] = useState(false);
  const [isDraggingCKM3, setIsDraggingCKM3] = useState(false);

  const handleFileNF = React.useCallback((files: FileList | null) => {
    if (files) setFilesNF(Array.from(files));
  }, [setFilesNF]);

  const handleFileCKM3 = React.useCallback((files: FileList | null) => {
    if (files && files[0]) setFileCKM3(files[0]);
  }, [setFileCKM3]);

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
              multiple
              darkMode={darkMode}
              id="fileNF"
            />

            <FileUploadZone 
              label="Relatório CKM3"
              files={fileCKM3}
              isDragging={isDraggingCKM3}
              onDragOver={(e) => { e.preventDefault(); setIsDraggingCKM3(true); }}
              onDragLeave={() => setIsDraggingCKM3(false)}
              onDrop={(e) => { e.preventDefault(); setIsDraggingCKM3(false); handleFileCKM3(e.dataTransfer.files); }}
              onFileSelect={handleFileCKM3}
              darkMode={darkMode}
              id="fileCKM3"
            />
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
