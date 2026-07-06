import React, { useRef, useState } from 'react';
import { UploadCloud, Loader2, FolderSync } from 'lucide-react';

interface OCRUploadProps {
  darkMode: boolean;
  onExtractData: (data: any[]) => void; // Agora recebe um array de resultados
  primaryColor: string;
}

export const OCRUpload: React.FC<OCRUploadProps> = ({ darkMode, onExtractData, primaryColor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleClear = () => {
    setProgress({ current: 0, total: 0 });
    onExtractData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });

    const lotesProcessados = [];

    const fetchWithRetry = async (url: string, options: RequestInit, retries = 5, delay = 3000, timeout = 120000): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
          try {
              const controller = new AbortController();
              const id = setTimeout(() => controller.abort(), timeout);
              const response = await fetch(url, { ...options, signal: controller.signal });
              clearTimeout(id);

              if (response.ok) return response;
              
              // Se for rate limit, espera mais tempo
              if (response.status === 429) {
                  await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
                  continue;
              }
              throw new Error(`Erro: ${response.statusText}`);
          } catch (error: any) {
              console.error('Fetch error details:', error);
              if (error.name === 'AbortError') {
                console.error('Request timed out');
              }
              if (i === retries - 1) throw error;
              await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          }
      }
      throw new Error('Falha após múltiplas tentativas');
    };

    // Loop sequencial: essencial para não estourar a memória do navegador com o OCR
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });
  
        // Adiciona delay entre arquivos para evitar rate limits
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
  
        try {
          const formData = new FormData();
          formData.append('file', file);
  
          const response = await fetchWithRetry('/api/analise-fiscal', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errorText}`);
          }
          
          const data = await response.json();
  
          // Extrai a subpasta
          const caminho = (file as any).webkitRelativePath?.split('/') || []; 
          const nomePasta = caminho.length > 2 ? caminho[caminho.length - 2] : "Raiz"; 
  
          // Adicionando o resultado à nossa lista
          lotesProcessados.push({
            pasta: nomePasta,
            nomeArquivo: file.name,
            status: "SUCESSO",
            dados: data
          });
  
        } catch (error) {
          console.error(`Erro ao processar o arquivo ${file.name}:`, error);
          lotesProcessados.push({
            pasta: "ERRO",
            nomeArquivo: file.name,
            status: "ERRO"
          });
        }
      }
  
      // Envia a lista completa de volta para o componente pai renderizar a tabela
      onExtractData(lotesProcessados);
      
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(event.target.files || []));
  };

  return (
    <div 
      className={`p-6 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'} ${isDragging ? `${darkMode ? 'border-purple-500 bg-purple-900/20' : 'border-purple-500 bg-purple-50'}` : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-2xl ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
          <FolderSync className="w-8 h-8"/>
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            Upload em Lote
            {isProcessing && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold uppercase flex items-center gap-1">
                Lendo {progress.current} de {progress.total}...
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 font-medium">Selecione uma pasta com múltiplas NDs e NFs.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Adicionamos 'multiple' e 'webkitdirectory' para habilitar seleção de pasta */}
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          multiple
          {...({ webkitdirectory: "true", directory: "true" } as any)} 
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full group relative overflow-hidden py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <div className="relative flex items-center justify-center gap-3">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }}/>
            ) : (
              <UploadCloud className="w-5 h-5" style={{ color: primaryColor }}/>
            )}
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              {isProcessing ? 'Processando Lote...' : 'Selecionar Pasta'}
            </span>
          </div>
        </button>
        
        {/* Barra de progresso visual simples */}
        {isProcessing && (
          <div className="w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700 mt-4 overflow-hidden">
            <div 
              className="h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${(progress.current / progress.total) * 100}%`, backgroundColor: primaryColor }}
            ></div>
          </div>
        )}

        {progress.total > 0 && !isProcessing && (
          <button
            onClick={handleClear}
            className="w-full py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-500 transition-colors"
          >
            Limpar Seleção
          </button>
        )}
      </div>
    </div>
  );
};
