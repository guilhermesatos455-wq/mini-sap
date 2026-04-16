import React from 'react';
import { Layout as LayoutIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface ColumnMappingProps {
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  mapColunas: any;
  setMapColunas: (map: any) => void;
}

const ColumnMapping: React.FC<ColumnMappingProps> = ({
  isOpen,
  onToggle,
  darkMode,
  mapColunas,
  setMapColunas
}) => {
  const nfFields = [
    { label: 'CFOP', key: 'nfCfop' },
    { label: 'Material', key: 'nfMat' },
    { label: 'Preço', key: 'nfPreco' },
    { label: 'Qtd', key: 'nfQtd' },
    { label: 'Fornecedor', key: 'nfFornecedor' },
    { label: 'Centro', key: 'nfCentro' },
    { label: 'Descrição', key: 'nfDesc' },
    { label: 'ICMS', key: 'nfIcms' },
    { label: 'IPI', key: 'nfIpi' },
    { label: 'PIS', key: 'nfPis' },
    { label: 'COFINS', key: 'nfCofins' },
    { label: 'Preço s/ Frete', key: 'precoSemFrete' },
    { label: 'Preço c/ Frete', key: 'precoComFrete' },
    { label: 'V. Liq s/ Frete', key: 'valorLiqSemFrete' },
    { label: 'V. Liq c/ Frete', key: 'valorLiqComFrete' },
    { label: 'Total s/ Frete', key: 'valorTotalSemFrete' },
    { label: 'Total c/ Frete', key: 'valorTotalComFrete' }
  ];

  const ckm3Fields = [
    { label: 'Material', key: 'ckm3Mat' },
    { label: 'Custo', key: 'ckm3Custo' },
    { label: 'Centro', key: 'ckm3Centro' },
    { label: 'Descrição', key: 'ckm3Desc' }
  ];

  const handleInputChange = (key: string, value: string) => {
    setMapColunas({ ...mapColunas, [key]: value.toUpperCase() });
  };

  return (
    <div className="mt-8">
      <button 
        onClick={onToggle}
        className={`w-full flex items-center justify-between text-sm font-bold border-b pb-3 mb-4 hover:opacity-80 transition-opacity ${darkMode ? 'text-[#8DC63F] border-slate-800' : 'text-[#78AF32] border-gray-100'}`}
      >
        <div className="flex items-center gap-2">
          <LayoutIcon className="w-4 h-4" />
          Mapeamento de Colunas (Excel)
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="animate-in slide-in-from-top-2 duration-200 space-y-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Nota Fiscal</h4>
              {nfFields.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{item.label}</label>
                  <input 
                    type="text" 
                    value={mapColunas[item.key]}
                    onChange={(e) => handleInputChange(item.key, e.target.value)}
                    className={`w-12 p-1.5 border rounded-lg text-center text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'border-gray-200'}`}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className={`text-[10px] uppercase tracking-wider font-bold ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>CKM3</h4>
              {ckm3Fields.map(item => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <label className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>{item.label}</label>
                  <input 
                    type="text" 
                    value={mapColunas[item.key]}
                    onChange={(e) => handleInputChange(item.key, e.target.value)}
                    className={`w-12 p-1.5 border rounded-lg text-center text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'border-gray-200'}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnMapping;
