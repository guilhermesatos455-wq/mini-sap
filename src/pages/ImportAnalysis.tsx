import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

const ImportAnalysisPage: React.FC = () => {
  const { darkMode, branding } = useAudit();
  
  return (
    <div className="p-6 pb-24 space-y-6">
      <h1 className="text-3xl font-black tracking-tighter" style={{ color: branding.primaryColor }}>
        Análise de Importação
      </h1>
      
      <div className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <BarChart3 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Resumo Executivo (Simulado)</h2>
        </div>
        <ul className="list-disc list-inside text-sm text-slate-500 space-y-2">
          <li>Valor total importado (2023-2025): Informação não disponível no contexto.</li>
          <li>Principais fornecedores: Informação não disponível no contexto.</li>
        </ul>
      </div>

      <div className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-2xl ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Insights Automáticos</h2>
        </div>
        <p className="text-sm text-slate-500">Aguardando importação dos dados da planilha para análise.</p>
      </div>

      <div className={`p-6 rounded-[2rem] border ${darkMode ? 'bg-red-500/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
        <div className="flex items-center gap-4 mb-4 text-red-600">
          <AlertTriangle className="w-6 h-6" />
          <h2 className="text-xl font-bold">Alertas ERP</h2>
        </div>
        <p className="text-sm text-red-500/80">O módulo está pronto. Importe o arquivo para verificar pendências.</p>
      </div>
    </div>
  );
};

export default ImportAnalysisPage;
