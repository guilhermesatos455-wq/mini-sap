import React, { useRef } from 'react';
import { Camera, Sparkles, BrainCircuit } from 'lucide-react';

interface OCRUploadProps {
  darkMode: boolean;
  onExtractData: (data: any) => void;
  primaryColor: string;
}

export const OCRUpload: React.FC<OCRUploadProps> = ({ darkMode, onExtractData, primaryColor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSimulateExtraction = () => {
    // Simula os dados que o OCR teria lido da NF
    onExtractData({
      numeroNF: "000.123.456",
      fornecedor: "FORNECEDOR DE TESTE LTDA",
      data: "30/04/2026",
      valorTotal: "1550,00",
      rawText: "Texto bruto simulado..."
    });
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
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold uppercase flex items-center gap-1">
               Modo Simulação
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">Extração desativada no preview (Restrição de Iframe).</p>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleSimulateExtraction}
          className="w-full group relative overflow-hidden py-4 rounded-2xl transition-all"
          style={{ backgroundColor: `${primaryColor}15` }}
        >
          <div className="relative flex items-center justify-center gap-3">
            <Sparkles className="w-5 h-5" style={{ color: primaryColor }}/>
            <span className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>
              Simular Leitura de NF
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
