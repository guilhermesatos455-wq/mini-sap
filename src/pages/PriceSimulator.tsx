import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Package, 
  DollarSign, 
  ArrowRight,
  Info,
  RefreshCw,
  Search
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

const PriceSimulator: React.FC = () => {
  const { resultado, darkMode, currency } = useAudit();
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [newQty, setNewQty] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState('');

  const materials = useMemo(() => {
    if (!resultado?.todosOsItens) return [];
    const unique = new Map();
    resultado.todosOsItens.forEach((item: any) => {
      if (!unique.has(item.material) && item.custoPadrao > 0) {
        unique.set(item.material, {
          material: item.material,
          descricao: item.descricao,
          custoPadrao: item.custoPadrao,
          qtdEstoque: item.qtdEstoque || 0
        });
      }
    });
    return Array.from(unique.values());
  }, [resultado]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.material.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [materials, searchTerm]);

  const selectedData = useMemo(() => {
    return materials.find(m => m.material === selectedMaterial);
  }, [materials, selectedMaterial]);

  // Sync currentQty when material changes
  React.useEffect(() => {
    if (selectedData) {
      setCurrentQty(selectedData.qtdEstoque);
    }
  }, [selectedData]);

  const simulation = useMemo(() => {
    if (!selectedData || newQty <= 0 || newPrice <= 0) return null;

    const currentTotal = currentQty * selectedData.custoPadrao;
    const newTotal = newQty * newPrice;
    const totalQty = currentQty + newQty;
    const newPMM = (currentTotal + newTotal) / totalQty;
    const variation = ((newPMM / selectedData.custoPadrao) - 1) * 100;

    return {
      newPMM,
      variation,
      totalQty,
      impact: newPMM - selectedData.custoPadrao
    };
  }, [selectedData, currentQty, newQty, newPrice]);

  const formatoMoeda = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL'
  });

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header>
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-[#8DC63F]' : 'text-gray-900'}`}>
          Simulador de Preço Médio
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Analise o impacto de novos preços de compra no seu Preço Médio Móvel (PMM).
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Selection & Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-green" />
              1. Selecionar Material
            </h3>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Buscar material ou SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'border-gray-200 focus:ring-brand-green/50'}`}
                />
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {filteredMaterials.map(m => (
                  <button
                    key={m.material}
                    onClick={() => setSelectedMaterial(m.material)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedMaterial === m.material 
                      ? (darkMode ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-brand-green/10 border-brand-green text-brand-green')
                      : (darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-300')
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase opacity-60">{m.material}</div>
                    <div className="text-xs font-bold truncate">{m.descricao}</div>
                  </button>
                ))}
                {filteredMaterials.length === 0 && (
                  <div className="text-center py-8 opacity-50 text-xs italic">
                    Nenhum material encontrado com custo padrão.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-brand-green" />
              2. Dados da Nova Compra
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Quantidade a Comprar</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'border-gray-200 focus:ring-brand-green/50'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Novo Preço Unitário</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'border-gray-200 focus:ring-brand-green/50'}`}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedData ? (
            <div className={`h-full flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
              <Info className="w-12 h-12 text-slate-500 mb-4 opacity-20" />
              <p className="text-slate-500 font-medium">Selecione um material para iniciar a simulação.</p>
            </div>
          ) : (
            <>
              <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-xl shadow-gray-200/50'}`}>
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-brand-green/10 text-brand-green uppercase tracking-widest">
                      Material Selecionado
                    </span>
                    <h2 className="text-2xl font-black mt-2">{selectedData.descricao}</h2>
                    <p className="text-sm opacity-60 font-medium">SKU: {selectedData.material}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estoque Atual (Ajustável)</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <input 
                        type="number"
                        value={currentQty}
                        onChange={(e) => setCurrentQty(Number(e.target.value))}
                        className={`w-24 px-3 py-1 text-right font-black border rounded-lg outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'bg-gray-50 border-gray-200 focus:ring-brand-green/50'}`}
                      />
                      <span className="text-sm font-bold opacity-60">UN</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">PMM Atual (SAP)</p>
                    <p className="text-xl font-black">{formatoMoeda.format(selectedData.custoPadrao)}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-8 h-8 text-brand-green opacity-20" />
                  </div>
                  <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-brand-green/10 border-brand-green/30' : 'bg-brand-green/5 border-brand-green/20'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-2">Novo PMM Projetado</p>
                    <p className={`text-2xl font-black ${simulation ? (simulation.variation > 0 ? 'text-red-500' : 'text-brand-green') : ''}`}>
                      {simulation ? formatoMoeda.format(simulation.newPMM) : '---'}
                    </p>
                  </div>
                </div>

                {simulation && (
                  <div className="mt-8 pt-8 border-t border-dashed border-slate-700/50">
                    <div className="flex flex-wrap gap-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Variação no Custo</p>
                        <div className={`flex items-center gap-2 text-lg font-black ${simulation.variation > 0 ? 'text-red-500' : 'text-brand-green'}`}>
                          <TrendingUp className={`w-5 h-5 ${simulation.variation < 0 ? 'rotate-180' : ''}`} />
                          {simulation.variation > 0 ? '+' : ''}{simulation.variation.toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Impacto Unitário</p>
                        <p className={`text-lg font-black ${simulation.impact > 0 ? 'text-red-500' : 'text-brand-green'}`}>
                          {simulation.impact > 0 ? '+' : ''}{formatoMoeda.format(simulation.impact)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Novo Estoque Total</p>
                        <p className="text-lg font-black">{simulation.totalQty} UN</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-2xl border flex items-start gap-4 ${darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
                <Info className="w-5 h-5 shrink-0 text-blue-500" />
                <div className="text-xs leading-relaxed">
                  <p className="font-bold mb-1">Como funciona o cálculo?</p>
                  <p className="opacity-80">
                    O Preço Médio Móvel é calculado ponderando o estoque atual com a nova entrada: 
                    <span className="block mt-1 font-mono font-bold">((Qtd Atual × Preço Atual) + (Qtd Nova × Preço Novo)) / (Qtd Total)</span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceSimulator;
