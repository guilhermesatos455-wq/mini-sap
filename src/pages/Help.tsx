import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  FileUp, 
  Settings, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  MessageSquare,
  ExternalLink,
  Code,
  Terminal,
  Search,
  ChevronRight,
  Zap,
  Cpu,
  Layers,
  Info,
  ShieldCheck
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const HelpPage: React.FC = () => {
  const { darkMode } = useAudit();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Todos', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'getting-started', label: 'Primeiros Passos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'tools', label: 'Ferramentas', icon: <Settings className="w-4 h-4" /> },
    { id: 'filters', label: 'Filtros & Console', icon: <Terminal className="w-4 h-4" /> },
    { id: 'technical', label: 'Técnico', icon: <Cpu className="w-4 h-4" /> },
  ];

  const sections = [
    {
      id: 'iniciar',
      category: 'getting-started',
      title: 'Como Iniciar uma Auditoria',
      icon: <FileUp className="w-5 h-5" />,
      description: 'Passo a passo para processar seus arquivos.',
      content: [
        'Acesse a página de Upload no menu lateral.',
        'Selecione um ou mais arquivos de Notas Fiscais.',
        'Selecione o arquivo de Custo Padrão.',
        'Clique em "Iniciar Auditoria" e aguarde o processamento.'
      ]
    },
    {
      id: 'mapeamento',
      category: 'getting-started',
      title: 'Configurando o Mapeamento',
      icon: <Settings className="w-5 h-5" />,
      description: 'Ajuste as colunas para arquivos personalizados.',
      content: [
        'Se os seus arquivos tiverem colunas diferentes do padrão, vá em Configurações.',
        'Informe a letra da coluna correspondente para cada campo.',
        'Você pode salvar seus próprios mapeamentos para uso futuro.',
        'Ajuste a "Tolerância" para ignorar pequenas variações de centavos.'
      ]
    },
    {
      id: 'resultados',
      category: 'getting-started',
      title: 'Entendendo os Resultados',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'O que cada status e cor significa.',
      content: [
        'Acima do Custo Padrão: Quando o preço na Nota Fiscal é MAIOR que o custo padrão no SAP.',
        'Abaixo dos Custo Padrão: Quando o preço na Nota Fiscal é MENOR que o custo padrão no SAP.',
        'Divergências: Linhas onde a variação ultrapassa a tolerância configurada.',
        'Não Encontrado: Materiais que constam na NF mas não foram localizados no CKM3.'
      ]
    },
    {
      id: 'massa',
      category: 'tools',
      title: 'Edição em Massa',
      icon: <Layers className="w-5 h-5" />,
      description: 'Atualize múltiplos itens simultaneamente.',
      content: [
        'Na página de Detalhes, selecione os itens usando os checkboxes à esquerda.',
        'Uma barra de ações aparecerá na parte inferior da tela.',
        'Clique em "Editar em Massa" para abrir o painel de alterações.',
        'Escolha os campos (CFOP, Fornecedor, Preço NF ou Custo SAP) que deseja alterar.',
        'Informe os novos valores e clique em "Salvar Alterações".',
        'O sistema atualizará todos os itens selecionados e recalculará os impactos.'
      ]
    },
    {
      id: 'console',
      category: 'filters',
      title: 'Console de Filtros (Mini Terminal)',
      icon: <Terminal className="w-5 h-5" />,
      description: 'Poderosa ferramenta de consulta baseada em regras.',
      content: [
        'O Filtro Avançado funciona como um Console de Comandos para auditoria.',
        'Digite uma regra por linha. O motor combina todas as regras automaticamente (Lógica E).',
        'Execução em Tempo Real: O sistema recalcula os totais instantaneamente enquanto você digita.',
        'Suporta funções complexas e acesso a subcampos de impostos (ex: impostos.icms).'
      ],
      functions: [
        { name: 'UPPER/LOWER', desc: 'Converte texto para maiúsculas/minúsculas.' },
        { name: 'LEFT/RIGHT', desc: 'Extrai caracteres do início ou fim.' },
        { name: 'ABS', desc: 'Valor absoluto (ignora sinal negativo).' },
        { name: 'YEAR/MONTH/DAY', desc: 'Extrai partes de uma data.' },
        { name: 'CONTAINS', desc: 'Verifica se o texto existe no campo.' }
      ]
    },
    {
      id: 'campos',
      category: 'filters',
      title: 'Guia de Campos para Filtros',
      icon: <Code className="w-5 h-5" />,
      description: 'Lista de variáveis disponíveis para consulta.',
      content: [
        'material: Código ou nome do item.',
        'fornecedor: Nome do fornecedor.',
        'cfop: Código Fiscal (ex: "5102").',
        'impactoFinanceiro: Valor da divergência.',
        'precoEfetivo: Preço unitário na Nota Fiscal.',
        'custoPadrao: Custo unitário no SAP (CKM3).',
        'quantidade: Volume total do item na nota.',
        'impostos: Objeto contendo .icms, .ipi, .st, .pis, .cofins.'
      ]
    },
    {
      id: 'exemplos',
      category: 'filters',
      title: 'Exemplos de Consultas',
      icon: <Zap className="w-5 h-5" />,
      description: 'Expressões prontas para copiar e usar.',
      content: [
        'Divergências Críticas: "impactoFinanceiro > 10000 && quantidade > 500"',
        'Filtro por Alíquota: "impostos.icms != 18 && cfop == \'5102\'"',
        'Busca por Parte do Nome: "material.toLowerCase().includes(\'dipirona\')"',
        'Itens Sem Impacto: "impactoFinanceiro == 0"',
        'Preço NF muito acima do SAP: "precoEfetivo > (custoPadrao * 1.5)"'
      ]
    },
    {
      id: 'natuassist',
      category: 'technical',
      title: 'NatuAssist (IA Offline)',
      icon: <Zap className="w-5 h-5 text-blue-500" />,
      description: 'Como funciona a inteligência artificial local.',
      content: [
        'O NatuAssist é uma IA que roda 100% offline no seu computador.',
        'Nenhum dado é enviado para a nuvem, garantindo total privacidade.',
        'Utiliza o motor llamafile para processamento local de linguagem.',
        'Ajuda a analisar divergências e sugere ações baseadas no contexto.',
        'Totalmente em conformidade com a LGPD e o Marco Legal da IA.'
      ]
    },
    {
      id: 'motor',
      category: 'technical',
      title: 'Motor de Processamento',
      icon: <Cpu className="w-5 h-5" />,
      description: 'Como os dados são processados no navegador.',
      content: [
        'Baseado em arrays reativos para performance máxima.',
        'Fluxo: Dados Brutos -> Auditoria -> Filtro -> Resumo.',
        'Processamento 100% local (Client-side), garantindo privacidade e velocidade.',
        'O filtro avançado assume o controle total da query quando ativado.'
      ]
    },
    {
      id: 'casos',
      category: 'filters',
      title: 'Casos de Uso Reais',
      icon: <AlertCircle className="w-5 h-5" />,
      description: 'Cenários comuns do dia a dia da auditoria.',
      content: [
        'Cenário A: Identificar fornecedor específico com impacto > R$ 2.000.',
        'Cenário B: Auditar apenas notas fiscais de uma unidade específica.',
        'Cenário C: Encontrar itens com alíquota de ICMS incorreta.',
        'Cenário D: Analisar apenas itens com impacto negativo (economia).'
      ]
    }
  ];

  const filteredSections = useMemo(() => {
    return sections.filter(section => {
      const matchesSearch = section.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           section.content.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = activeCategory === 'all' || section.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  return (
    <div className="space-y-8 pb-24 md:pb-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h1 className={`text-4xl font-black tracking-tighter ${darkMode ? 'text-[#8DC63F]' : 'text-slate-900'}`}>
            Central de Ajuda
          </h1>
          <p className={`mt-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Domine o motor de auditoria e otimize seus processos.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          <input 
            type="text"
            placeholder="O que você procura?"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-11 pr-4 py-3 rounded-2xl border outline-none transition-all font-medium text-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-[#8DC63F]' : 'bg-white border-slate-200 text-slate-700 focus:border-[#8DC63F] shadow-sm'}`}
          />
        </div>
      </header>

      {/* Categorias */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-[#8DC63F] text-white shadow-lg shadow-[#8DC63F]/20' : (darkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 shadow-sm')}`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredSections.length > 0 ? (
              filteredSections.map((section) => (
                <motion.section 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={section.id}
                  className={`p-8 rounded-[2.5rem] border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}
                >
                  <div className="flex items-start gap-5 mb-6">
                    <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-green-50 text-[#78AF32]'}`}>
                      {section.icon}
                    </div>
                    <div>
                      <h3 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {section.title}
                      </h3>
                      <p className={`text-xs font-bold mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {section.content.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 group">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${darkMode ? 'bg-slate-800 text-slate-500 group-hover:bg-brand-green/20 group-hover:text-brand-green' : 'bg-slate-100 text-slate-400 group-hover:bg-brand-green/10 group-hover:text-brand-green'}`}>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                        <span className={`text-sm leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {section.functions && (
                    <div className={`mt-8 p-6 rounded-3xl border border-dashed ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-green mb-4 flex items-center gap-2">
                        <Info className="w-3 h-3" /> Referência de Funções
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {section.functions.map((fn, i) => (
                          <div key={i} className="flex flex-col">
                            <code className={`text-[11px] font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{fn.name}</code>
                            <span className="text-[10px] text-slate-500 font-medium">{fn.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.section>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                  <Search className={`w-8 h-8 ${darkMode ? 'text-slate-700' : 'text-slate-300'}`} />
                </div>
                <h3 className={`text-xl font-black ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nenhum tópico encontrado</h3>
                <p className={`text-sm mt-2 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Tente usar termos diferentes ou navegue pelas categorias.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Lateral */}
        <div className="lg:col-span-4 space-y-6">
          <section className={`p-8 rounded-[2.5rem] border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`flex items-center gap-2 text-lg font-black mb-6 ${darkMode ? 'text-[#8DC63F]' : 'text-slate-800'}`}>
              <BookOpen className="w-5 h-5" />
              Dicas de Especialista
            </h3>
            
            <div className="space-y-4">
              <div className={`p-5 rounded-3xl transition-all ${darkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-blue-50 hover:bg-blue-100/50'}`}>
                <div className="flex gap-4">
                   <div className="p-2 rounded-xl bg-blue-500 text-white shrink-0 h-fit">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Filtros Rápidos</p>
                    <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-blue-900'}`}>
                      Use os filtros por CFOP para identificar rapidamente impostos creditáveis que impactam o custo.
                    </p>
                  </div>
                </div>
              </div>

              <Link 
                to="/ai-terms"
                className={`flex items-center gap-4 p-5 rounded-3xl transition-all border border-dashed ${darkMode ? 'bg-slate-900 border-blue-500/30 hover:bg-slate-800' : 'bg-white border-blue-200 hover:bg-blue-50'}`}
              >
                <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 h-fit">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">Privacidade IA</p>
                  <p className={`text-xs leading-relaxed font-black ${darkMode ? 'text-slate-200' : 'text-blue-900'}`}>
                    Ver Termos de Uso e LGPD do NatuAssist
                  </p>
                </div>
              </Link>

              <div className={`p-5 rounded-3xl transition-all ${darkMode ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-amber-50 hover:bg-amber-100/50'}`}>
                <div className="flex gap-4">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 h-fit">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Exportação</p>
                    <p className={`text-xs leading-relaxed font-medium ${darkMode ? 'text-slate-300' : 'text-amber-900'}`}>
                      Sempre exporte para Excel antes de limpar o histórico. O arquivo contém abas de resumo gerencial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={`p-8 rounded-[2.5rem] border overflow-hidden relative ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="relative z-10">
              <h3 className={`flex items-center gap-2 text-lg font-black mb-4 ${darkMode ? 'text-[#8DC63F]' : 'text-slate-800'}`}>
                <MessageSquare className="w-5 h-5" />
                Suporte Técnico
              </h3>
              <p className={`text-sm mb-8 leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Encontrou algum problema ou tem sugestões? Fale conosco diretamente pelo Teams.
              </p>
              <a 
                href="https://teams.microsoft.com/l/chat/0/0?users=guilhermesouza@natulab.com.br"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-[#8DC63F] text-white rounded-2xl font-black hover:bg-[#78AF32] transition-all shadow-lg shadow-[#8DC63F]/20 active:scale-95"
              >
                Chamar no Teams <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            
            {/* Elemento Decorativo */}
            <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${darkMode ? 'bg-[#8DC63F]' : 'bg-green-400'}`} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
