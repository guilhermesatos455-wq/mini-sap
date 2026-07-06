import React, { useState } from 'react';
import { Folder, FileText, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface ResultadosProps {
  darkMode: boolean;
  primaryColor: string;
  dados: any[]; // O array de lotes processados gerado no upload
}

export const PainelConciliacao: React.FC<ResultadosProps> = ({ darkMode, primaryColor, dados }) => {
  // Estado para controlar quais pastas estão abertas/expandidas
  const [pastasExpandidas, setPastasExpandidas] = useState<Record<string, boolean>>({});

  const togglePasta = (pasta: string) => {
    setPastasExpandidas(prev => ({ ...prev, [pasta]: !prev[pasta] }));
  };

  // Agrupa o array linear em um objeto indexado pelo nome da pasta
  const dadosAgrupados: Record<string, any[]> = dados.reduce((acc: Record<string, any[]>, item: any) => {
    if (!acc[item.pasta]) acc[item.pasta] = [];
    acc[item.pasta].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  if (dados.length === 0) return null;

  return (
    <div className="w-full space-y-4 mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Lotes de Importação
        </h2>
        <span className="text-sm font-medium px-3 py-1 rounded-full bg-slate-500/10 text-slate-500">
          {Object.keys(dadosAgrupados).length} Doc. Compras encontrados
        </span>
      </div>

      {Object.entries(dadosAgrupados).map(([nomePasta, arquivos]: [string, any[]]) => {
        const estaExpandido = pastasExpandidas[nomePasta];
        
        // Lógica simples para verificar se a pasta tem ND e NF
        const temND = arquivos.some(a => a.nomeArquivo.includes('ND'));
        const temNF = arquivos.some(a => a.nomeArquivo.includes('NF'));
        const concilicado = temND && temNF;

        return (
          <div 
            key={nomePasta}
            className={`overflow-hidden transition-all rounded-2xl border ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
          >
            {/* Cabeçalho da Pasta (Clicável) */}
            <div 
              onClick={() => togglePasta(nomePasta)}
              className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-500/5 transition-colors`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                  <Folder className="w-6 h-6" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {nomePasta}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {arquivos.length} documento(s) lido(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {concilicado ? (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 uppercase">
                    <CheckCircle className="w-4 h-4" /> Par Completo
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-500 uppercase">
                    <AlertCircle className="w-4 h-4" /> Pendente
                  </span>
                )}
                {estaExpandido ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {/* Conteúdo da Pasta (Tabela de Arquivos) */}
            {estaExpandido && (
              <div className={`p-4 border-t ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-100 bg-slate-50'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arquivos.map((arq) => (
                    <div key={arq.nomeArquivo} className={`p-4 rounded-xl border ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className={`w-5 h-5 ${arq.nomeArquivo.includes('ND') ? 'text-purple-500' : 'text-blue-500'}`} />
                        <span className={`font-bold text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                          {arq.nomeArquivo}
                        </span>
                      </div>
                      
                      {/* Exibição dos dados específicos extraídos pelo OCR */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Ref. PO:</span>
                          <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{arq.dados?.referencia_po || '---'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Processo:</span>
                          <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{arq.dados?.processo_imp || '---'}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-500/20">
                          <span className="text-slate-500 font-medium">Valor Total:</span>
                          <span className="font-bold text-emerald-500">
                            R$ {arq.dados?.valor_total_pagar || arq.dados?.valor_total_nota || '0,00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
