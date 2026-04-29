import React, { useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import Tooltip from '../Tooltip';

interface EditableCellProps {
  value: any;
  onSave: (value: any) => void;
  type?: 'text' | 'number' | 'currency' | 'date' | 'precoMedio' | 'valorCKM3';
  darkMode: boolean;
  className?: string;
  formatoMoeda: Intl.NumberFormat;
  disabled?: boolean;
}

export const EditableCell = ({ value, onSave, type = 'text', darkMode, className = "", formatoMoeda, disabled = false }: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const formatter = useMemo(() => {
    if (type === 'currency') return formatoMoeda;
    if (type === 'precoMedio') return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    if (type === 'valorCKM3') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    return null;
  }, [type, formatoMoeda]);

  const handleSave = () => {
    if (disabled) return;
    let finalValue = editValue;
    if (type === 'number' || type === 'precoMedio' || type === 'valorCKM3') {
      const rawVal = String(editValue).replace(',', '.').replace(/[^\d.-]/g, '');
      finalValue = parseFloat(rawVal);
      if (isNaN(finalValue)) {
        setError('Inválido');
        return;
      }
    }
    onSave(finalValue);
    setIsEditing(false);
    setError(null);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="relative flex-1">
          <input
            type={type === 'date' ? 'date' : 'text'}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (error) setError(null);
            }}
            className={`w-full px-2 py-1 text-xs rounded border outline-none transition-all ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : (darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-gray-300 text-gray-700')}`}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            onBlur={handleSave}
          />
          {error && (
            <div className="absolute -top-6 left-0 bg-red-500 text-white text-[8px] px-1 rounded shadow-lg animate-bounce">
              {error}
            </div>
          )}
        </div>
        <button onClick={handleSave} className="p-1 text-brand-green hover:bg-brand-green/10 rounded">
          <Check className="w-3 h-3" />
        </button>
        <button onClick={handleCancel} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  const displayValue = useMemo(() => {
    if (formatter) return formatter.format(value || 0);
    if (type === 'date' && value) return new Date(value).toLocaleDateString('pt-BR');
    return value;
  }, [type, value, formatter]);

  return (
    <Tooltip content={disabled ? "Edição desabilitada para este item" : "Clique para editar"} darkMode={darkMode}>
      <div 
        className={`${disabled ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'} px-1 rounded transition-colors ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsEditing(true);
        }}
      >
        {displayValue}
      </div>
    </Tooltip>
  );
};
