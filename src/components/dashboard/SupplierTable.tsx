import React from 'react';
import { Users, ArrowRight } from 'lucide-react';

interface SupplierTableProps {
  supplierSummary: any[];
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
  handleDrillDown: (type: 'cfop' | 'supplier', value: string, tipo?: string) => void;
  setShowAllSuppliers: (show: boolean) => void;
  showFinancialImpact: boolean;
}

const SupplierTable: React.FC<SupplierTableProps> = ({ 
  supplierSummary, 
  darkMode, 
  formatoMoeda, 
  handleDrillDown, 
  setShowAllSuppliers,
  showFinancialImpact
}) => {
  return (
    <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className={`flex items-center gap-2 text-lg font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
          <Users className="w-5 h-5" />
          Top Fornecedores
        </h3>
        <button 
          onClick={() => setShowAllSuppliers(true)}
          className={`text-xs font-bold flex items-center gap-1 hover:underline ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}
        >
          Ver todos <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`text-[10px] uppercase tracking-wider font-bold border-b ${darkMode ? 'bg-slate-800/50 border-slate-800 text-slate-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3 text-right">Divergências</th>
              {showFinancialImpact && (
                <>
                  <th className="px-4 py-3 text-right">Acima do Custo Padrão</th>
                  <th className="px-4 py-3 text-right">Abaixo do Custo Padrão</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-gray-100'}`}>
            {supplierSummary.slice(0, 5).map((item, idx) => (
              <tr 
                key={idx} 
                className={`text-xs transition-colors cursor-pointer ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50'}`}
                onClick={() => handleDrillDown('supplier', item.name)}
              >
                <td className="px-4 py-3 font-bold truncate max-w-[150px]">{item.name}</td>
                <td className="px-4 py-3 text-right font-medium">{item.count}</td>
                {showFinancialImpact && (
                  <>
                    <td className="px-4 py-3 text-right font-bold text-red-500">{formatoMoeda.format(item.prejuizo)}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#8DC63F]">{formatoMoeda.format(item.economia)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SupplierTable;
