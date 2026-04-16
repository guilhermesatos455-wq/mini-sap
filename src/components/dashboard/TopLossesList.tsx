import React from 'react';
import { TrendingUp } from 'lucide-react';

interface TopLossesListProps {
  topLosses: any[];
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

const TopLossesList: React.FC<TopLossesListProps> = ({ topLosses, darkMode, formatoMoeda }) => {
  return (
    <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`font-bold flex items-center gap-2 mb-6 ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>
        <TrendingUp className="w-5 h-5 text-red-500" /> Top 5 Acima do Custo Padrão
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {topLosses.length > 0 ? topLosses.map((div: any, idx: number) => (
          <div key={idx} className={`p-3 rounded-xl border transition-all hover:scale-[1.01] ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                {div.material}
              </span>
              <span className="text-xs font-bold text-red-500">
                {formatoMoeda.format(div.impactoFinanceiro)}
              </span>
            </div>
            <p className={`text-[10px] font-medium line-clamp-1 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              {div.descricao}
            </p>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center h-full py-6 opacity-50">
            <TrendingUp className="w-8 h-8 mb-2" />
            <p className="text-xs font-medium">Nenhum valor acima do custo padrão identificado</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TopLossesList;
