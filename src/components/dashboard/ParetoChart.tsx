import React from 'react';
import { 
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ParetoChartProps {
  data: any[];
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

const ParetoChart: React.FC<ParetoChartProps> = ({ data, darkMode, formatoMoeda }) => {
  const paretoData = React.useMemo(() => {
    const sorted = [...data].sort((a, b) => b.prejuizo - a.prejuizo).slice(0, 10);
    const total = sorted.reduce((acc, curr) => acc + curr.prejuizo, 0);
    let cumulative = 0;
    
    return sorted.map(item => {
      cumulative += item.prejuizo;
      return {
        ...item,
        cumulativePercentage: (cumulative / total) * 100
      };
    });
  }, [data]);

  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
        <TrendingUp className="w-5 h-5" />
        Análise de Pareto (Top 10 Impactos)
      </h3>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              stroke={darkMode ? '#64748b' : '#94a3b8'}
              fontSize={9}
              fontWeight="bold"
            />
            <YAxis 
              yAxisId="left"
              stroke={darkMode ? '#64748b' : '#94a3b8'} 
              fontSize={10} 
              label={{ value: 'Impacto (R$)', angle: -90, position: 'insideLeft', style: { fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 10, fontWeight: 'bold' } }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#8DC63F" 
              fontSize={10}
              domain={[0, 100]}
              label={{ value: 'Acumulado (%)', angle: 90, position: 'insideRight', style: { fill: '#8DC63F', fontSize: 10, fontWeight: 'bold' } }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className={`p-4 rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>{label}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-8">
                          <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Impacto:</span>
                          <span className="text-xs font-black text-red-500">
                            {formatoMoeda.format(Number(payload[0].value))}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-8">
                          <span className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Acumulado:</span>
                          <span className="text-xs font-black text-[#8DC63F]">
                            {Number(payload[1].value).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar yAxisId="left" dataKey="prejuizo" name="Impacto" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={40}>
              {paretoData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cumulativePercentage <= 80 ? '#ef4444' : '#f87171'} />
              ))}
            </Bar>
            <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="Acumulado %" stroke="#8DC63F" strokeWidth={3} dot={{ r: 4, fill: '#8DC63F', strokeWidth: 2, stroke: '#fff' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className={`mt-4 p-3 rounded-xl text-[10px] font-medium leading-relaxed ${darkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-gray-50 text-gray-500'}`}>
        <span className="font-bold text-[#8DC63F]">Dica:</span> Os itens à esquerda do ponto de 80% no gráfico representam as causas vitais que devem ser priorizadas para reduzir o impacto financeiro total.
      </div>
    </div>
  );
};

export default ParetoChart;
