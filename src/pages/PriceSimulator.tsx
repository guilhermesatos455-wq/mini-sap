import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Package, 
  DollarSign, 
  ArrowRight,
  Info,
  RefreshCw,
  Search,
  TrendingDown,
  BarChart3 // Better icon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAudit } from '../context/AuditContext';

const PriceSimulator: React.FC = () => {
  const { resultado, darkMode, currency } = useAudit();
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [newQty, setNewQty] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [targetSalesPrice, setTargetSalesPrice] = useState<number>(0);
  const [taxes, setTaxes] = useState({
    ipi: 0,
    icms: 18,
    pis: 1.65,
    cofins: 7.6,
    freight: 0
  });
  const [searchTerm, setSearchTerm] = useState('');

  const materials = useMemo(() => {
    if (!resultado) return [];
    
    // 1. Correção: Verifica se o array realmente tem dados antes de assumi-lo
    if (resultado.catalogMateriais && resultado.catalogMateriais.length > 0) {
      return resultado.catalogMateriais;
    }

    if (!resultado.todosOsItens || resultado.todosOsItens.length === 0) return [];
    
    const unique = new Map();
    resultado.todosOsItens.forEach((item: any) => {
      // 2. Garante compatibilidade caso o nome das chaves varie ligeiramente no input
      const matId = item.material || item.Material || item.codigo;
      if (matId && !unique.has(matId)) {
        unique.set(matId, {
          material: matId,
          descricao: item.descricao || item.Descricao || 'Sem descrição',
          custoPadrao: item.custoPadrao || 0,
          qtdEstoque: item.qtdEstoque || 0
        });
      }
    });
    return Array.from(unique.values());
  }, [resultado]);

  const filteredMaterials = useMemo(() => {
    if (!materials) return [];

    return materials.filter(m => {
      // 3. Correção: Previne crash se o material ou descricao forem undefined/null
      const matStr = m?.material ? String(m.material).toLowerCase() : '';
      const descStr = m?.descricao ? String(m.descricao).toLowerCase() : '';
      const busca = searchTerm.toLowerCase();
      
      return matStr.includes(busca) || descStr.includes(busca);
    });
  }, [materials, searchTerm]);

  const selectedData = useMemo(() => {
    return materials.find(m => m.material === selectedMaterial);
  }, [materials, selectedMaterial]);

  // Sync current info when material changes
  React.useEffect(() => {
    if (selectedData) {
      setCurrentQty(selectedData.qtdEstoque || 0);
      setBasePrice(selectedData.custoPadrao || 0);
    }
  }, [selectedData]);

  const simulation = useMemo(() => {
    if (!selectedData || newQty <= 0 || newPrice <= 0) return null;

    const currentTotal = currentQty * basePrice;
    
    // Brazilian Tax Logic for PMM (Net Purchase Price)
    // 1. Gross Price with IPI
    const priceWithIPI = newPrice * (1 + taxes.ipi / 100);
    // 2. Add Freight per unit
    const unitFreight = taxes.freight / (newQty || 1);
    const totalUnitCost = priceWithIPI + unitFreight;
    // 3. Subtract deductible taxes (ICMS, PIS, COFINS)
    const deductiblePct = (taxes.icms + taxes.pis + taxes.cofins) / 100;
    const netPurchasePrice = totalUnitCost * (1 - deductiblePct);

    const newTotal = newQty * netPurchasePrice;
    const totalQty = currentQty + newQty;
    const newPMM = (currentTotal + newTotal) / totalQty;
    const variation = basePrice > 0 ? ((newPMM / basePrice) - 1) * 100 : 0;

    return {
      newPMM,
      variation,
      totalQty,
      netPurchasePrice,
      totalUnitCost,
      impact: newPMM - basePrice
    };
  }, [selectedData, currentQty, basePrice, newQty, newPrice, taxes]);

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
                {filteredMaterials.slice(0, 100).map(m => (
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
                {filteredMaterials.length > 100 && (
                  <div className="text-center py-2 opacity-50 text-[10px] italic">
                    Exibindo 100 de {filteredMaterials.length} resultados. Refine sua busca.
                  </div>
                )}
                {filteredMaterials.length === 0 && (
                  <div className="text-center py-8 opacity-50 text-xs italic">
                    Nenhum material encontrado no resultado da auditoria.
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
                    value={newQty || ''}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'border-gray-200 focus:ring-brand-green/50'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Preço Unitário Base (NF)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="number"
                    value={newPrice || ''}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'border-gray-200 focus:ring-brand-green/50'}`}
                  />
                </div>
              </div>

              {/* Novo Campo: Preço de Venda */}
              <div className="pt-2 border-t border-dashed border-slate-700/50">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#8DC63F] mb-2">Preço de Venda Praticado</label>
                <div className="relative flex gap-2">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8DC63F]" />
                  <input 
                    type="number"
                    value={targetSalesPrice || ''}
                    onChange={(e) => setTargetSalesPrice(Number(e.target.value))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm transition-all outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-[#8DC63F]/50' : 'border-gray-100 focus:ring-[#8DC63F]/50'}`}
                  />
                </div>
                {targetSalesPrice > 0 && simulation.newPMM > 0 && (
                  <div className="mt-3 p-2 rounded-lg bg-slate-800 text-center">
                    <p className="text-[9px] uppercase tracking-widest opacity-60">Margem Bruta</p>
                    <span className={`text-lg font-black ${((targetSalesPrice - simulation.newPMM) / targetSalesPrice) * 100 < 10 ? 'text-red-500' : 'text-[#8DC63F]'}`}>
                      {((targetSalesPrice - simulation.newPMM) / targetSalesPrice * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-green" />
              3. Impostos e Frete
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'IPI (%)', key: 'ipi' },
                { label: 'ICMS (%)', key: 'icms' },
                { label: 'PIS (%)', key: 'pis' },
                { label: 'COFINS (%)', key: 'cofins' },
              ].map(tax => (
                <div key={tax.key}>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">{tax.label}</label>
                  <input 
                    type="number"
                    value={(taxes as any)[tax.key]}
                    onChange={(e) => setTaxes(prev => ({ ...prev, [tax.key]: Number(e.target.value) }))}
                    className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Custo Total de Frete</label>
                <input 
                  type="number"
                  value={taxes.freight}
                  onChange={(e) => setTaxes(prev => ({ ...prev, freight: Number(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-xl text-xs outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}
                />
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selectedData ? (
            <div className={`h-full flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
              <Info className="w-12 h-12 text-slate-500 mb-4 opacity-20" />
              <p className="text-slate-500 font-medium">Selecione um material para iniciar a simulação.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedData.material}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* KPI Strip & Results */}
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
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Estoque Atual</p>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">PMM Atual (SAP)</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={basePrice}
                          onChange={(e) => setBasePrice(Number(e.target.value))}
                          className={`w-full px-3 py-1 font-black border rounded-lg outline-none focus:ring-2 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-brand-green/50' : 'bg-gray-50 border-gray-100 focus:ring-brand-green/50'}`}
                        />
                        {basePrice === 0 && (
                          <div className="absolute top-0 right-0 -mt-2 -mr-2">
                             <div className="bg-amber-500 text-white text-[8px] font-bold px-1 rounded animate-pulse">Inserir Preço</div>
                          </div>
                        )}
                      </div>
                      {selectedData.custoPadrao === 0 && (
                        <p className="text-[9px] text-amber-500 mt-1 font-bold italic">Material sem preço no SAP. Insira um valor para simular.</p>
                      )}
                    </div>
                    
                    <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-brand-green/10 border-brand-green/30' : 'bg-brand-green/5 border-brand-green/20'}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-2">Novo PMM Projetado</p>
                      <p className={`text-2xl font-black ${simulation ? (simulation.variation > 0 ? 'text-red-500' : (simulation.variation < 0 ? 'text-brand-green' : '')) : ''}`}>
                        {simulation ? formatoMoeda.format(simulation.newPMM) : '---'}
                      </p>
                    </div>

                    <div className={`p-6 rounded-2xl border flex items-center justify-center ${simulation ? (simulation.variation > 0 ? 'bg-red-50' : (simulation.variation < 0 ? 'bg-green-50' : '')) : ''}`}>
                       <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Diferença</p>
                           <p className={`text-lg font-black ${simulation ? (simulation.variation > 0 ? 'text-red-500' : 'text-brand-green') : ''}`}>
                               {simulation ? `${simulation.variation.toFixed(2)}%` : '---'}
                           </p>
                       </div>
                    </div>
                  </div>
                  
                  {simulation && (
                    <div className="space-y-4 mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                                <p className="text-[10px] font-black uppercase text-slate-500">Preço Bruto</p>
                                <p className="text-sm font-bold">{formatoMoeda.format(simulation.totalUnitCost)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                                <p className="text-[10px] font-black uppercase text-slate-500">Preço Líquido</p>
                                <p className="text-sm font-bold text-brand-green">{formatoMoeda.format(simulation.netPurchasePrice)}</p>
                            </div>
                        </div>

                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ name: 'Atual', val: basePrice || 0 }, { name: 'Simulado', val: simulation.newPMM }]}>
                                    <XAxis dataKey="name" />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip formatter={(value: number) => formatoMoeda.format(value)} />
                                    <Bar dataKey="val">
                                        <Cell fill={darkMode ? '#475569' : '#94a3b8'} />
                                        <Cell fill={simulation.variation > 0 ? '#ef4444' : '#8DC63F'} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
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
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceSimulator;
