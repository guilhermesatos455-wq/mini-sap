
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
  UserCheck
} from 'lucide-react';
import { aiService, Message } from '../../services/aiService';
import { useAudit } from '../../context/AuditContext';
import { Link } from 'react-router-dom';
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
    logout,
    completeRegistration,
    isAuthReady
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
        const response = await aiService.chat(history);
        clearTimeout(slowLoadingTimer);
        
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

            {/* Messages or Auth */}
            {!isAuthReady ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : !aiUser ? (
              <div className={`flex-1 p-6 flex flex-col justify-center space-y-6 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-3xl bg-blue-500/10 text-blue-500 mb-4">
                    <Shield className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black tracking-tight">Acesso ao NatuAssist</h4>
                  <p className="text-sm text-slate-500 mt-2">Identifique-se com sua conta Google para liberar a IA de Auditoria.</p>
                </div>

                <div className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                    Entrar com Google
                  </button>
                  
                  <p className="text-[10px] text-center text-slate-400 px-4">
                    Ao entrar, você concorda com nossas políticas de segurança e auditoria interna.
                  </p>
                </div>
              </div>
            ) : !aiUser.matricula ? (
              <div className={`flex-1 p-6 flex flex-col justify-center space-y-6 ${darkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-3xl bg-green-500/10 text-green-500 mb-4">
                    <UserCheck className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black tracking-tight">Quase lá, {aiUser.nome.split(' ')[0]}!</h4>
                  <p className="text-sm text-slate-500 mt-2">Para finalizar seu acesso, informe sua matrícula funcional SAP.</p>
                </div>

                <div className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-[10px] font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 block ml-1">Matrícula SAP</label>
                    <input 
                      type="text"
                      value={matriculaInput}
                      onChange={e => setMatriculaInput(e.target.value)}
                      className={`w-full p-4 rounded-2xl text-sm border outline-none transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-500'}`}
                      placeholder="Ex: 123456"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-2">
                    <input 
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="text-[10px] text-slate-500 leading-tight">
                      Confirmo que sou auditor autorizado e concordo com os <Link to="/ai-terms" className="text-blue-500 hover:underline" onClick={() => setIsOpen(false)}>Termos de Serviço</Link>.
                    </label>
                  </div>

                  <button
                    onClick={handleCompleteRegistration}
                    disabled={isLoading}
                    className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : 'Concluir Cadastro'}
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Usar outra conta
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                  <div className="flex justify-center mb-2">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-500/10 text-slate-500 font-bold">
                      Logado como: {aiUser.nome} ({aiUser.matricula})
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
