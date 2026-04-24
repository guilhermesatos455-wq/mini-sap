import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Settings, 
  Filter, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { AuditRecipe, AuditRule } from '../types/audit';
import { safeLocalStorageSet, safeLocalStorageGet } from '../utils/storageUtils';

const RecipesPage: React.FC = () => {
  const { darkMode, addToast } = useAudit();
  const [recipes, setRecipes] = useState<AuditRecipe[]>(() => {
    return safeLocalStorageGet('audit_recipes', []);
  });
  
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [currentRecipe, setCurrentRecipe] = useState<Partial<AuditRecipe>>({
    name: '',
    description: '',
    rules: [],
    action: { type: 'highlight', payload: '#ef4444' },
    active: true
  });

  const saveRecipes = (updated: AuditRecipe[]) => {
    setRecipes(updated);
    safeLocalStorageSet('audit_recipes', updated);
  };

  const handleCreate = () => {
    setIsEditing('new');
    setCurrentRecipe({
      id: Date.now().toString(),
      name: 'Nova Receita',
      description: '',
      rules: [{ id: '1', field: 'variacaoPerc', operator: '>', value: 10 }],
      action: { type: 'highlight', payload: '#ef4444' },
      active: true
    });
  };

  const handleSave = () => {
    if (!currentRecipe.name) {
      addToast('Dê um nome à receita', 'error');
      return;
    }
    
    let updated;
    if (isEditing === 'new') {
      updated = [...recipes, currentRecipe as AuditRecipe];
    } else {
      updated = recipes.map(r => r.id === isEditing ? currentRecipe as AuditRecipe : r);
    }
    
    saveRecipes(updated);
    setIsEditing(null);
    addToast('Receita salva com sucesso!', 'success');
  };

  const handleDelete = (id: string) => {
    const updated = recipes.filter(r => r.id !== id);
    saveRecipes(updated);
    addToast('Receita removida.', 'info');
  };

  const toggleActive = (id: string) => {
    const updated = recipes.map(r => r.id === id ? { ...r, active: !r.active } : r);
    saveRecipes(updated);
  };

  const addRule = () => {
    setCurrentRecipe(prev => ({
      ...prev,
      rules: [...(prev.rules || []), { id: Date.now().toString(), field: 'variacaoPerc', operator: '>', value: 0 }]
    }));
  };

  const removeRule = (id: string) => {
    setCurrentRecipe(prev => ({
      ...prev,
      rules: (prev.rules || []).filter(r => r.id !== id)
    }));
  };

  const updateRule = (id: string, updates: Partial<AuditRule>) => {
    setCurrentRecipe(prev => ({
      ...prev,
      rules: (prev.rules || []).map(r => r.id === id ? { ...r, ...updates } : r)
    }));
  };

  return (
    <div className={`p-4 md:p-8 max-w-6xl mx-auto space-y-8 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight uppercase">Receitas de Auditoria</h1>
          <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Crie regras personalizadas para automatizar a identificação de discrepâncias críticas.
          </p>
        </div>
        {!isEditing && (
          <button 
            onClick={handleCreate}
            className="px-6 py-3 rounded-2xl bg-[#8DC63F] text-white text-xs font-black uppercase tracking-widest hover:bg-[#78AF32] transition-all flex items-center gap-2 shadow-xl shadow-[#8DC63F]/20"
          >
            <Plus className="w-4 h-4" /> Nova Receita
          </button>
        )}
      </div>

      {isEditing ? (
        <div className={`rounded-[40px] border shadow-2xl overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-black uppercase tracking-widest">Configurando Receita</h2>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(null)}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-600/20 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Salvar Receita
              </button>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nome da Receita</label>
                  <input 
                    type="text"
                    value={currentRecipe.name}
                    onChange={(e) => setCurrentRecipe(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Alavanca de ICMS SP"
                    className={`w-full p-4 rounded-2xl border text-sm font-bold ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Descrição (Obrigatório)</label>
                  <textarea 
                    value={currentRecipe.description}
                    onChange={(e) => setCurrentRecipe(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Explique o que esta regra valida..."
                    className={`w-full p-4 rounded-2xl border text-sm font-bold h-24 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Ação do Sistema</label>
                <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setCurrentRecipe(prev => ({ ...prev, action: { ...prev.action!, type: 'highlight' } }))}
                      className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${currentRecipe.action?.type === 'highlight' ? 'bg-[#8DC63F] border-[#8DC63F] text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      Destacar
                    </button>
                    <button 
                      onClick={() => setCurrentRecipe(prev => ({ ...prev, action: { ...prev.action!, type: 'comment' } }))}
                      className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${currentRecipe.action?.type === 'comment' ? 'bg-[#8DC63F] border-[#8DC63F] text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      Comentar
                    </button>
                    <button 
                      onClick={() => setCurrentRecipe(prev => ({ ...prev, action: { ...prev.action!, type: 'status' } }))}
                      className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${currentRecipe.action?.type === 'status' ? 'bg-[#8DC63F] border-[#8DC63F] text-white' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      Alterar Status
                    </button>
                  </div>
                  
                  <div>
                    <input 
                      type="text"
                      value={currentRecipe.action?.payload}
                      onChange={(e) => setCurrentRecipe(prev => ({ ...prev, action: { ...prev.action!, payload: e.target.value } }))}
                      placeholder={currentRecipe.action?.type === 'highlight' ? 'Cor (ex: #ef4444)' : 'Conteúdo da ação...'}
                      className={`w-full p-3 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#8DC63F]">Regras de Validação (TODAS devem ser verdadeiras)</label>
                <button 
                  onClick={addRule}
                  className="p-2 rounded-lg bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {currentRecipe.rules?.map((rule) => (
                  <div key={rule.id} className="flex gap-3 items-center">
                    <select 
                      value={rule.field}
                      onChange={(e) => updateRule(rule.id, { field: e.target.value })}
                      className={`p-3 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    >
                      <option value="variacaoPerc">Variação %</option>
                      <option value="impactoFinanceiro">Impacto Financeiro</option>
                      <option value="cfop">CFOP</option>
                      <option value="fornecedor">Fornecedor</option>
                      <option value="icmsEfetivoPerc">ICMS %</option>
                      <option value="ipiEfetivoPerc">IPI %</option>
                      <option value="quantidade">Quantidade</option>
                    </select>

                    <select 
                      value={rule.operator}
                      onChange={(e) => updateRule(rule.id, { operator: e.target.value as any })}
                      className={`p-3 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    >
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value="==">{'=='}</option>
                      <option value="!=">{'!='}</option>
                      <option value="contains">contém</option>
                    </select>

                    <input 
                      type="text"
                      value={rule.value}
                      onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                      className={`flex-1 p-3 rounded-xl border text-xs font-bold ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}
                    />

                    <button 
                      onClick={() => removeRule(rule.id)}
                      className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div 
              key={recipe.id}
              className={`p-8 rounded-[32px] border transition-all hover:shadow-2xl hover:-translate-y-1 group ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
                  <Settings className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => toggleActive(recipe.id)}
                  className={`w-12 h-6 rounded-full relative transition-all ${recipe.active ? 'bg-[#8DC63F]' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${recipe.active ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-black uppercase tracking-tight">{recipe.name}</h3>
                <p className={`text-xs font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'} line-clamp-2`}>
                  {recipe.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    {recipe.rules.length} Regras
                  </div>
                  <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-800 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                    {recipe.action.type}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      setIsEditing(recipe.id);
                      setCurrentRecipe(recipe);
                    }}
                    className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(recipe.id)}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {recipes.length === 0 && !isEditing && (
            <div className="col-span-full py-20 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto opacity-50">
                <Info className="w-10 h-10" />
              </div>
              <p className={`text-sm font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Nenhuma receita configurada ainda.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecipesPage;
