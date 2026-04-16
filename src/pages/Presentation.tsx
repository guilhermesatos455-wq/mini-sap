import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  Upload, 
  Search, 
  FileSpreadsheet, 
  Zap, 
  ShieldCheck,
  Layout as LayoutIcon,
  X,
  Download,
  Loader2,
  Terminal
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';

const slides = [
  {
    title: "Mini-SAP Web Auditoria",
    subtitle: "Inteligência Fiscal e Financeira na Palma da Mão",
    icon: <ShieldCheck className="w-20 h-20 text-[#8DC63F]" />,
    content: "Uma plataforma completa para auditoria de divergências de preços, impostos e conformidade em processos de compras.",
    color: "from-[#8DC63F] to-[#78AF32]"
  },
  {
    title: "O Desafio Estratégico",
    subtitle: "Visibilidade vs. Complexidade",
    icon: <Zap className="w-16 h-16 text-yellow-400" />,
    content: "Empresas perdem milhões anualmente em 'prejuízos silenciosos' devido a divergências entre o negociado e o faturado.",
    list: [
      "Falta de conferência item a item em tempo real",
      "Dificuldade em cruzar dados de NF com Custo Padrão SAP",
      "Processos manuais lentos e propensos a erros"
    ]
  },
  {
    title: "A Solução Mini-SAP Web",
    subtitle: "Automação e Precisão Cirúrgica",
    icon: <ShieldCheck className="w-16 h-16 text-[#8DC63F]" />,
    content: "Nossa ferramenta automatiza o cruzamento de dados, identificando instantaneamente onde o dinheiro está sendo perdido.",
    list: [
      "Cálculo automático de impacto financeiro (NF vs CKM3)",
      "Validação rigorosa de CFOP e Fornecedor",
      "Interface intuitiva para compradores e auditores"
    ]
  },
  {
    title: "Metodologia de Auditoria",
    subtitle: "Como o Motor de Cálculo Funciona",
    icon: <Terminal className="w-16 h-16 text-blue-400" />,
    content: "O sistema aplica regras de negócio complexas em milissegundos para garantir a integridade dos dados.",
    list: [
      "Divergência Positiva: Preço NF > Custo SAP (Prejuízo)",
      "Divergência Negativa: Preço NF < Custo SAP (Economia)",
      "Tolerância Configurável: Evite alertas falsos por centavos",
      "Validação de Impostos: ICMS, IPI, ST, PIS e COFINS"
    ]
  },
  {
    title: "Processamento de Alta Performance",
    subtitle: "Escalabilidade sem Limites",
    icon: <Upload className="w-16 h-16 text-sky-400" />,
    content: "Capacidade de processar milhares de linhas de Notas Fiscais simultaneamente no navegador.",
    list: [
      "Upload múltiplo de arquivos Excel/CSV",
      "Processamento local (Privacidade e Velocidade)",
      "Mapeamento flexível de colunas customizáveis"
    ]
  },
  {
    title: "Dashboard Executivo",
    subtitle: "Gestão Baseada em Dados (Data-Driven)",
    icon: <BarChart3 className="w-16 h-16 text-purple-400" />,
    content: "Transformamos dados brutos em indicadores visuais claros para a alta gestão.",
    list: [
      "Total de Prejuízo vs. Economia Identificada",
      "Ranking de Fornecedores com maior divergência",
      "Visão por Empresa/Filial e Categoria de Material"
    ]
  },
  {
    title: "Auditoria Detalhada",
    subtitle: "O Poder do Filtro Avançado",
    icon: <Search className="w-16 h-16 text-emerald-400" />,
    content: "Navegue por cada item auditado com ferramentas de busca e filtragem de nível profissional.",
    list: [
      "Console de Comandos para filtros complexos",
      "Edição em Massa para correções rápidas",
      "Gestão de Status: Pendente, Corrigido ou Ignorado"
    ]
  },
  {
    title: "Segurança & Conformidade",
    subtitle: "Proteção de Dados e Rastreabilidade",
    icon: <ShieldCheck className="w-16 h-16 text-red-400" />,
    content: "Garantimos que o processo de auditoria seja seguro e auditável em todas as etapas.",
    list: [
      "Logs de alteração por usuário",
      "Processamento 'Client-Side' (Dados não saem da rede)",
      "Exportação de evidências para compliance"
    ]
  },
  {
    title: "Exportação & Integração SAP",
    subtitle: "Fechando o Ciclo da Correção",
    icon: <FileSpreadsheet className="w-16 h-16 text-green-500" />,
    content: "Gere arquivos prontos para carga ou relatórios para tomada de decisão.",
    list: [
      "Carga SAP formatada (CSV/TXT)",
      "Relatórios em PDF para apresentações",
      "Exportação Excel com fórmulas de auditoria"
    ]
  },
  {
    title: "Retorno sobre Investimento (ROI)",
    subtitle: "Valor Agregado Imediato",
    icon: <Zap className="w-16 h-16 text-orange-400" />,
    content: "O sistema se paga identificando recuperações financeiras já na primeira auditoria.",
    list: [
      "Redução drástica no tempo de conferência manual",
      "Recuperação de valores faturados indevidamente",
      "Melhoria na negociação com fornecedores recorrentes"
    ]
  },
  {
    title: "Conclusão & Próximos Passos",
    subtitle: "Rumo à Excelência Operacional",
    icon: <ShieldCheck className="w-20 h-20 text-[#8DC63F]" />,
    content: "O Mini-SAP Web Auditoria é o parceiro ideal para transformar sua controladoria em um centro de lucro.",
    color: "from-[#8DC63F] to-[#78AF32]"
  }
];

const Presentation: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  const handleExportExcel = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Visão Geral Estratégica
        const overviewData = [
          ["MINI-SAP WEB AUDITORIA - ESTRUTURA DO PROGRAMA"],
          [""],
          ["CONCEITO", "Plataforma de inteligência fiscal para auditoria de compras e custos."],
          ["MISSÃO", "Eliminar o prejuízo silencioso através da automação de conferência."],
          ["PÚBLICO", "Controladoria, Compras, Auditoria e Gestão Financeira."],
          [""],
          ["PILARES ESTRATÉGICOS"],
          ["1. Precisão", "Cruzamento exato entre Nota Fiscal e Custo Padrão SAP (CKM3)."],
          ["2. Velocidade", "Processamento de milhares de itens em segundos no navegador."],
          ["3. Compliance", "Rastreabilidade total e validação rigorosa de CFOP/Impostos."],
          ["4. ROI", "Identificação imediata de valores a recuperar e economia."],
          [""],
          ["Gerado em:", new Date().toLocaleString()]
        ];
        const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, wsOverview, "Visão Geral");

        // Sheet 2: Módulos e Funcionalidades
        const featuresData = [
          ["MÓDULO", "FUNCIONALIDADE", "DESCRIÇÃO DETALHADA", "VALOR AGREGADO"],
          ["UPLOAD", "Processamento Inteligente", "Leitura de XML/Excel/CSV com mapeamento dinâmico.", "Agilidade na entrada de dados."],
          ["DASHBOARD", "Indicadores KPI", "Visão gráfica de prejuízo, economia e ranking de fornecedores.", "Gestão visual imediata."],
          ["AUDITORIA", "Filtro Avançado", "Console de comandos para consultas complexas e cruzadas.", "Poder de análise técnica."],
          ["AUDITORIA", "Edição em Massa", "Alteração de múltiplos registros simultaneamente.", "Produtividade na correção."],
          ["SAP", "Carga de Correção", "Geração de arquivos formatados para integração ERP.", "Conformidade sistêmica."],
          ["SEGURANÇA", "Logs & Privacy", "Processamento local sem saída de dados sensíveis da rede.", "Segurança da informação."]
        ];
        const wsFeatures = XLSX.utils.aoa_to_sheet(featuresData);
        XLSX.utils.book_append_sheet(wb, wsFeatures, "Funcionalidades");

        // Sheet 3: Lógica de Cálculo (Exemplo)
        const logicData = [
          ["CENÁRIO", "CÁLCULO", "RESULTADO ESPERADO", "AÇÃO RECOMENDADA"],
          ["Preço NF > Custo SAP", "(Preço NF - Custo SAP) * Qtd", "Divergência Positiva (Prejuízo)", "Negociar estorno ou corrigir pedido."],
          ["Preço NF < Custo SAP", "(Custo SAP - Preço NF) * Qtd", "Divergência Negativa (Economia)", "Validar se o custo padrão está atualizado."],
          ["CFOP Incorreto", "Validação vs. Cadastro", "Alerta de Compliance", "Corrigir classificação fiscal no SAP."],
          ["Fornecedor Novo", "Busca no De-Para", "Alerta de Cadastro", "Sincronizar cadastro de fornecedores."]
        ];
        const wsLogic = XLSX.utils.aoa_to_sheet(logicData);
        XLSX.utils.book_append_sheet(wb, wsLogic, "Lógica de Auditoria");

        XLSX.writeFile(wb, "Estrutura_Completa_MiniSAP_WebAuditoria.xlsx");
      } catch (error) {
        console.error("Erro ao exportar Excel:", error);
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const handleExportPPT = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        const pptx = new pptxgen();
        pptx.layout = 'LAYOUT_16x9';
        pptx.defineSlideMaster({
          title: 'MASTER_SLIDE',
          background: { color: '0F172A' },
          objects: [
            { rect: { x: 0, y: 0, w: '100%', h: 0.1, fill: { color: '8DC63F' } } },
            { text: { text: 'Mini-SAP Web Auditoria', options: { x: 0.5, y: 5.1, w: 3, h: 0.3, fontSize: 10, color: '475569' } } }
          ]
        });

        slides.forEach((slideData, index) => {
          const slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
          
          if (index === 0 || index === slides.length - 1) {
            // Capa e Conclusão
            slide.addText(slideData.title, { 
              x: 0.5, y: 1.8, w: 9, h: 1, 
              fontSize: 48, bold: true, color: '8DC63F', align: 'center' 
            });
            slide.addText(slideData.subtitle, { 
              x: 0.5, y: 2.8, w: 9, h: 0.5, 
              fontSize: 24, color: '94A3B8', align: 'center' 
            });
            slide.addText(slideData.content, { 
              x: 1, y: 3.5, w: 8, h: 1, 
              fontSize: 16, color: 'CBD5E1', align: 'center' 
            });
          } else {
            // Slides de Conteúdo
            slide.addText(slideData.title, { 
              x: 0.5, y: 0.5, w: 9, h: 0.8, 
              fontSize: 36, bold: true, color: '8DC63F' 
            });
            slide.addText(slideData.subtitle, { 
              x: 0.5, y: 1.2, w: 9, h: 0.4, 
              fontSize: 18, color: '94A3B8', italic: true 
            });
            
            slide.addText(slideData.content, { 
              x: 0.5, y: 1.8, w: 5, h: 2, 
              fontSize: 16, color: 'CBD5E1' 
            });

            if (slideData.list) {
              slide.addText(
                slideData.list.map(item => ({ text: item, options: { bullet: true, color: '8DC63F' } })),
                { x: 5.8, y: 1.8, w: 3.7, h: 3, fontSize: 14, color: 'CBD5E1' }
              );
            }
          }
        });

        pptx.writeFile({ fileName: "Apresentacao_MiniSAP_WebAuditoria.pptx" });
      } catch (error) {
        console.error("Erro ao exportar PPT:", error);
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden text-white font-sans">
      {/* Close Button */}
      <button 
        onClick={() => navigate(-1)}
        className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/50 hover:bg-slate-800 transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-slate-900">
        <motion.div 
          className="h-full bg-[#8DC63F]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="w-full max-w-6xl px-6 relative h-[70vh] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full flex flex-col md:flex-row items-center gap-12"
          >
            {/* Icon/Visual Side */}
            <div className="flex-1 flex justify-center">
              <motion.div
                initial={{ rotate: -10, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className={`p-12 rounded-[40px] bg-gradient-to-br ${slides[currentSlide].color || 'from-slate-900 to-slate-800'} shadow-2xl border border-slate-800/50 flex items-center justify-center`}
              >
                {slides[currentSlide].icon}
              </motion.div>
            </div>

            {/* Content Side */}
            <div className="flex-[1.5] space-y-6 text-center md:text-left">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-[#8DC63F] font-bold tracking-widest uppercase text-sm mb-2">
                  {slides[currentSlide].subtitle}
                </h2>
                <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight">
                  {slides[currentSlide].title}
                </h1>
              </motion.div>

              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-slate-400 leading-relaxed max-w-2xl"
              >
                {slides[currentSlide].content}
              </motion.p>

              {slides[currentSlide].list && (
                <motion.ul 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 mt-8"
                >
                  {slides[currentSlide].list.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#8DC63F]" />
                      {item}
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-12 left-0 w-full px-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-slate-500 font-mono text-sm">
            {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </div>
          
          <button
            onClick={handleExportPPT}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isExporting ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-orange-600/10 border-orange-600/20 text-orange-500 hover:bg-orange-600/20'}`}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
            {isExporting ? 'Gerando...' : 'Baixar PowerPoint'}
          </button>
          
          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${isExporting ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-green-600/10 border-green-600/20 text-green-500 hover:bg-green-600/20'}`}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Excel' : 'Excel'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-4 rounded-2xl transition-all border ${currentSlide === 0 ? 'opacity-20 cursor-not-allowed border-slate-800' : 'hover:bg-slate-900 border-slate-800 hover:border-slate-700'}`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className={`p-4 rounded-2xl transition-all border ${currentSlide === slides.length - 1 ? 'opacity-20 cursor-not-allowed border-slate-800' : 'bg-[#8DC63F] hover:bg-[#78AF32] border-transparent text-slate-950 font-bold'}`}
          >
            {currentSlide === slides.length - 1 ? <ChevronRight className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#8DC63F]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
    </div>
  );
};

export default Presentation;
