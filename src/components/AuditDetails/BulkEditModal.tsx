import React, { useState } from 'react';
import { Settings, X, Check } from 'lucide-react';

import { Divergencia } from '../../types/audit';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Divergencia>) => void;
  selectedCount: number;
  darkMode: boolean;
}

export const BulkEditModal = ({ isOpen, onClose, onSave, selectedCount, darkMode }: BulkEditModalProps) => {
  const [updates, setUpdates] = useState<Partial<Divergencia>>({});
  const [applyFields, setApplyFields] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = [
    { id: 'cfop', label: 'CFOP', type: 'text' },
    { id: 'fornecedor', label: 'Fornecedor', type: 'text' },
    { id: 'material', label: 'Material', type: 'text' },
    { id: 'descricao', label: 'Descrição', type: 'text' },
    { id: 'empresa', label: 'Empresa', type: 'text' },
    { id: 'numeroNF', label: 'Número NF', type: 'text' },
    { id: 'tipoMaterial', label: 'Tipo Material', type: 'text' },
    { id: 'categoriaNF', label: 'Categoria NF', type: 'text' },
    { id: 'origemMaterial', label: 'Origem Material', type: 'text' },
    { id: 'dataLancamento', label: 'Data Lançamento', type: 'date' },
    { id: 'quantidade', label: 'Quantidade', type: 'number' },
    { id: 'precoEfetivo', label: 'Preço NF', type: 'number' },
    { id: 'custoPadrao', label: 'Custo SAP', type: 'number' },
    { id: 'icms', label: 'ICMS', type: 'number' },
    { id: 'ipi', label: 'IPI', type: 'number' },
    { id: 'pis', label: 'PIS', type: 'number' },
    { id: 'cofins', label: 'COFINS', type: 'number' },
    { id: 'st', label: 'ST', type: 'number' },
    { id: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Em Análise', 'Corrigido', 'Ignorado'] },
    { id: 'comentarios', label: 'Comentários', type: 'textarea' },
  ];

  if (!isOpen) return null;

  const toggleField = (id: string) => {
    const next = new Set(applyFields);
    if (next.has(id)) {
      next.delete(id);
      const nextErrors = { ...errors };
      delete nextErrors[id];
      setErrors(nextErrors);
    } else {
      next.add(id);
    }
    setApplyFields(next);
  };

  const handleSave = () => {
    const finalUpdates: Partial<Divergencia> = {};
    const newErrors: Record<string, string> = {};
    let hasError = false;

    applyFields.forEach(fieldId => {
      const field = fields.find(f => f.id === fieldId);
      let val = (updates as any)[fieldId];
      
      if (field?.type === 'number') {
        if (typeof val === 'string') {
          val = val.replace(',', '.');
        }
        if (val === undefined || val === '' || isNaN(Number(val))) {
          newErrors[fieldId] = 'Valor numérico inválido';
          hasError = true;
        }
      }
    });

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    applyFields.forEach(fieldId => {
      const field = fields.find(f => f.id === fieldId);
      const isTax = ['icms', 'ipi', 'pis', 'cofins', 'st'].includes(fieldId);
      
      if (field?.type === 'number') {
        const rawVal = String((updates as any)[fieldId]).replace(',', '.');
        const val = parseFloat(rawVal) || 0;
        if (isTax) {
          if (!finalUpdates.impostos) finalUpdates.impostos = {};
          (finalUpdates.impostos as any)[fieldId] = val;
        } else {
          (finalUpdates as any)[fieldId] = val;
        }
      } else {
        (finalUpdates as any)[fieldId] = (updates as any)[fieldId] || '';
      }
    });

    onSave(finalUpdates);
    onClose();
    setUpdates({});
    setApplyFields(new Set());
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-green/10 rounded-lg">
              <Settings className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-gray-800'}`}>Edição em Massa</h3>
              <p className="text-xs text-gray-500">{selectedCount} itens selecionados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
              <div key={field.id} className={`p-4 rounded-xl border transition-all ${applyFields.has(field.id) ? (darkMode ? 'bg-brand-green/5 border-brand-green' : 'bg-brand-green/5 border-brand-green') : (darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100')}`}>
                <label className="flex items-center gap-3 mb-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={applyFields.has(field.id)}
                    onChange={() => toggleField(field.id)}
                    className="hidden"
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${applyFields.has(field.id) ? 'bg-brand-green border-brand-green' : (darkMode ? 'border-slate-600' : 'border-gray-300')}`}>
                    {applyFields.has(field.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-xs font-bold ${applyFields.has(field.id) ? (darkMode ? 'text-slate-200' : 'text-gray-800') : 'text-gray-500'}`}>{field.label}</span>
                </label>

                {applyFields.has(field.id) && (
                  <div className="space-y-1">
                    {field.type === 'select' ? (
                      <select
                        value={(updates as any)[field.id] || ''}
                        onChange={(e) => setUpdates({ ...updates, [field.id]: e.target.value })}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-brand-green' : 'bg-white border-gray-200 text-gray-700 focus:border-brand-green'}`}
                      >
                        <option value="">Selecione...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={(updates as any)[field.id] || ''}
                        onChange={(e) => setUpdates({ ...updates, [field.id]: e.target.value })}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all resize-none h-20 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-brand-green' : 'bg-white border-gray-200 text-gray-700 focus:border-brand-green'}`}
                        placeholder={`Novo valor para ${field.label}...`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={(updates as any)[field.id] || ''}
                        onChange={(e) => setUpdates({ ...updates, [field.id]: e.target.value })}
                        className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all ${errors[field.id] ? 'border-red-500' : (darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-brand-green' : 'bg-white border-gray-200 text-gray-700 focus:border-brand-green')}`}
                        placeholder={`Novo valor para ${field.label}...`}
                      />
                    )}
                    {errors[field.id] && <p className="text-[10px] text-red-500 font-medium">{errors[field.id]}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 bg-gray-50/50 dark:bg-slate-900/50">
          <button 
            onClick={onClose}
            className={`px-6 py-2 text-xs font-bold rounded-xl transition-all ${darkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={applyFields.size === 0}
            className={`px-8 py-2 rounded-xl font-bold text-white transition-all shadow-lg ${applyFields.size === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-green hover:bg-brand-green/90 shadow-brand-green/20'}`}
          >
            Aplicar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
