import React from 'react';
import { ChevronRight, MessageSquare, FileText, Hash, Copy, Check, HelpCircle, Paperclip, Trash2, ShieldCheck, ShieldAlert, ShieldQuestion, Upload, Sparkles, Cpu, Server, Clock, ArrowUpRight, CheckSquare, XSquare, History, UserCheck, AlertCircle } from 'lucide-react';
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
  showFinancialImpact
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
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <Tooltip content="Clique para copiar o SKU" darkMode={darkMode}>
                <div 
                  className={`text-[9px] font-black px-2 py-0.5 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-all ${darkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  onClick={(e) => copyToClipboard(e, div.material)}
                >
                  {div.material}
                  {copied ? <Check className="w-2.5 h-2.5 text-brand-green" /> : <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </div>
              </Tooltip>
              <div className="font-black truncate text-xs tracking-tight" title={div.descricao}>{div.descricao}</div>
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
          type="precoMedio"
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
          type="valorCKM3"
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
      <div className={`flex items-center justify-end px-2 shrink-0 w-32 h-full text-right font-bold ${variacaoPerc > 0 ? 'text-red-500' : 'text-brand-green'}`}>
        {variacaoPerc.toFixed(2)}%
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
  const variacaoPerc = div.variacaoPerc || 0;
  const impactoFinanceiro = div.impactoFinanceiro || 0;
  const impostos = div.impostos || { icms: 0, ipi: 0, pis: 0, cofins: 0 };
  const totalImpostos = (impostos.icms || 0) + (impostos.ipi || 0) + (impostos.pis || 0) + (impostos.cofins || 0);
  const statusOptions = ['Pendente', 'Em Análise', 'Aguardando Fornecedor', 'Corrigido no SAP', 'Ignorado'];
  
  // Rule actions display
  const appliedRecipes = div.appliedRecipes || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAnexos = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      url: '#', // Mock URL
      type: file.type,
      date: new Date().toISOString()
    }));

    updateDivergencia(div.id, { 
      anexos: [...(div.anexos || []), ...newAnexos] 
    });
  };

  const removeAnexo = (id: string) => {
    updateDivergencia(div.id, { 
      anexos: (div.anexos || []).filter(a => a.id !== id) 
    });
  };

  const handleAIAnalysis = () => {
    const prompt = `Analise a seguinte divergência de auditoria fiscal SAP:
Material: ${div.descricao} (${div.material})
Fornecedor: ${div.fornecedor}
Preço SAP: ${formatoMoeda.format(div.custoPadrao)}
Preço NF: ${formatoMoeda.format(div.precoEfetivo)}
Divergência: ${formatoMoeda.format(div.impactoFinanceiro)} (${div.variacaoPerc.toFixed(2)}%)
CFOP: ${div.cfop}

Explique brevemente por que isso pode ter ocorrido e sugira uma ação.`;
    askAI(prompt);
  };

  const handleRejeitar = () => {
    const motivo = window.prompt('Por favor, informe o motivo da rejeição do ajuste:');
    if (motivo) {
      rejeitarDivergencia(div.id, motivo);
    }
  };

  return (
    <div className={`w-full px-2 py-6 border-l-8 border-brand-green transition-all ${darkMode ? 'bg-slate-800/20' : 'bg-slate-50/50'}`}>
      <div className="mx-14 mb-8">
        <div className={`p-6 rounded-[2rem] border transition-all ${darkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black px-3 py-1 rounded-full bg-brand-green/10 text-brand-green uppercase tracking-widest">
                  SKU: {div.material}
                </span>
                <span className={`text-[10px] uppercase font-black tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {div.tipoMaterial} • {div.origemMaterial}
                </span>
              </div>
              <h3 className="text-lg font-black leading-tight tracking-tight">{div.descricao}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <button
                  onClick={handleAIAnalysis}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  <Sparkles className="w-3 h-3" />
                  ANALISAR COM NATUASSIST
                </button>
                {div.suggestedCause && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border border-dashed ${darkMode ? 'border-blue-500/30 bg-blue-500/5 text-blue-400' : 'border-blue-200 bg-blue-50 text-blue-600'}`}>
                    <Cpu className="w-3 h-3" />
                    CAUSA SUGERIDA: {div.suggestedCause.toUpperCase()}
                  </div>
                )}
                {appliedRecipes.length > 0 && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black border border-dashed ${darkMode ? 'border-brand-green/30 bg-brand-green/5 text-brand-green' : 'border-brand-green/20 bg-brand-green/5 text-brand-green'}`}>
                    <CheckSquare className="w-3 h-3" />
                    REGRAS APLICADAS: {appliedRecipes.length}
                  </div>
                )}
              </div>
              <p className={`text-xs mt-3 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {(div as any)._isGroupRoot ? (
                  <>Este grupo contém <span className="font-black text-brand-green">{(div as any).count}</span> lançamentos individuais agrupados por Material e Descrição.</>
                ) : (
                  <>Este item foi identificado no arquivo <span className="font-black text-brand-green">{div.arquivo}</span> na linha <span className="font-black text-brand-green">{div.linhaNF}</span>.</>
                )}
                <br />
                A auditoria detectou uma variação média de <span className={`font-black ${variacaoPerc > 0 ? 'text-red-500' : 'text-brand-green'}`}>{variacaoPerc.toFixed(2)}%</span> em relação ao custo padrão SAP.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              {showFinancialImpact && (
                <>
                  <div className="group relative text-right">
                    <div className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-400'} flex items-center gap-1 justify-end`}>
                      Impacto Estimado
                      <HelpCircle className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className={`absolute bottom-full right-0 mb-2 w-64 p-3 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50 border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <p className="font-black uppercase mb-1 text-brand-green text-[9px] tracking-widest">Metodologia de Cálculo</p>
                      <p className="font-mono mb-2 text-[11px] font-black">{(div as any)._isGroupRoot ? "Σ [(Preço NF - Custo SAP) × Qtd]" : "(Preço NF - Custo SAP) × Qtd"}</p>
                    </div>
                  </div>
                  <div className={`text-3xl font-black tracking-tighter ${impactoFinanceiro > 0 ? 'text-red-500' : 'text-brand-green'}`}>
                    {formatoMoeda.format(impactoFinanceiro)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-14 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sugestões SAP T-Codes (Suggestion 4) */}
        <div className="space-y-3">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <div className="w-1 h-3 bg-blue-500 rounded-full" />
            Sugestões SAP T-Codes
          </h4>
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-blue-50/50 border-blue-100'}`}>
             <div className="flex items-center gap-2 mb-3">
               <Server className="w-4 h-4 text-blue-500" />
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Resolução SAP</span>
             </div>
             {div.suggestedTCodes && div.suggestedTCodes.length > 0 ? (
               <div className="space-y-2">
                 <div className="flex flex-wrap gap-1.5">
                   {div.suggestedTCodes.map(code => (
                     <span key={code} className={`px-2 py-0.5 rounded text-[10px] font-black ${darkMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-500 text-white shadow-sm shadow-blue-500/20'}`}>
                       {code}
                     </span>
                   ))}
                 </div>
                 <p className={`text-[10px] leading-relaxed font-bold ${darkMode ? 'text-slate-400' : 'text-blue-700'}`}>
                   {div.suggestedTCodeAction || 'Abra as transações acima no SAP GUI para verificar o cadastro ou lançamento.'}
                 </p>
                 <button 
                   className={`w-full flex items-center justify-center gap-2 py-2 mt-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${darkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                   onClick={() => window.alert('Funcionalidade de abertura direta via SAP GUI Protocol pendente de configuração do IT.')}
                 >
                   <ArrowUpRight className="w-3 h-3" />
                   ABRIR NO SAP
                 </button>
               </div>
             ) : (
               <p className="text-[10px] text-slate-400 italic">Nenhuma transação específica sugerida para este caso.</p>
             )}
          </div>
        </div>
        
        <div className="space-y-3">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <div className="w-1 h-3 bg-brand-green rounded-full" />
            Comparativo de Preços
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Preço Unitário NF:</span>
              <span className="font-bold">{formatoMoeda.format(div.precoEfetivo)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Custo Unitário SAP:</span>
              <span className="font-bold">{formatoMoeda.format(div.custoPadrao)}</span>
            </div>
            <div className={`h-px w-full my-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`} />
            <div className="flex justify-between text-xs">
              <span className={darkMode ? 'text-slate-400' : 'text-gray-500'}>Variação Percentual:</span>
              <span className={`font-black ${variacaoPerc > 0 ? 'text-red-500' : 'text-brand-green'}`}>{variacaoPerc.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <div className="w-1 h-3 bg-brand-green rounded-full" />
            Workflow de Resolução
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Status Auditoria</label>
                <select
                  value={div.status || 'Pendente'}
                  onChange={(e) => updateDivergencia(div.id, { status: e.target.value })}
                  className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none transition-all ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-brand-green' : 'bg-white border-gray-200 text-gray-700 focus:border-brand-green'}`}
                >
                  {statusOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Justificativa Fiscal
              </label>
              <textarea
                value={div.comentarios || ''}
                onChange={(e) => updateDivergencia(div.id, { comentarios: e.target.value })}
                placeholder="Descreva o motivo da divergência..."
                className={`w-full px-3 py-2 text-xs rounded-lg border outline-none transition-all resize-none h-24 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-brand-green' : 'bg-white border-gray-200 text-gray-700 focus:border-brand-green'}`}
              />
            </div>
          </div>
        </div>

        {/* Governança 2.0 (Suggestion 2) */}
        <div className="space-y-3">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
            <div className="w-1 h-3 bg-purple-500 rounded-full" />
            Aprovação e Governança
          </h4>
          <div className={`p-5 rounded-2xl border transition-all ${div.aprovacaoStatus === 'Aprovado' ? 'bg-green-500/5 border-green-500/20' : div.aprovacaoStatus === 'Rejeitado' ? 'bg-red-500/5 border-red-500/20' : darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <UserCheck className={`w-4 h-4 ${div.aprovacaoStatus === 'Aprovado' ? 'text-green-500' : div.aprovacaoStatus === 'Rejeitado' ? 'text-red-500' : 'text-slate-400'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {div.aprovacaoStatus || 'Sem Aprovação'}
                    </span>
                 </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={div.aprovacaoStatus === 'Aprovado'}
                  onClick={() => aproveDivergencia(div.id)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${div.aprovacaoStatus === 'Aprovado' ? 'bg-green-500 text-white' : 'bg-brand-green/10 text-brand-green hover:bg-brand-green hover:text-white shadow-sm'}`}
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  APROVAR
                </button>
                <button
                  disabled={div.aprovacaoStatus === 'Rejeitado'}
                  onClick={handleRejeitar}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${div.aprovacaoStatus === 'Rejeitado' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white shadow-sm'}`}
                >
                  <XSquare className="w-3.5 h-3.5" />
                  REJEITAR
                </button>
              </div>

              {div.aprovadoPor && (
                <div className={`mt-2 p-2 rounded-lg text-[9px] font-medium border border-green-500/20 bg-green-500/5 text-green-700`}>
                  <p>Aprovado por: <b>{div.aprovadoPor.nome}</b></p>
                  <p className="opacity-60">{new Date(div.aprovadoPor.data).toLocaleString()}</p>
                </div>
              )}
              {div.rejeitadoPor && (
                <div className={`mt-2 p-2 rounded-lg text-[9px] font-medium border border-red-500/20 bg-red-500/5 text-red-700`}>
                  <p>Rejeitado por: <b>{div.rejeitadoPor.nome}</b></p>
                  <p className="mt-1 font-bold">Motivo: {div.rejeitadoPor.motivo}</p>
                  <p className="opacity-60">{new Date(div.rejeitadoPor.data).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs (Suggestion 2) */}
      <div className="mx-14 mt-8">
         <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-6">
              <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <History className="w-4 h-4 text-brand-green" />
                Logs de Auditoria e Rastreabilidade ({(div.auditLogs || []).length})
              </h4>
            </div>
            
            <div className="space-y-3">
              {(div.auditLogs || []).length === 0 ? (
                <div className="flex flex-col items-center py-6 text-slate-400">
                  <Clock className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma alteração registrada ainda</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
                  {div.auditLogs?.map((log, lIdx) => (
                    <div key={lIdx} className="relative">
                      <div className={`absolute -left-[1.65rem] top-1 w-3 h-3 rounded-full border-2 ${darkMode ? 'bg-slate-900 border-brand-green' : 'bg-white border-brand-green'}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-tight">{log.action}</span>
                            <span className="text-[10px] opacity-40 font-medium">•</span>
                            <span className="text-[10px] opacity-60 font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] font-medium opacity-80">
                            Executado por: <span className="font-bold text-brand-green">{log.user}</span>
                          </p>
                          {log.currentStatus && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase text-slate-400">Status após ação:</span>
                              <StatusBadge status={log.currentStatus} darkMode={darkMode} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Evidence and Attachments Section */}
      <div className="mx-14 mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <Paperclip className="w-4 h-4 text-brand-green" />
              Evidências Anexadas ({(div.anexos || []).length})
            </h4>
            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-all ${darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700' : 'bg-brand-green/10 text-brand-green hover:bg-brand-green/20'}`}>
              <Upload className="w-3 h-3" />
              ANEXAR
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {(div.anexos || []).length === 0 ? (
              <div className={`text-center py-8 border-2 border-dashed rounded-2xl ${darkMode ? 'border-slate-800 text-slate-600' : 'border-slate-50 text-slate-300'}`}>
                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma evidência anexada</p>
              </div>
            ) : (
              div.anexos?.map(anexo => (
                <div key={anexo.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${darkMode ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                      <FileText className="w-4 h-4 text-brand-green" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold truncate" title={anexo.name}>{anexo.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium">{new Date(anexo.date).toLocaleDateString()} • {(anexo.type || 'unknown').split('/')[1]?.toUpperCase()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeAnexo(anexo.id)}
                    className={`p-2 rounded-lg transition-all ${darkMode ? 'hover:bg-red-500/10 text-slate-600 hover:text-red-400' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <h4 className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Impacto nos Impostos
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Créditos</p>
                 <p className="text-sm font-black text-brand-green">{formatoMoeda.format(totalImpostos)}</p>
              </div>
              <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Imposto</p>
                 <p className="text-sm font-black text-slate-600 dark:text-slate-300">
                    {div.precoEfetivo > 0 ? ((totalImpostos / div.precoEfetivo) * 100).toFixed(1) : 0}%
                 </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
               {Object.entries(impostos).map(([key, val]) => (
                 <div key={key} className="flex justify-between items-center text-[10px]">
                    <span className="font-bold uppercase text-slate-500">{key}</span>
                    <span className="font-black">{formatoMoeda.format(val as number || 0)}</span>
                 </div>
               ))}
            </div>
        </div>
      </div>
    </div>
  );
});
