import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, X, Loader2, Download } from 'lucide-react';
import { ChatErrorBoundary } from './ChatErrorBoundary';
import { useAudit } from '../context/AuditContext';
import { Message } from '../../services/aiService';

interface NatuAssistChatProps {
  onClose: () => void;
}

export const NatuAssistChat: React.FC<NatuAssistChatProps> = ({ onClose }) => {
  const { ai, darkMode, resultado, movements, initialStockPositions, finalStockPositions, recipes, historico, cfops, dataInicio, dataFim } = useAudit();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o NatuAssist, seu assistente de auditoria inteligente. Como posso ajudar você hoje com os dados auditados, movimentações ou estoques?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const auditContext = useMemo(() => {
      if (!resultado) return "Nenhum dado auditado principal disponível.";
      
      const summary = [
          `Dados Auditados: ${resultado.divergencias?.length || 0} divergências encontradas.`,
          `Valor total de impacto: ${resultado.totalImpacto || 0}.`,
          `Configurações atuais: CFOPs: ${cfops}, Período: ${dataInicio} a ${dataFim}.`,
          `Receitas de auditoria ativas: ${recipes.length}.`,
          `Movimentações de material cadastradas: ${movements.length}.`,
          `Posições de estoque inicial: ${initialStockPositions.length}, final: ${finalStockPositions.length}.`,
          `Tamanho do histórico de ações: ${historico.length}.`
      ];
      
      return `Você é o NatuAssist, um especialista em auditoria SAP. Aqui está o resumo atual do sistema: ${summary.join(' ')}. Use esses dados para responder perguntas sobre o estado atual, as divergências encontradas nas notas fiscais, movimentações de estoque e configurações de auditoria. SEMPRE estruture suas respostas utilizando os prefixos [RISCO], [SUGESTÃO] e [DADOS] quando aplicável.`;
  }, [resultado, movements, initialStockPositions, finalStockPositions, recipes, historico, cfops, dataInicio, dataFim]);

  const exportChat = () => {
    const text = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-natuassist-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    const systemMessage: Message = { role: 'system', content: `Você é o NatuAssist, um especialista em auditoria SAP. ${auditContext}` };
    
    // Filtramos mensagens antigas para não duplicar system prompt
    const cleanMessages = messages.filter(m => m.role !== 'system');
    const newMessagesForAI = [systemMessage, ...cleanMessages, userMessage];
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
        const response = await ai.chat(newMessagesForAI);
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, não consegui processar sua solicitação.' }]);
    } finally {
        setLoading(false);
    }
  };

  const suggestions = ["Resumir divergências", "Impacto financeiro", "Analisar estoques"];

  return (
    <ChatErrorBoundary>
        <div className={`fixed bottom-6 right-6 z-[60] w-96 max-w-[90vw] h-[550px] flex flex-col rounded-2xl shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <h3 className="flex items-center gap-2 font-bold text-[#8DC63F]">
                    <Bot className="w-5 h-5"/> NatuAssist
                </h3>
                <div className="flex items-center gap-1">
                    <button onClick={exportChat} className="p-1 hover:bg-slate-800 rounded-lg"><Download className="w-4 h-4" /></button>
                    <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${m.role === 'user' ? 'bg-[#8DC63F] text-white' : (darkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-800')}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-[#8DC63F]"><Loader2 className="animate-spin w-5 h-5"/></div>}
                <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                <div className="flex flex-wrap gap-2 mb-3">
                    {suggestions.map(s => (
                        <button key={s} onClick={() => handleSend(s)} className={`text-xs px-3 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {s}
                        </button>
                    )) }
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        className={`flex-1 p-3 rounded-xl text-sm border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'border-gray-200'}`}
                        placeholder="Pergunte ao NatuAssist..."
                    />
                    <button onClick={() => handleSend()} className="p-3 bg-[#8DC63F] text-white rounded-xl hover:bg-[#78AF32]"><Send className="w-5 h-5"/></button>
                </div>
            </div>
        </div>
    </ChatErrorBoundary>
  );
};
