import React, { useMemo } from 'react';
import { useAudit } from '../../context/AuditContext';
import { Divergencia } from '../../types/audit';
import { Clock } from 'lucide-react';

export const AuditTimeline: React.FC = () => {
  const { resultado, darkMode } = useAudit();
  
  const timeline = useMemo(() => {
    if (!resultado || !resultado.todosOsItens) return [];
    
    const logs: any[] = [];
    resultado.todosOsItens.forEach((item: Divergencia) => {
      if (item.auditLogs) {
        item.auditLogs.forEach(log => {
          logs.push({
            ...log,
            material: item.material,
            descricao: item.descricao
          });
        });
      }
    });
    
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50);
  }, [resultado]);

  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-green" />
        Timeline de Ações (Últimos 50 logs)
      </h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {timeline.map((log, i) => (
          <div key={i} className="text-xs border-l-2 pl-3 border-[#8DC63F]">
            <p className="font-bold">{log.action}</p>
            <p className="opacity-70">{log.material} - {log.descricao}</p>
            <p className="text-[10px] italic">{log.user} em {new Date(log.timestamp).toLocaleString()}</p>
          </div>
        ))}
        {timeline.length === 0 && <p className="text-xs italic opacity-60">Nenhum log encontrado.</p>}
      </div>
    </div>
  );
};
