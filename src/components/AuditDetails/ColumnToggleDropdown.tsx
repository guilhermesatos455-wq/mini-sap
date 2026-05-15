import React, { useState } from 'react';
import { Settings, Check } from 'lucide-react';
import { ShowColunas } from '../../types/audit';

interface ColumnToggleDropdownProps {
  showColunas: ShowColunas;
  setShowColunas: (cols: ShowColunas) => void;
  darkMode: boolean;
}

export const ColumnToggleDropdown: React.FC<ColumnToggleDropdownProps> = ({ showColunas, setShowColunas, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (key: keyof ShowColunas) => {
    setShowColunas({ ...showColunas, [key]: !showColunas[key] });
  };

  const columnsDef = [
      { id: 'empresa', label: 'Empresa' },
      { id: 'numeroNF', label: 'Número NF' },
      { id: 'tipoMaterial', label: 'Tipo Material' },
      { id: 'categoriaNF', label: 'Categoria NF' },
      { id: 'origemMaterial', label: 'Origem Material' },
      { id: 'dataLancamento', label: 'Data Lançamento' },
      { id: 'precoSemFrete', label: 'Preço Unit. s/ Frete' },
      { id: 'precoComFrete', label: 'Preço Unit. c/ Frete' },
      { id: 'valorLiqSemFrete', label: 'V. Liq s/ Frete' },
      { id: 'valorLiqComFrete', label: 'V. Liq c/ Frete' },
      { id: 'valorTotalSemFrete', label: 'Total s/ Frete' },
      { id: 'valorTotalComFrete', label: 'Total c/ Frete' },
  ] as { id: keyof ShowColunas, label: string }[];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-xl border flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-200 text-slate-600 hover:border-gray-300 shadow-sm'}`}
      >
        <Settings className="w-4 h-4" /> Colunas
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-64 rounded-xl border shadow-lg z-50 p-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h4 className={`text-xs font-bold uppercase mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Visibilidade de Colunas</h4>
          {columnsDef.map(col => (
            <button
              key={col.id}
              onClick={() => toggleColumn(col.id)}
              className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-all ${
                showColunas[col.id] 
                  ? (darkMode ? 'text-[#8DC63F]' : 'text-[#78AF32]') 
                  : (darkMode ? 'text-slate-500' : 'text-gray-500')
              } hover:bg-slate-800/10`}
            >
              {col.label}
              {showColunas[col.id] && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
