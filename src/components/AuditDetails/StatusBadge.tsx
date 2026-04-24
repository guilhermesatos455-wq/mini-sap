import React from 'react';
import { Clock, Search, CheckCircle2, X } from 'lucide-react';
import Tooltip from '../Tooltip';

interface StatusBadgeProps {
  status: string;
  darkMode: boolean;
}

export const StatusBadge = ({ status, darkMode }: StatusBadgeProps) => {
  const configs: any = {
    'Pendente': { 
      color: 'bg-yellow-500/10 text-yellow-500', 
      icon: Clock,
      description: 'Item aguardando análise inicial da auditoria'
    },
    'Em Análise': { 
      color: 'bg-blue-500/10 text-blue-500', 
      icon: Search,
      description: 'Divergência sendo investigada ou em processo de justificativa'
    },
    'Aguardando Fornecedor': { 
      color: 'bg-orange-500/10 text-orange-500', 
      icon: Clock,
      description: 'Depende de retorno ou documentação do fornecedor'
    },
    'Corrigido no SAP': { 
      color: 'bg-[#8DC63F]/10 text-[#8DC63F]', 
      icon: CheckCircle2,
      description: 'Divergência resolvida ou custo padrão atualizado no SAP'
    },
    'Ignorado': { 
      color: 'bg-gray-500/10 text-gray-500', 
      icon: X,
      description: 'Divergência analisada e considerada irrelevante'
    },
  };

  const config = configs[status] || configs['Pendente'];
  const Icon = config.icon;

  return (
    <Tooltip content={config.description} darkMode={darkMode}>
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    </Tooltip>
  );
};
