
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Settings, 
  Maximize2, 
  Minimize2,
  Trash2,
  AlertCircle,
  Shield,
  LogIn,
  LogOut,
  UserCheck,
  Info,
  BadgeCheck,
  ArrowLeft
} from 'lucide-react';
import { aiService, Message } from '../../services/aiService';
import { useAudit } from '../../context/AuditContext';
import { Link } from 'react-router-dom';
import Tooltip from '../Tooltip';
import bcrypt from 'bcryptjs';

const AIAssistant: React.FC = () => {
  const { 
    darkMode, 
    branding, 
    aiMessages: messages, 
    setAiMessages: setMessages,
    isAIOpen: isOpen,
    setIsAIOpen: setIsOpen,
    aiUser,
    setAiUser,
    loginWithGoogle,
    loginWithMicrosoft,
    logout,
    completeRegistration,
    isAuthReady,
    logAIInteraction,
    resultado
  } = useAudit();
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matriculaInput, setMatriculaInput] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle auto-response when a new user message is added externally (via askAI)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user' && !isLoading) {
      processAIResponse([...messages]);
    }
  }, [messages]);

  const processAIResponse = async (history: Message[]) => {
    setIsLoading(true);
    setError(null);
    
    // Injetar contexto da sessão de auditoria se houver resultado
    let contextualHistory = [...history];
    
    if (resultado && resultado.divergencias && resultado.divergencias.length > 0) {
      const summary = `
        CONTEXTO DA SESSÃO ATUAL:
        - Divergências Encontradas: ${resultado.qtdDiv}
        - Total Prejuízo (Acima do Custo): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.totalPrejuizo)}
        - Total Economia (Abaixo do Custo): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultado.totalEconomia)}
        - Materiais Não Encontrados no CKM3: ${resultado.qtdAusentes}
        - Top 3 Divergências por Impacto:
          ${resultado.divergencias.slice(0, 3).map((d: any) => `1. ${d.descricao} (${d.material}): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.impactoFinanceiro)} - Variação: ${d.variacaoPerc.toFixed(2)}%`).join('\n')}
      `;
      
      const systemMessage: Message = { 
        role: 'system', 
        content: `Você está auxiliando o auditor da Natulab. Use o seguinte resumo da sessão atual para responder perguntas se necessário: ${summary}` 
      };
      
      // Inserir mensagem de sistema no início para dar contexto
      contextualHistory = [systemMessage, ...history];
    }

    // Timer para avisar sobre lentidão se demorar mais de 5 segundos
    const slowLoadingTimer = setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'O modelo está demorando um pouco para carregar (isso pode ocorrer se o pendrive estiver sendo acessado). Por favor, aguarde...' 
      }]);
    }, 5000);

    try {
      try {
        // stream: false é o padrão quando não passamos o callback de stream
        const response = await aiService.chat(contextualHistory);
        clearTimeout(slowLoadingTimer);
        
        // Log the interaction
        logAIInteraction(history[history.length - 1].content, response);

        // Remove a mensagem de "aviso de lentidão" se ela foi adicionada
        setMessages(prev => {
          const filtered = prev.filter(m => !m.content.includes('O modelo está demorando um pouco para carregar'));
          return [...filtered, { role: 'assistant', content: response }];
        });
      } catch (err) {
        clearTimeout(slowLoadingTimer);
        console.warn('AI Service not available.');
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '⚠️ Não foi possível conectar ao Llamafile. Certifique-se que o pendrive está conectado e o servidor está rodando em http://localhost:8080!' 
        }]);
      }
    } catch (err) {
      setError('Erro ao processar mensagem.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    // processAIResponse will be triggered by the useEffect above
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat limpo. Como posso ajudar?' }]);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Erro ao realizar login com Google.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithMicrosoft();
    } catch (err) {
      setError('Erro ao realizar login corporativo (Office 365).');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!matriculaInput.trim()) {
      setError('Por favor, informe sua matrícula.');
      return;
    }
    if (!acceptedTerms) {
      setError('Você precisa aceitar os termos.');
      return;
    }

    setIsLoading(true);
    try {
      const success = await completeRegistration(matriculaInput);
      if (!success) {
        setError('Erro ao salvar matrícula.');
      }
    } catch (err) {
      setError('Erro no servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="fixed bottom-20 right-6 z-[100] md:bottom-6">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`
              absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[500px] 
              rounded-2xl shadow-2xl flex flex-col overflow-hidden border
              ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}
            `}
          >
            {/* Header */}
            <div 
              className="p-4 flex items-center justify-between border-b"
              style={{ backgroundColor: branding.primaryColor + '10', borderColor: branding.primaryColor + '30' }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>NatuAssist</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Local Llama 8B</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={clearChat}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  title="Limpar chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content (Bypassing Auth requirement for now) */}
            {!isAuthReady ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                  <div className="flex justify-center mb-2">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-500/10 text-slate-500 font-bold">
                      {aiUser ? `Logado como: ${aiUser.nome} (${aiUser.matricula || 'Pendente'})` : 'Modo de Acesso Livre (NatuAssist)'}
                    </span>
                  </div>
                  {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] p-3 rounded-2xl text-sm
                    ${msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : (darkMode ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none')
                    }
                  `}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`p-3 rounded-2xl rounded-tl-none text-sm flex gap-1 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-400 border border-gray-100'}`}>
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-100">.</span>
                    <span className="animate-bounce delay-200">.</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 text-red-500 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className={`p-4 border-t ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                  <div className="relative">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Pergunte sobre auditoria ou SAP..."
                      className={`
                        w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all
                        ${darkMode 
                          ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' 
                          : 'bg-gray-100 border-gray-200 text-gray-900 focus:border-blue-500 focus:bg-white'
                        }
                        border
                      `}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={`
                        absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all
                        ${!input.trim() || isLoading 
                          ? 'text-gray-400' 
                          : 'text-white hover:scale-110'
                        }
                      `}
                      style={{ backgroundColor: input.trim() && !isLoading ? branding.primaryColor : 'transparent' }}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-[10px] text-gray-500">
                      Respostas geradas pelo NatuAssist local.
                    </p>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleLogout}
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline"
                      >
                        Sair
                      </button>
                      <Link 
                        to="/ai-terms" 
                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        Termos e LGPD
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        className={`
          p-4 rounded-full shadow-2xl flex items-center justify-center relative group
          ${isOpen && !isMinimized ? 'hidden' : ''}
        `}
        style={{ backgroundColor: branding.primaryColor }}
      >
        <Bot className="w-7 h-7 text-white" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white animate-pulse" />
        
        {/* Tooltip */}
        <div className="absolute right-full mr-4 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          NatuAssist Ativo
        </div>
      </motion.button>

      {/* Minimized Bar */}
      {isOpen && isMinimized && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setIsMinimized(false)}
          className={`
            px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border
            ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}
          `}
        >
          <Bot className="w-4 h-4 text-blue-500" />
          <span className="text-xs font-bold">Assistente Minimizado</span>
          <Maximize2 className="w-3 h-3 text-gray-500" />
        </motion.button>
      )}
    </div>
  );
};

export default AIAssistant;
