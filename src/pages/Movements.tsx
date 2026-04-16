import React, { useState, useMemo } from 'react';
import { 
  Box, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCcw, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Calendar,
  BarChart3,
  Table as TableIcon,
  Settings
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { SAPMovementType, MaterialMovement } from '../types/audit';

const MovementsPage: React.FC = () => {
  const { 
    darkMode, 
    movementTypes, 
    setMovementTypes, 
    movements, 
    setMovements,
    addToast 
  } = useAudit();

  const [activeTab, setActiveTab] = useState<'list' | 'types' | 'analytics'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newType, setNewType] = useState<Partial<SAPMovementType>>({ direction: 'Entrada', active: true });
  const [showAddType, setShowAddType] = useState(false);

  // Analytics Logic: Monthly Movement
  const monthlyData = useMemo(() => {
    const data: Record<string, { month: string, entrada: number, saida: number, total: number }> = {};
    
    movements.forEach(m => {
      const date = new Date(m.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!data[monthKey]) {
        data[monthKey] = { month: monthName, entrada: 0, saida: 0, total: 0 };
      }
      
      const type = movementTypes.find(t => t.code === m.movementType);
      if (type) {
        if (type.direction === 'Entrada') {
          data[monthKey].entrada += m.quantity;
          data[monthKey].total += m.quantity;
        } else if (type.direction === 'Saída') {
          data[monthKey].saida += m.quantity;
          data[monthKey].total -= m.quantity;
        }
      }
    });

    return Object.values(data).sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [movements, movementTypes]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => 
      m.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.docNumber.includes(searchTerm)
    );
  }, [movements, searchTerm]);

  const handleUpdateType = (code: string, updates: Partial<SAPMovementType>) => {
    setMovementTypes(movementTypes.map(t => t.code === code ? { ...t, ...updates } : t));
    setEditingType(null);
    addToast('Tipo de movimentação atualizado!', 'success');
  };

  const handleAddType = () => {
    if (!newType.code || !newType.description) {
      addToast('Preencha todos os campos!', 'error');
      return;
    }
    if (movementTypes.find(t => t.code === newType.code)) {
      addToast('Código já existe!', 'error');
      return;
    }
    setMovementTypes([...movementTypes, newType as SAPMovementType]);
    setShowAddType(false);
    setNewType({ direction: 'Entrada', active: true });
    addToast('Novo tipo de movimentação adicionado!', 'success');
  };

  const handleDeleteType = (code: string) => {
    setMovementTypes(movementTypes.filter(t => t.code !== code));
    addToast('Tipo de movimentação removido!', 'info');
  };

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
              <Box className="w-6 h-6" />
            </div>
            <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Movimentações de Estoque
            </h1>
          </div>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Gestão de movimentos MB51 e configuração de tipos de movimentação SAP
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
            <Download className="w-4 h-4" /> Exportar MB51
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#8DC63F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all shadow-lg shadow-[#8DC63F]/20">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/50 w-fit">
        {[
          { id: 'list', label: 'Movimentos', icon: <TableIcon className="w-4 h-4" /> },
          { id: 'analytics', label: 'Análise Mensal', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'types', label: 'Configuração de Tipos', icon: <Settings className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? (darkMode ? 'bg-slate-700 text-[#8DC63F] shadow-lg' : 'bg-white text-[#78AF32] shadow-sm') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600')}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} flex flex-col md:flex-row gap-4`}>
              <div className="relative flex-1">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input 
                  type="text"
                  placeholder="Pesquisar por material, descrição ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none border transition-all ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-[#8DC63F]'}`}
                />
              </div>
              <div className="flex gap-3">
                <button className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <Calendar className="w-4 h-4" /> Período
                </button>
                <button className={`px-4 py-3 rounded-2xl border flex items-center gap-2 text-xs font-bold ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                  <Filter className="w-4 h-4" /> Filtros
                </button>
              </div>
            </div>

            {/* Table */}
            <div className={`rounded-3xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={darkMode ? 'bg-slate-800/50' : 'bg-slate-50/50'}>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Documento</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Material</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Quantidade</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Centro/Dep</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredMovements.length > 0 ? (
                      filteredMovements.map(m => {
                        const type = movementTypes.find(t => t.code === m.movementType);
                        return (
                          <tr key={m.id} className={`group transition-colors ${darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50'}`}>
                            <td className="px-6 py-4">
                              <span className="text-xs font-black font-mono">{m.docNumber}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{new Date(m.date).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded-lg ${type?.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : type?.direction === 'Saída' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                  {type?.direction === 'Entrada' ? <ArrowDownLeft className="w-3 h-3" /> : type?.direction === 'Saída' ? <ArrowUpRight className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3" />}
                                </div>
                                <span className="text-xs font-black">{m.movementType}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-black">{m.material}</span>
                                <span className="text-[10px] font-medium text-slate-400 truncate max-w-[200px]">{m.description}</span>
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right text-xs font-black ${type?.direction === 'Entrada' ? 'text-emerald-500' : type?.direction === 'Saída' ? 'text-rose-500' : ''}`}>
                              {type?.direction === 'Saída' ? '-' : ''}{m.quantity.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{m.plant} / {m.storageLocation}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-bold text-slate-500">{m.user}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <Box className="w-12 h-12" />
                            <span className="text-sm font-black uppercase tracking-widest">Nenhum movimento encontrado</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Monthly Chart */}
            <div className={`lg:col-span-8 p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'} space-y-8`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Volume de Movimentação Mensal</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entradas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saídas</span>
                  </div>
                </div>
              </div>
              
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: darkMode ? '#64748b' : '#94a3b8' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: darkMode ? '#64748b' : '#94a3b8' }}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: darkMode ? '#1e293b' : '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className={`p-4 rounded-2xl border shadow-2xl ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                              <p className="text-xs font-black mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">{payload[0].payload.month}</p>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between gap-8">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Entradas:</span>
                                  <span className="text-xs font-black text-emerald-500">+{payload[0].value?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-8">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saídas:</span>
                                  <span className="text-xs font-black text-rose-500">-{payload[1].value?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between gap-8 pt-2 border-t border-slate-100 dark:border-slate-800">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Saldo:</span>
                                  <span className={`text-xs font-black ${Number(payload[0].value) - Number(payload[1].value) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {(Number(payload[0].value) - Number(payload[1].value)).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="entrada" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="saida" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="lg:col-span-4 space-y-6">
              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h4 className={`text-xs font-black uppercase tracking-widest mb-6 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Resumo do Período</h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Total Entradas</span>
                    </div>
                    <span className="text-lg font-black text-emerald-500">
                      {movements.filter(m => movementTypes.find(t => t.code === m.movementType)?.direction === 'Entrada').reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-bold">Total Saídas</span>
                    </div>
                    <span className="text-lg font-black text-rose-500">
                      {movements.filter(m => movementTypes.find(t => t.code === m.movementType)?.direction === 'Saída').reduce((acc, curr) => acc + curr.quantity, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-widest text-slate-500">Giro de Estoque</span>
                    <span className="text-2xl font-black text-[#8DC63F]">1.2x</span>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
                <h4 className={`text-xs font-black uppercase tracking-widest mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Top Materiais Movimentados</h4>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="text-xs font-black">MAT-000{i}</span>
                        <span className="text-[10px] font-medium text-slate-400">Material de Exemplo {i}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black">{(1500 / i).toLocaleString()}</div>
                        <div className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">+12%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'types' && (
          <motion.div
            key="types"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Tipos de Movimentação SAP</h3>
              <button 
                onClick={() => setShowAddType(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#8DC63F]/10 text-[#8DC63F] text-xs font-black uppercase tracking-widest hover:bg-[#8DC63F]/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Adicionar Tipo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {showAddType && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-6 rounded-3xl border-2 border-dashed ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'} space-y-4`}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Código</label>
                        <input 
                          type="text" 
                          value={newType.code || ''}
                          onChange={e => setNewType({ ...newType, code: e.target.value })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                          placeholder="Ex: 101"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Direção</label>
                        <select 
                          value={newType.direction}
                          onChange={e => setNewType({ ...newType, direction: e.target.value as any })}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        >
                          <option value="Entrada">Entrada</option>
                          <option value="Saída">Saída</option>
                          <option value="Transferência">Transferência</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição</label>
                      <input 
                        type="text" 
                        value={newType.description || ''}
                        onChange={e => setNewType({ ...newType, description: e.target.value })}
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                        placeholder="Descrição do movimento..."
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={handleAddType} className="flex-1 py-2 rounded-xl bg-[#8DC63F] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all">Salvar</button>
                      <button onClick={() => setShowAddType(false)} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Cancelar</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {movementTypes.map(type => (
                <div 
                  key={type.code}
                  className={`p-6 rounded-3xl border transition-all group ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-[#8DC63F]/50' : 'bg-white border-slate-100 hover:border-[#8DC63F]/50 shadow-sm'}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${type.direction === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : type.direction === 'Saída' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {type.direction === 'Entrada' ? <ArrowDownLeft className="w-5 h-5" /> : type.direction === 'Saída' ? <ArrowUpRight className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-xl font-black">{type.code}</div>
                        <div className={`text-[10px] font-black uppercase tracking-widest ${type.direction === 'Entrada' ? 'text-emerald-500' : type.direction === 'Saída' ? 'text-rose-500' : 'text-blue-500'}`}>
                          {type.direction}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingType(type.code)}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-50 text-slate-400'}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteType(type.code)}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-red-50 text-red-500'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {editingType === type.code ? (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input 
                        type="text" 
                        defaultValue={type.description}
                        onBlur={(e) => handleUpdateType(type.code, { description: e.target.value })}
                        autoFocus
                        className={`w-full px-3 py-2 rounded-xl text-xs font-bold outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setEditingType(null)} className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {type.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MovementsPage;
