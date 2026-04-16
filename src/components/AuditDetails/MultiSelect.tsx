import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  darkMode: boolean;
}

export const MultiSelect = ({ label, options, selected, onChange, darkMode }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o: string) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest outline-none border transition-all min-w-[180px] ${darkMode ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-[#8DC63F] shadow-inner'}`}
      >
        <span className="truncate">
          {selected.length === 0 ? label : `${selected.length} selecionados`}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className={`absolute top-full left-0 mt-2 w-full min-w-[240px] max-h-72 overflow-y-auto z-20 rounded-[1.5rem] border shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="p-2 space-y-1">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-400 font-bold italic">Nenhum item encontrado</div>
              ) : (
                options.map((option: string) => (
                  <div
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold cursor-pointer rounded-xl transition-all ${selected.includes(option) ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]') : (darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-500')}`}
                  >
                    <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-all ${selected.includes(option) ? 'bg-[#8DC63F] border-[#8DC63F] scale-110 shadow-lg shadow-[#8DC63F]/20' : (darkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white')}`}>
                      {selected.includes(option) && <Check className="w-2.5 h-2.5 text-white stroke-[4px]" />}
                    </div>
                    <span className="truncate">{option}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
