import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, FileText, Loader2, Sparkles, CheckCircle2, AlertCircle, BrainCircuit, Zap } from 'lucide-react';

const extrairDadosNFFallback = (rawText: string) => {
  const textoLimpo = rawText.replace(/\s+/g, ' ').toUpperCase();
  
  const extractedData = {
    numeroNF: '',
    fornecedor: '', 
    data: '',
    valorTotal: '',
  };

  const dataMatch = textoLimpo.match(/\d{2}\/\d{2}\/\d{4}/);
  if (dataMatch) extractedData.data = dataMatch[0];

  const cnpjMatch = textoLimpo.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
  if (cnpjMatch) {
    extractedData.fornecedor = cnpjMatch[0]; 
  } else {
    const nomeMatch = textoLimpo.match(/RAZ[AÃ]O SOCIAL[ :]*(.*?)(?:CNPJ|INSCRI|ENDERE|RUA)/i);
    if (nomeMatch) extractedData.fornecedor = nomeMatch[1].trim();
  }

  const nfMatch = textoLimpo.match(/N[º°O]?[ :]?([0-9]{1,3}\.[0-9]{3}\.[0-9]{3}|[0-9]{9})/);
  if (nfMatch) extractedData.numeroNF = nfMatch[1];

  const totalRegex = /(?:VALOR TOTAL DA NOTA|TOTAL DA NOTA|VALOR NOTA)[^\d]*(\d{1,3}(?:\.\d{3})*,\d{2})/i;
  const totalMatch = textoLimpo.match(totalRegex);
  
  if (totalMatch) {
    extractedData.valorTotal = totalMatch[1];
  } else {
    const todosValores = textoLimpo.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);
    if (todosValores && todosValores.length > 0) {
      extractedData.valorTotal = todosValores[todosValores.length - 1]; 
    }
  }

  return extractedData;
};

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
  const [usedFallback, setUsedFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    setStatus('Iniciando OCR...');
    setUsedFallback(false);

    try {
      const { data: { text } } = await Tesseract.recognize(
        file,
        'por',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
              setStatus('Lendo caracteres da imagem...');
            }
          }
        }
      );

      setStatus('Analisando estrutura (Buscando IA Local)...');
      let extractedData: any = { rawText: text };

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 

        const promptIA = `
        Extraia as informações do texto OCR abaixo e retorne APENAS um objeto JSON válido.
        Formato: {"numeroNF": "...", "fornecedor": "...", "data": "...", "valorTotal": "..."}
        Texto OCR: ${text}
        `;

        const aiResponse = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen', 
            prompt: promptIA,
            stream: false,
            format: 'json'
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!aiResponse.ok) throw new Error('Servidor Ollama retornou erro.');

        const aiData = await aiResponse.json();
        const jsonParseado = JSON.parse(aiData.response);
        
        extractedData = { ...extractedData, ...jsonParseado };
        setStatus('Dados estruturados com IA ✨');

      } catch (aiError) {
        console.warn('IA Local inacessível. Usando processamento offline.', aiError);
        setUsedFallback(true);
        
        const dadosFallback = extrairDadosNFFallback(text);
        extractedData = { ...extractedData, ...dadosFallback };
        
        setStatus('Dados extraídos no modo Offline ⚡');
      }

      onExtractData(extractedData);
      setTimeout(() => setStatus(null), 4000);

    } catch (err) {
      console.error('OCR Error:', err);
      setError('A leitura de OCR falhou. Tente rodar o projeto localmente.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`p-6 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/50'}`}>
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-4 rounded-2xl ${darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
          <Camera className="w-8 h-8"/>
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tighter flex items-center gap-2">
            OCR NatuAssist
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold uppercase flex items-center gap-1">
              <BrainCircuit className="w-3 h-3"/> IA Híbrida
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Extraia dados de NFs com fallback automático</p>
        </div>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0"/>
            {error}
          </div>
        )}

        {status && !error && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 ${
            usedFallback 
              ? (darkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600') 
              : (darkMode ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-green/5 text-brand-green')
          }`}>
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin shrink-0"/>
            ) : usedFallback ? (
              <Zap className="w-5 h-5 shrink-0"/>
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0"/>
            )}
            {status}
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />

        <button onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="w-full group relative overflow-hidden py-4 rounded-2xl transition-all">
          <div className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" style={{ backgroundColor: primaryColor }} />
          <div className="absolute inset-x-0 bottom-0 h-1 transition-all" style={{ backgroundColor: primaryColor, width: `${progress}%` }} />
          <div className="relative flex items-center justify-center gap-3">
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: primaryColor }}/>
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
                  {progress < 100 ? `Lendo Imagem (${progress}%)` : 'Processando...'}
                </span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" style={{ color: primaryColor }}/>
                <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>Selecionar NF</span>
                <Sparkles className="w-4 h-4 text-purple-500 animate-pulse"/>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
