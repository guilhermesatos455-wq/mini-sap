
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Scale, 
  ServerOff, 
  Globe, 
  ChevronLeft,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAudit } from '../context/AuditContext';

const AITermsPage: React.FC = () => {
  const { darkMode } = useAudit();

  const sections = [
    {
      icon: <ServerOff className="w-6 h-6 text-blue-500" />,
      title: "Processamento 100% Offline",
      content: "O NatuAssist utiliza a tecnologia llamafile para executar modelos de linguagem diretamente no hardware local do usuário. Diferente de IAs baseadas em nuvem, nenhum dado processado, prompt ou insight gerado é enviado para servidores externos. Todo o processamento ocorre na memória RAM e CPU/GPU do dispositivo local."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-green-500" />,
      title: "Conformidade com a LGPD",
      content: "Em estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018), o NatuAssist garante a privacidade por design (Privacy by Design). Como os dados não são transmitidos, não há risco de vazamento em trânsito ou armazenamento não autorizado por terceiros. O controle dos dados permanece integralmente com o controlador (empresa/usuário)."
    },
    {
      icon: <Scale className="w-6 h-6 text-amber-500" />,
      title: "Marco Legal da IA (PL 2338/23)",
      content: "O NatuAssist segue os princípios do Projeto de Lei nº 2338/2023, priorizando a transparência e a explicabilidade. Por ser uma ferramenta de apoio à decisão humana (Human-in-the-loop), a IA fornece justificativas baseadas em dados técnicos SAP, permitindo que o auditor valide e supervisione cada sugestão."
    },
    {
      icon: <FileText className="w-6 h-6 text-purple-500" />,
      title: "Licenciamento e Propriedade Intelectual",
      content: "O software utiliza componentes sob licenças de código aberto (Apache 2.0 / MIT). O uso do motor llamafile respeita os direitos de copyright e copyleft dos desenvolvedores originais. Os insights gerados pela ferramenta são de propriedade exclusiva do usuário, sem royalties ou restrições de uso comercial."
    },
    {
      icon: <Lock className="w-6 h-6 text-red-500" />,
      title: "Segurança da Informação e Compliance",
      content: "A arquitetura offline elimina vetores de ataque comuns em APIs de IA. O NatuAssist integra-se às políticas de compliance corporativo ao permitir que dados sensíveis de custos e margens SAP sejam analisados sem violar perímetros de segurança de rede ou políticas de sigilo industrial."
    }
  ];

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-black uppercase tracking-widest text-blue-500">Termos de Uso IA</span>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-black tracking-tighter mb-4">
            Compromisso de Privacidade <br/>
            <span className="text-blue-500">NatuAssist AI</span>
          </h1>
          <p className={`text-lg leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Transparência, segurança e soberania de dados no coração da sua auditoria SAP.
          </p>
        </motion.div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.01] ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}
            >
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-black mb-3 tracking-tight">{section.title}</h3>
                  <p className={`text-sm leading-relaxed font-medium ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {section.content}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <div className={`p-8 rounded-[2rem] border text-center ${darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
          </div>
          <h4 className="text-lg font-black mb-2">Soberania Digital Garantida</h4>
          <p className="text-sm text-blue-600 font-medium max-w-2xl mx-auto">
            Ao utilizar o NatuAssist, você concorda que a responsabilidade pela integridade do ambiente de execução local é do usuário. 
            A ferramenta não coleta telemetria ou logs de uso, assegurando total anonimato operacional.
          </p>
          <div className="mt-6 text-[10px] font-black uppercase tracking-widest opacity-50">
            Última atualização: Abril de 2026 • Versão 1.2.0-Offline
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITermsPage;
