import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface OCRUploadProps {
  darkMode: boolean;
  onExtractData: (data: any) => void;
  primaryColor: string;
}

export const OCRUpload: React.FC<OCRUploadProps> = ({ darkMode, onExtractData, primaryColor }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setStatus('Iniciando OCR...');

    try {
      const worker = await createWorker('por', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setStatus('Reconhecendo texto e extraindo campos SAP...');
          }
        },
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      setStatus('Analisando estrutura da Nota Fiscal...');
      
      // Heuristic extraction for common NF fields
      // This is a simple version, in a real world scenario you'd use a regex or a specialized model
      const lines = text.split('\n');
      
      const extractedData = {
        numeroNF: text.match(/NF[ -]*([0-9.]+)/i)?.[1] || '',
        fornecedor: text.match(/RAZÃO[ ]*SOCIAL[ :]*([^\n]+)/i)?.[1] || '',
        data: text.match(/EMISSÃO[ :]*([0-9/]{10})/i)?.[1] || '',
        valorTotal: text.match(/VALOR[ ]*TOTAL[ ]*DA[ ]*NOTA[ :]*([0-9.,]+)/i)?.[1] || '',
        rawText: text
      };

      onExtractData(extractedData);
      setStatus('Dados extraídos com sucesso!');
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Erro ao processar imagem. Tente uma foto mais nítida.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-2xl ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
          <Camera className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            OCR NatuAssist
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold uppercase">Beta</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Extraia dados de NFs físicas e fotos automaticamente</p>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {status && !error && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${darkMode ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-green/5 text-brand-green'}`}>
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {status}
          </div>
        )}

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="w-full group relative overflow-hidden py-4 rounded-2xl transition-all"
        >
          <div 
            className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
            style={{ backgroundColor: primaryColor }}
          />
          <div 
            className="absolute inset-x-0 bottom-0 h-1 transition-all"
            style={{ backgroundColor: primaryColor, width: `${progress}%` }}
          />
          <div className="relative flex items-center justify-center gap-3">
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }} />
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                  Processando ({progress}%)
                </span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                  Selecionar Foto da NF
                </span>
                <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
              </>
            )}
          </div>
        </button>

        <p className="text-[10px] text-center text-slate-400 font-medium px-6">
          A IA tentará identificar Número da NF, Fornecedor e Valores automaticamente usando visão computacional.
        </p>
      </div>
    </div>
  );
};
