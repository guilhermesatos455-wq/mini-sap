import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Divergencia } from '../../types/audit';

interface VarianceChartProps {
  divergencias: Divergencia[];
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

const VarianceChart: React.FC<VarianceChartProps> = ({ divergencias, darkMode, formatoMoeda }) => {
  const chartData = useMemo(() => {
    return divergencias
      .sort((a, b) => Math.abs(b.impactoFinanceiro) - Math.abs(a.impactoFinanceiro))
      .slice(0, 10)
      .map(d => ({
        material: d.material,
        impacto: d.impactoFinanceiro,
        variacao: d.variacaoPerc
      }));
  }, [divergencias]);

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
        Principais Divergências Financeiras
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
          <XAxis dataKey="material" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} />
          <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={12} tickFormatter={(value) => formatoMoeda.format(value)} />
          <Tooltip 
            formatter={(value: number) => formatoMoeda.format(value)}
            contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0' }}
          />
          <Bar dataKey="impacto" fill="#8DC63F">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.impacto >= 0 ? '#ef4444' : '#8DC63F'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default VarianceChart;
