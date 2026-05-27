import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useAudit } from '../context/AuditContext';

const NewReconciliationPage: React.FC = () => {
  const { 
    darkMode, 
    setMovementFiles, 
    setInitialStockFiles, 
    setFinalStockFiles,
    addToast,
    processarConciliacao,
    selectedPlant,
    setSelectedPlant
  } = useAudit();
  
  const [reconciliationData, setReconciliationData] = useState<any[] | null>(null);

  const handleMB51Change = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setMovementFiles(Array.from(e.target.files));
      addToast('Arquivos MB51 selecionados', 'info');
    }
  }, [setMovementFiles, addToast]);

  const handleInitialStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setInitialStockFiles(Array.from(e.target.files));
      addToast('Arquivo de Estoque Inicial selecionado', 'info');
    }
  }, [setInitialStockFiles, addToast]);

  const handleFinalStockChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFinalStockFiles(Array.from(e.target.files));
      addToast('Arquivo de Estoque Final selecionado', 'info');
    }
  }, [setFinalStockFiles, addToast]);

  const handleProcessar = useCallback(() => {
    const result = processarConciliacao();
    setReconciliationData(result);
    addToast(`Conciliação concluída para ${result.length} materiais`, 'success');
  }, [processarConciliacao, addToast]);
  
  return (
    <motion.div
      key="new-reconciliation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
        <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} grid grid-cols-1 md:grid-cols-4 gap-6`}>
          <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Centro</label>
              <select 
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value as '1001' | '1005')}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              >
                  <option value="1001">1001 - Matriz</option>
                  <option value="1005">1005 - Filial</option>
              </select>
          </div>
          <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Movimentações MB51</label>
              <input type="file" multiple onChange={handleMB51Change} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs" />
          </div>
          <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Estoque Inicial</label>
              <input type="file" multiple onChange={handleInitialStockChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs" />
          </div>
          <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Estoque Final</label>
              <input type="file" multiple onChange={handleFinalStockChange} className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs" />
          </div>
      </div>

      <button 
        onClick={handleProcessar}
        className="w-full p-4 rounded-2xl bg-[#8DC63F] hover:bg-[#7db438] text-white font-black text-xs uppercase tracking-widest transition-colors duration-200"
      >
          Iniciar Processamento Consolidado
      </button>

      <div className={`p-8 rounded-[32px] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <h3 className="text-sm font-black mb-6 uppercase tracking-widest text-[#8DC63F]">Tabela de Conciliação</h3>
          {reconciliationData ? (
             <div className="overflow-x-auto">
                <table className="w-full text-xs">
                 <thead>
                   <tr className="border-b border-slate-200 dark:border-slate-700">
                     <th className="p-2 text-left">Material</th>
                     <th className="p-2 text-right">Inicial</th>
                     <th className="p-2 text-right">Prod/Compras</th>
                     <th className="p-2 text-right">Venda</th>
                     <th className="p-2 text-right">Dev. Entr.</th>
                     <th className="p-2 text-right">Dev. Compras</th>
                     <th className="p-2 text-right">Bonif.</th>
                     <th className="p-2 text-right">Outras</th>
                     <th className="p-2 text-right">Perdas</th>
                     <th className="p-2 text-right">Aj. Saída</th>
                     <th className="p-2 text-right">Aj. Entr.</th>
                     <th className="p-2 text-right">Req.</th>
                     <th className="p-2 text-right">Final SAP</th>
                     <th className="p-2 text-right">Diferença</th>
                   </tr>
                 </thead>
                 <tbody>
                    {reconciliationData.map((item, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                         <td className="p-2">{item.material}</td>
                         <td className="p-2 text-right">{item.inicial.toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Produção/Compras'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Venda'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Devolução Entrada'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Devolução Compras'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Bonificação'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Outras Saídas'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Perdas'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Ajuste de Saída'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Ajuste de Entrada'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item['Requisição'].toFixed(2)}</td>
                         <td className="p-2 text-right">{item.finalStockReal.toFixed(2)}</td>
                         <td className={`p-2 text-right font-bold ${item.diferenca !== 0 ? 'text-red-500' : 'text-green-500'}`}>{item.diferenca.toFixed(2)}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs font-bold uppercase tracking-widest">
                Aguardando dados de conciliação...
            </div>
          )}
      </div>
    </motion.div>
  );
};

export default NewReconciliationPage;
