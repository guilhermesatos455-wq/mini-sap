import React from 'react';
import { ChevronRight, MessageSquare, FileText, Hash, Copy, Check, HelpCircle, Paperclip, Trash2, ShieldCheck, ShieldAlert, ShieldQuestion, Upload, Sparkles, Cpu, Server, Clock, ArrowUpRight, CheckSquare, XSquare, History, UserCheck, AlertCircle, TrendingUp, Brain, RefreshCw, CheckCircle2, XCircle, FileQuestion, Table, ListChecks } from 'lucide-react';
import { EditableCell } from './EditableCell';
import { StatusBadge } from './StatusBadge';
import { Divergencia, ShowColunas } from '../../types/audit';
import Tooltip from '../Tooltip';

interface AuditTableRowsProps {
  div: Divergencia;
  isExpanded: boolean;
  toggleRow: (id: number | string) => void;
  darkMode: boolean;
  showColunas: ShowColunas;
  updateDivergencia: (id: number | string, data: Partial<Divergencia>) => void;
  formatoMoeda: Intl.NumberFormat;
  isSelected: boolean;
  toggleSelectItem: (id: number | string) => void;
  askAI: (prompt: string) => void;
  aiUser: any;
}

/**
 * Reusable component for text cells with truncation
 */
const TextCell = ({ value, width = 'w-40', className = '' }: { value?: string | number; width?: string; className?: string }) => (
  <div className={`flex items-center px-2 shrink-0 ${width} h-full text-[10px] truncate ${className}`}>
    {value}
  </div>
);

/**
 * Reusable component for monetary values
 */
const MonetaryCell = ({ 
  value, 
  formatoMoeda, 
  width = 'w-32', 
  className = '' 
}: { 
  value: number; 
  formatoMoeda: Intl.NumberFormat; 
  width?: string; 
  className?: string 
}) => (
  <div className={`flex items-center justify-end px-2 shrink-0 ${width} h-full text-right font-medium ${className}`}>
    {formatoMoeda.format(value || 0)}
  </div>
);

export const TableRowMemo = React.memo(({ 
  div, 
  isExpanded, 
  toggleRow, 
  darkMode, 
  showColunas, 
  updateDivergencia, 
  formatoMoeda,
  isSelected,
  toggleSelectItem,
  showFinancialImpact,
  askAI,
  aiUser
}: AuditTableRowsProps & { showFinancialImpact: boolean }) => {
  if (!div) return null;

  const isDivergencia = div && 'impactoFinanceiro' in div;
  const variacaoPerc = div.variacaoPerc || 0;
  const impactoFinanceiro = div.impactoFinanceiro || 0;

  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAIAnalysis = (e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = `Analise a seguinte divergência de auditoria fiscal SAP:
Material: ${div.descricao} (${div.material})
Fornecedor: ${div.fornecedor}
Preço SAP (CKM3): ${formatoMoeda.format(div.custoPadrao)}
Preço Nota Fiscal: ${formatoMoeda.format(div.precoEfetivo)}
Divergência: ${formatoMoeda.format(div.impactoFinanceiro)} (${variacaoPerc.toFixed(2)}%)
CFOP: ${div.cfop}

Identifique possíveis causas (ex: variação cambial, erro de lançamento, tributação) e sugira a melhor tratativa.`;
    askAI(prompt);
  };

  const handleToggleRow = () => toggleRow(div.id);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleRow();
    }
  };

  return (
    <div 
      className={`flex items-center text-xs transition-all group h-14 border-b cursor-pointer ${darkMode ? 'border-slate-800/50' : 'border-slate-100'} ${isSelected ? (darkMode ? 'bg-brand-green/10' : 'bg-brand-green/5') : (darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/50')}`}
      onClick={handleToggleRow}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`Expandir detalhes do material ${div.material}`}
    >
      <div className={`flex items-center justify-center shrink-0 w-10 h-full sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)] transition-colors ${isSelected ? (darkMode ? 'bg-slate-800' : 'bg-brand-light') : (darkMode ? 'bg-slate-900 group-hover:bg-slate-800' : 'bg-white group-hover:bg-slate-50/50')}`}>
        <Tooltip content={isSelected ? "Desmarcar item" : "Selecionar para edição em massa"} darkMode={darkMode} position="right">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              if (isDivergencia) toggleSelectItem(div.id);
            }}
            onClick={(e) => e.stopPropagation()}
            disabled={!isDivergencia}
            aria-label={`Selecionar item ${div.material}`}
            className={`w-4 h-4 rounded-lg border-slate-300 text-brand-green focus:ring-brand-green transition-all ${!isDivergencia ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-110'}`}
          />
        </Tooltip>
      </div>
      <div 
        className={`flex items-center px-4 shrink-0 w-80 h-full sticky left-10 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.03)] transition-colors ${isSelected ? (darkMode ? 'bg-slate-800' : 'bg-brand-light') : (darkMode ? 'bg-slate-900 group-hover:bg-slate-800' : 'bg-white group-hover:bg-slate-50/50')}`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative">
            <Tooltip content={isExpanded ? "Recolher detalhes" : "Expandir detalhes técnicos"} darkMode={darkMode}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleRow();
                }}
                className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
              >
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>
                  <ChevronRight className="w-4 h-4 text-brand-green stroke-[3px]" />
                </div>
              </button>
            </Tooltip>
            {(div as any)._isGroupRoot && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#8DC63F] rounded-full border border-white dark:border-slate-800 shadow-sm animate-pulse" />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <Tooltip content="Clique para copiar o SKU" darkMode={darkMode}>
                <div 
                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-all ${(div as any)._isGroupRoot ? (darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]') : (darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')}`}
                  onClick={(e) => copyToClipboard(e, div.material)}
                >
                  {div.material}
                  {copied ? <Check className="w-2.5 h-2.5 text-brand-green" /> : <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
              </Tooltip>
              <div className="font-black truncate text-xs tracking-tight" title={div.descricao}>{div.descricao}</div>
              <Tooltip content="Análise Instantânea com IA" darkMode={darkMode}>
                <button 
                  onClick={handleAIAnalysis}
                  className={`p-1.5 rounded-lg transition-all transform hover:scale-110 active:scale-95 ${darkMode ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}
                >
                  <Brain className={`w-3.5 h-3.5 ${aiUser && aiUser.id === div.id && 'animate-spin'}`} />
                </button>
              </Tooltip>
              {div.suggestedCause && (
                <Tooltip content={`Sugestão de Causa: ${div.suggestedCause}`} darkMode={darkMode}>
                  <div className="shrink-0 text-blue-500 animate-pulse">
                    <Sparkles className="w-3 h-3" />
                  </div>
                </Tooltip>
              )}
            </div>
            <div className={`text-[10px] font-bold truncate mt-0.5 flex items-center gap-1.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="truncate">{div.tipoMaterial || 'Material'}</span>
              <span className="opacity-30">•</span>
              <span className="truncate">{div.categoriaNF || 'Geral'}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center px-2 shrink-0 w-24 h-full font-medium">
        <EditableCell 
          value={div.cfop} 
          onSave={(val: string) => updateDivergencia(div.id, { cfop: val })} 
          darkMode={darkMode} 
          formatoMoeda={formatoMoeda}
        />
      </div>
      <div className="flex items-center px-2 shrink-0 w-64 h-full text-[10px] font-medium truncate gap-2">
        <EditableCell 
          value={div.fornecedor} 
          onSave={(val: string) => updateDivergencia(div.id, { fornecedor: val })} 
          darkMode={darkMode} 
          formatoMoeda={formatoMoeda}
        />
        {div.taxCompliance && !div.taxCompliance.isCompliant && (
          <Tooltip content={div.taxCompliance.message || "Divergência de ICMS-ST"} darkMode={darkMode}>
            <div className={`p-1 rounded-full ${darkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
              <ShieldAlert className="w-3 h-3" />
            </div>
          </Tooltip>
        )}
      </div>
      
      {showColunas.empresa && <TextCell value={div.empresa} width="w-48" />}
      {showColunas.numeroNF && <TextCell value={div.numeroNF} width="w-32" />}
      {showColunas.tipoMaterial && <TextCell value={div.tipoMaterial} width="w-40" />}
      {showColunas.categoriaNF && <TextCell value={div.categoriaNF} width="w-40" />}
      {showColunas.origemMaterial && <TextCell value={div.origemMaterial} width="w-40" />}
      {showColunas.dataLancamento && <TextCell value={div.dataLancamento} width="w-32" />}
      
      {showColunas.precoSemFrete && <MonetaryCell value={div.precoSemFrete} formatoMoeda={formatoMoeda} />}
      {showColunas.precoComFrete && <MonetaryCell value={div.precoComFrete || 0} formatoMoeda={formatoMoeda} />}
      {showColunas.valorLiqSemFrete && <MonetaryCell value={div.valorLiqSemFrete || 0} formatoMoeda={formatoMoeda} />}
      {showColunas.valorLiqComFrete && <MonetaryCell value={div.valorLiqComFrete || 0} formatoMoeda={formatoMoeda} />}
      {showColunas.valorTotalSemFrete && <MonetaryCell value={div.valorTotalSemFrete || 0} formatoMoeda={formatoMoeda} />}
      {showColunas.valorTotalComFrete && <MonetaryCell value={div.valorTotalComFrete || 0} formatoMoeda={formatoMoeda} />}

      <div className="flex items-center justify-end px-2 shrink-0 w-24 h-full font-medium">
        <EditableCell 
          value={div.quantidade || 0} 
          onSave={(val: number) => updateDivergencia(div.id, { quantidade: val })} 
          type="number"
          darkMode={darkMode} 
          className="justify-end"
          formatoMoeda={formatoMoeda}
          disabled={!!(div as any)._isGroupRoot}
        />
        {(div as any)._isGroupRoot && (
           <div className={`ml-1 px-1 rounded text-[8px] font-bold uppercase shrink-0 ${darkMode ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-green/10 text-brand-green'}`}>
             Total
           </div>
        )}
      </div>
      <div className="flex items-center justify-end px-2 shrink-0 w-32 h-full text-right font-medium">
        <EditableCell 
          value={div.precoEfetivo} 
          onSave={(val: number) => updateDivergencia(div.id, { precoEfetivo: val })} 
          type="number"
          darkMode={darkMode} 
          className="justify-end"
          formatoMoeda={formatoMoeda}
          disabled={!!(div as any)._isGroupRoot}
        />
        {(div as any)._isGroupRoot && (
           <div className={`ml-1 px-1 rounded text-[8px] font-bold uppercase shrink-0 ${darkMode ? 'bg-slate-500/20 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
             Médio
           </div>
        )}
      </div>
      <div className="flex items-center justify-end px-2 shrink-0 w-32 h-full text-right font-medium">
        <EditableCell 
          value={(div as any)._isGroupRoot ? (div as any).custoTotalRealCKM3 : div.custoPadrao} 
          onSave={(val: number) => updateDivergencia(div.id, { custoPadrao: val })} 
          type="number"
          darkMode={darkMode} 
          className={`justify-end ${(div as any)._isGroupRoot ? 'font-black text-[#8DC63F]' : ''}`}
          formatoMoeda={formatoMoeda}
          disabled={!!(div as any)._isGroupRoot}
        />
        {(div as any)._isGroupRoot && (
           <div className={`ml-1 px-1 rounded text-[8px] font-bold uppercase shrink-0 ${darkMode ? 'bg-[#8DC63F]/20 text-[#8DC63F]' : 'bg-[#8DC63F]/10 text-[#78AF32]'}`}>
             Soma
           </div>
        )}
      </div>
      <div className={`flex items-center justify-end px-4 shrink-0 w-32 h-full text-right font-bold transition-all relative ${variacaoPerc > 0 ? 'text-red-500' : 'text-brand-green'}`}>
        <div 
          className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20" 
          style={{ 
            backgroundColor: variacaoPerc > 0 ? 'rgb(239, 68, 68)' : 'rgb(141, 198, 63)',
            width: `${Math.min(Math.abs(variacaoPerc) * 2, 100)}%`,
            left: 'auto',
            right: 0
          }} 
        />
        <div className="flex flex-col items-end z-10">
          <span className="text-xs">{variacaoPerc.toFixed(2)}%</span>
          <div className={`w-12 h-0.5 rounded-full overflow-hidden ${darkMode ? 'bg-white/10' : 'bg-black/5'}`}>
            <div 
              className={`h-full transition-all duration-700 ${variacaoPerc > 0 ? 'bg-red-500' : 'bg-brand-green'}`}
              style={{ width: `${Math.min(Math.abs(variacaoPerc), 100)}%` }}
            />
          </div>
        </div>
      </div>
      {showFinancialImpact && (
        <div className={`flex items-center justify-end px-2 shrink-0 w-32 h-full text-right font-bold ${impactoFinanceiro > 0 ? 'text-red-500' : 'text-brand-green'}`}>
          {formatoMoeda.format(impactoFinanceiro)}
        </div>
      )}
      <div className="flex items-center justify-center px-2 shrink-0 w-24 h-full relative">
        <Tooltip content={div.comentarios || (div.suggestedComment ? `Sugestão: ${div.suggestedComment}` : "Adicionar nota ou evidência")} darkMode={darkMode}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRow(div.id);
            }}
            className={`p-1.5 rounded-lg transition-all ${div.comentarios ? (darkMode ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-green/10 text-brand-green') : (darkMode ? 'text-slate-600 hover:text-slate-400' : 'text-gray-300 hover:text-gray-500')}`}
            aria-label={div.comentarios ? "Ver comentários" : "Adicionar comentário"}
          >
            <MessageSquare className={`w-4 h-4 ${div.comentarios ? 'animate-pulse' : ''}`} />
          </button>
        </Tooltip>
        {div.suggestedComment && !div.comentarios && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        )}
      </div>
      <div className="flex items-center justify-center px-2 shrink-0 w-24 h-full relative">
        <StatusBadge status={div.status || 'Pendente'} darkMode={darkMode} />
        {div.suggestedStatus && div.status === 'Pendente' && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
        )}
      </div>
      <div className="flex items-center justify-center px-2 shrink-0 w-24 h-full">
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${div.tipo === 'acima do custo padrão' ? (darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600') : (darkMode ? 'bg-brand-green/10 text-brand-green' : 'bg-green-50 text-green-600')}`}>
          {div.tipo === 'acima do custo padrão' ? 'ACIMA' : 'ABAIXO'}
        </span>
      </div>
    </div>
  );
});

interface ExpandedRowProps {
  div: Divergencia;
  darkMode: boolean;
  updateDivergencia: (id: number | string, data: Partial<Divergencia>) => void;
  aproveDivergencia: (id: number | string) => void;
  rejeitarDivergencia: (id: number | string, motivo: string) => void;
  formatoMoeda: Intl.NumberFormat;
  showFinancialImpact: boolean;
  askAI: (prompt: string) => void;
  aiUser: any;
}

export const ExpandedRowMemo = React.memo(({ 
  div, 
  darkMode, 
  updateDivergencia, 
  aproveDivergencia,
  rejeitarDivergencia,
  formatoMoeda, 
  showFinancialImpact, 
  askAI,
  aiUser
}: ExpandedRowProps) => {
  if (!div) return null;
  const isGroup = !!(div as any)._isGroupRoot;
  const children = (div as any).children || [];
  const variacaoPerc = div.variacaoPerc || 0;
  const impactoFinanceiro = div.impactoFinanceiro || 0;
  const impostos = div.impostos || { icms: 0, ipi: 0, pis: 0, cofins: 0 };
  const totalImpostos = (impostos.icms || 0) + (impostos.ipi || 0) + (impostos.pis || 0) + (impostos.cofins || 0);
  const statusOptions = ['Pendente', 'Em Análise', 'Aguardando Fornecedor', 'Corrigido no SAP', 'Ignorado'];
  const appliedRecipes = div.appliedRecipes || [];

  const handleAIAnalysis = () => {
    const prompt = `Analise a seguinte divergência de auditoria fiscal SAP:
Material: ${div.descricao} (${div.material})
Fornecedor: ${div.fornecedor}
Preço SAP (CKM3): ${formatoMoeda.format(div.custoPadrao)}
Preço Nota Fiscal: ${formatoMoeda.format(div.precoEfetivo)}
Divergência: ${formatoMoeda.format(div.impactoFinanceiro)} (${variacaoPerc.toFixed(2)}%)
CFOP: ${div.cfop}

Identifique possíveis causas (ex: variação cambial, erro de lançamento, tributação) e sugira a melhor tratativa.`;
    askAI(prompt);
  };

  const handleRejeitar = () => {
    const motivo = window.prompt('Por favor, informe o motivo da rejeição do ajuste:');
    if (motivo) {
      rejeitarDivergencia(div.id, motivo);
    }
  };

  return (
    <div className={`p-8 animate-in fade-in slide-in-from-top-2 duration-300 border-x border-b ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CARD 1: COMPARATIVO TÉCNICO (BENTO 4 COL) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`p-6 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:-translate-y-1 duration-500 flex flex-col h-full ${darkMode ? 'bg-slate-800/40 border-slate-700 shadow-xl' : 'bg-white border-white shadow-xl shadow-slate-200/40'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className={`p-3 rounded-2xl ${darkMode ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-green/10 text-brand-green'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Análise de Variação</h4>
                <p className="text-sm font-bold opacity-80">SAP vs Nota Fiscal</p>
              </div>
            </div>
            
            <div className="space-y-8 flex-1">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço Efetivo (NF)</span>
                  <span className="text-base font-black">{formatoMoeda.format(div.precoEfetivo)}</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                   <div 
                    className="h-full bg-brand-green shadow-[0_0_10px_rgba(141,198,63,0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min((div.precoEfetivo / (div.custoPadrao || div.precoEfetivo)) * 50, 100)}%` }} 
                   />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Real (CKM3)</span>
                  <span className="text-base font-black text-slate-400">{formatoMoeda.format(div.custoPadrao)}</span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                   <div 
                    className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                    style={{ width: `${Math.min((div.custoPadrao / (div.precoEfetivo || div.custoPadrao)) * 50, 100)}%` }} 
                   />
                </div>
              </div>

              <div className={`mt-10 p-6 rounded-3xl border flex items-center justify-between ${variacaoPerc > 0 ? (darkMode ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-100') : (darkMode ? 'bg-brand-green/10 border-brand-green/20' : 'bg-brand-green/5 border-brand-green/10')}`}>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${variacaoPerc > 0 ? 'text-red-500' : 'text-brand-green'}`}>Delta Global</p>
                  <p className="text-2xl font-black tracking-tighter">{variacaoPerc.toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Total</p>
                  <p className={`text-xl font-black italic ${impactoFinanceiro > 0 ? 'text-red-500' : 'text-brand-green'}`}>{formatoMoeda.format(impactoFinanceiro)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: AI ANALYST (BENTO 4 COL) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`p-6 rounded-[2.5rem] border h-full transition-all hover:shadow-2xl duration-500 flex flex-col ${darkMode ? 'bg-[#8DC63F]/5 border-[#8DC63F]/10 shadow-xl shadow-[#8DC63F]/5' : 'bg-white border-white shadow-xl shadow-slate-200/40'}`}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-500'}`}>
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Analista Assistente AI</h4>
                  <p className="text-sm font-bold opacity-80">Insights e Sugestões</p>
                </div>
              </div>
              <button 
                onClick={handleAIAnalysis}
                className="p-2.5 rounded-2xl bg-brand-green text-white hover:scale-110 active:scale-95 transition-all shadow-lg shadow-brand-green/30"
                title="Refazer análise AI"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6">
              <div className={`p-5 rounded-3xl border text-sm leading-relaxed min-h-[160px] relative overflow-hidden group/ai ${darkMode ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600 italic'}`}>
                {div.suggestedCause ? (
                  <div className="space-y-4 relative z-10">
                    <p className="font-black text-[#8DC63F] text-[10px] uppercase tracking-widest">Causa Identificada:</p>
                    <p className="text-base font-medium leading-normal">{div.suggestedCause}</p>
                    <div className="pt-4 border-t border-slate-700/50">
                      <p className="text-[10px] font-black uppercase text-[#8DC63F] mb-1 tracking-widest text-opacity-60">Plano de Ação Sugerido:</p>
                      <p className="text-sm font-black">{div.suggestedAction}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-30 py-8">
                    <Sparkles className="w-8 h-8 mb-3" />
                    <p className="text-xs font-black uppercase tracking-widest">Clique para processar análise</p>
                  </div>
                )}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <Sparkles className="w-32 h-32" />
                </div>
              </div>

              {div.suggestedTCodes && div.suggestedTCodes.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transações SAP Recomendadas</p>
                  <div className="flex flex-wrap gap-2">
                    {div.suggestedTCodes.map(tcode => (
                      <div key={tcode} className={`group/tc px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${darkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:border-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-200 hover:shadow-md'}`}>
                        <span className="opacity-40">/</span>
                        {tcode}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/tc:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CARD 3: WORKFLOW & GOVERNANCE (BENTO 4 COL) */}
        <div className="lg:col-span-4 space-y-4">
          <div className={`p-6 rounded-[2.5rem] border transition-all hover:shadow-2xl duration-500 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-white shadow-xl shadow-slate-200/40'}`}>
            <div className="flex items-center gap-3 mb-8">
              <div className={`p-3 rounded-2xl ${darkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Governança Fiscal</h4>
                <p className="text-sm font-bold opacity-80">Aprovações e Auditoria</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => aproveDivergencia(div.id)}
                  disabled={div.aprovacaoStatus === 'Aprovado'}
                  className={`flex items-center justify-center gap-3 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${div.aprovacaoStatus === 'Aprovado' ? 'bg-brand-green text-white cursor-not-allowed shadow-inner opacity-60' : (darkMode ? 'bg-slate-800 text-brand-green border border-brand-green/20 hover:bg-brand-green hover:text-white hover:shadow-lg hover:shadow-brand-green/20' : 'bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white shadow-md active:scale-95')}`}
                >
                  <CheckCircle2 className="w-5 h-5 font-bold" />
                  Aprovar
                </button>
                <button 
                  onClick={handleRejeitar}
                  disabled={div.aprovacaoStatus === 'Rejeitado'}
                  className={`flex items-center justify-center gap-3 px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all ${div.aprovacaoStatus === 'Rejeitado' ? 'bg-red-500 text-white cursor-not-allowed opacity-60' : (darkMode ? 'bg-slate-800 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-md active:scale-95')}`}
                >
                  <XCircle className="w-5 h-5 font-bold" />
                  Rejeitar
                </button>
              </div>

              <div className="relative pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Status da Tratativa</p>
                <div className="flex gap-2 p-1.5 rounded-[1.5rem] bg-black/5 dark:bg-white/5 border border-black/5 group-hover:border-black/10 transition-all">
                  {statusOptions.map(status => (
                    <button
                      key={status}
                      onClick={() => updateDivergencia(div.id, { status: status as any })}
                      className={`flex-1 px-1 py-2.5 rounded-2xl text-[8px] font-black uppercase transition-all duration-300 ${div.status === status ? (darkMode ? 'bg-slate-700 text-[#8DC63F] shadow-lg scale-[1.03]' : 'bg-white text-[#78AF32] shadow-md scale-[1.03]') : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50')}`}
                    >
                      {status.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-5 rounded-3xl border transition-colors max-h-[180px] overflow-hidden flex flex-col ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <h5 className={`text-[9px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                  <History className="w-3.5 h-3.5" />
                  Logs de Rastreabilidade
                </h5>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {(div.auditLogs || []).length > 0 ? (
                    div.auditLogs?.map((log, idx) => (
                      <div key={idx} className="flex gap-3 border-l-2 border-[#8DC63F]/30 pl-4 py-0.5">
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight leading-none mb-1">{log.action}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-brand-green">{log.user}</span>
                            <span className="text-[8px] opacity-40 font-mono italic">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[9px] text-center py-6 italic opacity-20 font-bold uppercase tracking-widest">Aguardando Lançamentos</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER BENTO Grid: NOTES & ATTACHMENTS */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        
        {/* NOTES PANEL (8 COL) */}
        <div className="md:col-span-8 group/notes">
          <div className={`p-8 rounded-[2.5rem] border transition-all h-full hover:shadow-2xl duration-500 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-white shadow-xl shadow-slate-200/40'}`}>
            <h4 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <MessageSquare className="w-5 h-5 text-brand-green" />
              Justificativa Técnica & Notas de Auditoria
            </h4>
            <div className="relative">
              <textarea
                className={`w-full p-6 rounded-[2rem] text-sm font-bold resize-none min-h-[140px] outline-none transition-all duration-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 focus:border-[#8DC63F] focus:bg-slate-900 focus:shadow-2xl focus:shadow-brand-green/5' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-brand-green focus:bg-white focus:shadow-2xl focus:shadow-brand-green/10'}`}
                placeholder="Insira as observações sobre a divergência identificada..."
                value={div.comentarios || ''}
                onChange={(e) => updateDivergencia(div.id, { comentarios: e.target.value })}
              />
              <div className="absolute bottom-4 right-6 flex items-center gap-2 opacity-30 text-[10px] font-black uppercase tracking-widest group-hover/notes:opacity-60 transition-opacity">
                <Clock className="w-3 h-3" />
                Auto-salvamento ativo
              </div>
            </div>
          </div>
        </div>

        {/* ATTACHMENTS PANEL (4 COL) */}
        <div className="md:col-span-4">
          <div className={`p-8 rounded-[2.5rem] border transition-all h-full hover:shadow-2xl duration-500 ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-white shadow-xl shadow-slate-200/40'}`}>
            <div className="flex items-center justify-between mb-8">
              <h4 className={`text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <Paperclip className="w-5 h-5 text-brand-green" />
                Anexos
              </h4>
              <label className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 ${darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700 shadow-lg' : 'bg-brand-green text-white hover:bg-brand-green/90 shadow-lg shadow-brand-green/30'}`}>
                UPLOAD
                <input type="file" className="hidden" multiple onChange={(e) => {
                  const files = e.target.files;
                  if (!files) return;
                  const newAnexos = Array.from(files).map(f => ({
                    id: Math.random().toString(36).substr(2, 9),
                    name: f.name,
                    url: '#',
                    type: f.type,
                    date: new Date().toISOString()
                  }));
                  updateDivergencia(div.id, { anexos: [...(div.anexos || []), ...newAnexos] });
                }} />
              </label>
            </div>
            
            <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
              {(div.anexos || []).length > 0 ? (
                div.anexos?.map(anexo => (
                  <div key={anexo.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all translate-x-0 hover:translate-x-1 ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:shadow-md'}`}>
                    <div className="flex items-center gap-3">
                      <FileText className={`w-5 h-5 ${darkMode ? 'text-brand-green' : 'text-brand-green'}`} />
                      <div>
                        <span className="text-xs font-black truncate max-w-[140px] block">{anexo.name}</span>
                        <span className="text-[9px] opacity-40 font-bold uppercase">{anexo.type.split('/')[1] || 'DOC'}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateDivergencia(div.id, { anexos: (div.anexos || []).filter(a => a.id !== anexo.id) })} 
                      className={`p-2 rounded-xl transition-all ${darkMode ? 'text-red-500 hover:bg-red-500/20' : 'text-red-300 hover:text-red-500 hover:bg-red-50'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className={`text-center py-12 border-2 border-dashed rounded-[2rem] transition-colors ${darkMode ? 'border-slate-800 text-slate-700' : 'border-slate-100 text-slate-300'}`}>
                  <FileQuestion className="w-10 h-10 mb-3 mx-auto opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma Evidência</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isGroup && children.length > 0 && (
        <div className="max-w-[1500px] mx-auto mt-8 relative">
          <div className={`p-8 rounded-[3rem] border shadow-2xl overflow-hidden relative ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-100'}`}>
            <div className={`absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none ${darkMode ? 'text-white' : 'text-black'}`}>
               <Table className="w-64 h-64" />
            </div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-brand-green/20 text-brand-green' : 'bg-brand-green/10 text-[#78AF32]'}`}>
                  <ListChecks className="w-8 h-8" />
                </div>
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-[0.3em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>NFs Individuais no Bloco</h4>
                  <p className="text-xl font-black italic opacity-90">Detalhamento por Nota Fiscal</p>
                </div>
              </div>
              
              <div className={`px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                {children.length} Encontros de Divergência
              </div>
            </div>

            <div className="overflow-x-auto relative z-10 scrollbar-hide">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>
                    <th className="pb-4 px-4">Nota Fiscal</th>
                    <th className="pb-4 px-4">Empresa</th>
                    <th className="pb-4 px-4">Fornecedor</th>
                    <th className="pb-4 px-4">Data</th>
                    <th className="pb-4 px-4 text-right">Quantidade</th>
                    <th className="pb-4 px-4 text-right">V. Unit. NF</th>
                    <th className="pb-4 px-4 text-right">V. Real SAP</th>
                    <th className="pb-4 px-4 text-right">Variação %</th>
                    <th className="pb-4 px-4 text-right">Impacto</th>
                    <th className="pb-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-gray-50'}`}>
                  {children.map((child: Divergencia) => (
                    <tr key={child.id} className={`group/item transition-colors ${darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50/50'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                           <FileText className="w-3.5 h-3.5 text-brand-green opacity-40" />
                           <span className="font-mono text-[11px] font-black">{child.numeroNF}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[10px] font-bold uppercase opacity-60 tracking-tighter">{child.empresa}</td>
                      <td className="py-4 px-4">
                        <div className="text-[10px] font-black truncate max-w-[140px]" title={child.fornecedor}>{child.fornecedor}</div>
                      </td>
                      <td className="py-4 px-4 text-[11px] font-mono opacity-50">{child.data ? new Date(child.data).toLocaleDateString('pt-BR') : '-'}</td>
                      <td className="py-4 px-4 text-right font-black text-[11px] font-mono">{child.quantidade}</td>
                      <td className="py-4 px-4 text-right font-black text-[11px] font-mono">{formatoMoeda.format(child.precoEfetivo)}</td>
                      <td className="py-4 px-4 text-right font-black text-[11px] font-mono opacity-50">{formatoMoeda.format(child.custoPadrao)}</td>
                      <td className="py-4 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${child.variacaoPerc > 0 ? 'bg-red-500/10 text-red-500' : 'bg-brand-green/10 text-brand-green'}`}>
                          {child.variacaoPerc.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-black text-[11px] font-mono italic">
                        {formatoMoeda.format(child.impactoFinanceiro)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                           <StatusBadge status={child.status || 'Pendente'} darkMode={darkMode} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
