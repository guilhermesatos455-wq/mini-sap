import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, FileCheck, AlertTriangle } from 'lucide-react';
import StatCard from './StatCard';

interface SummaryCardsProps {
  resultado: any;
  darkMode: boolean;
  formatCurrency: (val: number) => string;
  showFinancialImpact: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({
  resultado,
  darkMode,
  formatCurrency,
  showFinancialImpact
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {showFinancialImpact && (
        <>
          <motion.div variants={item}>
            <StatCard 
              title="Total em Divergências" 
              value={formatCurrency(resultado.totalPrejuizo - resultado.totalEconomia)}
              icon={<TrendingUp className="w-6 h-6" />}
              trend={resultado.totalPrejuizo > resultado.totalEconomia ? 'up' : 'down'}
              color="primary"
              darkMode={darkMode}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard 
              title="Acima do Custo Padrão" 
              value={formatCurrency(resultado.totalPrejuizo)}
              icon={<TrendingDown className="w-6 h-6" />}
              trend="up"
              color="danger"
              darkMode={darkMode}
            />
          </motion.div>
          <motion.div variants={item}>
            <StatCard 
              title="Abaixo do Custo Padrão" 
              value={formatCurrency(resultado.totalEconomia)}
              icon={<TrendingUp className="w-6 h-6" />}
              trend="up"
              color="success"
              darkMode={darkMode}
            />
          </motion.div>
        </>
      )}
      {!showFinancialImpact && (
        <motion.div variants={item}>
          <StatCard 
            title="Quantidade de Divergências" 
            value={resultado.qtdDiv.toLocaleString()}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="warning"
            darkMode={darkMode}
          />
        </motion.div>
      )}
      <motion.div variants={item}>
        <StatCard 
          title="Itens Auditados" 
          value={resultado.linhasNfProcessadas.toLocaleString()}
          icon={<FileCheck className="w-6 h-6" />}
          color="info"
          darkMode={darkMode}
        />
      </motion.div>
    </motion.div>
  );
};

export default SummaryCards;
