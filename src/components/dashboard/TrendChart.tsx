import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  trendData: any[];
  darkMode: boolean;
  formatoMoeda: Intl.NumberFormat;
}

const TrendChart: React.FC<TrendChartProps> = ({ trendData, darkMode, formatoMoeda }) => {
  return (
    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <h3 className={`flex items-center gap-2 text-lg font-bold mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-gray-800'}`}>
        <TrendingUp className="w-5 h-5" />
        Tendência
      </h3>
      <div className="h-[350px] w-full">
        {trendData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8DC63F" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8DC63F" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
              <XAxis 
                dataKey="data" 
                stroke={darkMode ? '#64748b' : '#94a3b8'} 
                fontSize={10} 
                tick={{ fontSize: 9 }}
              />
              <YAxis stroke={darkMode ? '#64748b' : '#94a3b8'} fontSize={10} hide />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#0f172a' : '#fff', 
                  border: 'none', 
                  borderRadius: '12px',
                  fontSize: '10px'
                }}
                formatter={(value: number) => formatoMoeda.format(value)}
              />
              <Area 
                type="monotone" 
                dataKey="liquido" 
                name="Impacto Líquido" 
                stroke="#8DC63F" 
                fillOpacity={1} 
                fill="url(#colorLiquido)" 
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <TrendingUp className="w-12 h-12 mb-2" />
            <p className="text-sm">Dados insuficientes para análise de tendência.<br/>Realize mais auditorias.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendChart;
