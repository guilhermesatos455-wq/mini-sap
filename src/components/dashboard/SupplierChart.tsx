import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface SupplierChartProps {
  supplierSummary: any[];
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
  handleDrillDown: (type: 'cfop' | 'supplier', value: string, tipo?: string) => void;
}

const SupplierChart: React.FC<SupplierChartProps> = ({ supplierSummary, darkMode, formatoMoeda, handleDrillDown }) => {
  const currencySymbol = React.useMemo(() => {
    return formatoMoeda.formatToParts(0).find(p => p.type === 'currency')?.value || '';
  }, [formatoMoeda]);

  return (
    <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
        Impacto por Fornecedor (Top 10)
      </h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={supplierSummary.slice(0, 10)}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            onClick={(data: any) => {
              if (data && data.activePayload && data.activePayload[0]) {
                const payload = data.activePayload[0].payload;
                const dataKey = data.activePayload[0].dataKey;
                const tipo = dataKey === 'prejuizo' ? 'acima do custo padrão' : 'abaixo do custo padrão';
                handleDrillDown('supplier', payload.name, tipo);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
            <XAxis 
              type="number" 
              stroke={darkMode ? '#64748b' : '#94a3b8'} 
              fontSize={10} 
              tickFormatter={(val) => `${currencySymbol} ${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val}`} 
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke={darkMode ? '#64748b' : '#94a3b8'} 
              fontSize={9} 
              width={120}
              tick={{ fill: darkMode ? '#cbd5e1' : '#475569' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-4 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Fornecedor: {label}</p>
                      <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                              <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>{entry.name}:</span>
                            </div>
                            <span className={`text-xs font-black ${entry.dataKey === 'prejuizo' ? 'text-red-500' : 'text-brand-green'}`}>
                              {formatoMoeda.format(entry.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className={`mt-3 pt-3 border-t text-[9px] font-medium ${darkMode ? 'border-slate-800 text-slate-500' : 'border-gray-100 text-gray-400'}`}>
                        Clique na barra para detalhar
                      </div>
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', paddingBottom: '20px' }} />
            <Bar dataKey="prejuizo" name="Acima do Custo Padrão" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={15} />
            <Bar dataKey="economia" name="Abaixo do Custo Padrão" fill="#8DC63F" radius={[0, 4, 4, 0]} barSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default SupplierChart;
