import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

const MaterialDashboard: React.FC = () => {
  const { resultado, darkMode, currency } = useAudit();

  const distortionRanking = useMemo(() => {
    if (!resultado?.todosOsItens) return [];
    
    // Pegar itens que tenham custo padrão e calcular distorção média
    const materialsMap = new Map();
    
    resultado.todosOsItens.forEach((item: any) => {
      if (item.custoPadrao > 0) {
        if (!materialsMap.has(item.material)) {
          materialsMap.set(item.material, {
            material: item.material,
            descricao: item.descricao,
            custoPadrao: item.custoPadrao,
            variacaoMedia: 0,
            impactoTotal: 0,
            ocorrencias: 0
          });
        }
        const m = materialsMap.get(item.material);
        m.variacaoMedia += item.variacaoPerc;
        m.impactoTotal += item.impactoFinanceiro;
        m.ocorrencias += 1;
      }
    });

    return Array.from(materialsMap.values())
      .map(m => ({
        ...m,
        variacaoMedia: m.variacaoMedia / m.ocorrencias
      }))
      .sort((a, b) => Math.abs(b.variacaoMedia) - Math.abs(a.variacaoMedia))
      .slice(0, 10);
  }, [resultado]);

  const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL'
  });

  const chartData = distortionRanking.map(m => ({
    name: m.material,
    descricao: m.descricao,
    variacao: parseFloat(m.variacaoMedia.toFixed(2)),
    impacto: m.impactoTotal
  }));

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header>
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
          Dashboard de Materiais
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Análise de distorção de PMM e ranking de materiais críticos na sessão atual.
        </p>
      </header>

      {!resultado ? (
        <div className={`p-12 rounded-3xl border border-dashed text-center ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 opacity-50" />
          <p className="text-slate-500 font-medium">Nenhum dado processado. Faça o upload do CKM3 e NFs para visualizar o dashboard.</p>
        </div>
      ) : (
        <>
          {/* Top Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className={`lg:col-span-2 p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-green" />
                Variação de PMM por Material (%)
              </h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      stroke={darkMode ? '#94a3b8' : '#64748b'} 
                      fontSize={10}
                      width={80}
                    />
                    <RechartsTooltip 
                      cursor={{fill: darkMode ? '#1e293b' : '#f8fafc'}}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#0f172a' : '#ffffff', 
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: darkMode ? '#f1f5f9' : '#1e293b'
                      }}
                      formatter={(value: any) => [`${value}%`, 'Variação']}
                    />
                    <Bar dataKey="variacao" radius={[0, 4, 4, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.variacao > 0 ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-green" />
                  Estatísticas de Sessão
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-800">
                    <span className="text-xs text-slate-500">Materiais Processados</span>
                    <span className="font-bold">{new Set(resultado.todosOsItens.map((i: any) => i.material)).size}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-800">
                    <span className="text-xs text-slate-500">Total de Linhas (NFs)</span>
                    <span className="font-bold">{resultado.linhasNfProcessadas}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-dashed border-slate-800">
                    <span className="text-xs text-slate-500">Materiais no CKM3</span>
                    <span className="font-bold">{resultado.materiaisNoCkm3}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Divergências Críticas</span>
                    <span className="font-bold text-red-500">{resultado.qtdDiv}</span>
                  </div>
                </div>
              </section>

              <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-brand-green" />
                  Filtros Rápidos
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button className={`p-2 text-[10px] font-bold rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>MATÉRIA PRIMA</button>
                  <button className={`p-2 text-[10px] font-bold rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>EMBALAGEM</button>
                  <button className={`p-2 text-[10px] font-bold rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>PROD. ACABADO</button>
                  <button className={`p-2 text-[10px] font-bold rounded-lg ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>REVENDA</button>
                </div>
              </section>
            </div>
          </div>

          {/* Ranking Table */}
          <section className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'}`}>
            <h3 className="text-xl font-black mb-8">Ranking de Distorção de Custo (PMM)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/50">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Material</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Custo Pad. (CKM3)</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Var. Média (%)</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Impacto Total</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {distortionRanking.map((m, idx) => (
                    <tr key={m.material} className="hover:bg-slate-800/10 transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-500 w-4">{idx + 1}.</span>
                          <div>
                            <p className="text-xs font-bold leading-none">{m.descricao}</p>
                            <p className="text-[10px] text-slate-500 mt-1">SKU: {m.material}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-xs">{formatoMoeda.format(m.custoPadrao)}</td>
                      <td className="py-4">
                        <span className={`text-xs font-black flex items-center gap-1 ${m.variacaoMedia > 0 ? 'text-red-500' : 'text-brand-green'}`}>
                          {m.variacaoMedia > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {m.variacaoMedia > 0 ? '+' : ''}{m.variacaoMedia.toFixed(2)}%
                        </span>
                      </td>
                      <td className={`py-4 text-xs font-bold ${m.impactoTotal > 0 ? 'text-red-500' : (m.impactoTotal < 0 ? 'text-brand-green' : 'text-slate-500')}`}>
                        {formatoMoeda.format(m.impactoTotal)}
                      </td>
                      <td className="py-4">
                        {Math.abs(m.variacaoMedia) > 10 ? (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">Crítico</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-brand-green/10 text-brand-green border border-brand-green/20">Monitorado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default MaterialDashboard;
