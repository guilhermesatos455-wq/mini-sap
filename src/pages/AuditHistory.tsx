import React, { useState } from 'react';
import { useAudit } from '../context/AuditContext';

const AuditHistory: React.FC = () => {
  const { auditLogs } = useAudit();
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedLogs(prev => 
      prev.includes(id) ? prev.filter(logId => logId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLogs.length === auditLogs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(auditLogs.map(log => log.id));
    }
  };

  const exportSelected = () => {
    const selected = auditLogs.filter(log => selectedLogs.includes(log.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selected, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "audit_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Histórico de Auditoria</h1>
        <button 
          onClick={exportSelected}
          disabled={selectedLogs.length === 0}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Exportar Selecionados ({selectedLogs.length})
        </button>
      </div>
      <div className="bg-white p-4 rounded shadow">
        {auditLogs.length === 0 ? (
          <p>Nenhum log encontrado.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b">
                  <input 
                    type="checkbox" 
                    checked={selectedLogs.length === auditLogs.length && auditLogs.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-2 border-b">Data/Hora</th>
                <th className="p-2 border-b">Usuário</th>
                <th className="p-2 border-b">Ação</th>
                <th className="p-2 border-b">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="p-2 border-b">
                    <input 
                      type="checkbox" 
                      checked={selectedLogs.includes(log.id)}
                      onChange={() => toggleSelect(log.id)}
                    />
                  </td>
                  <td className="p-2 border-b">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-2 border-b">{log.user}</td>
                  <td className="p-2 border-b">{log.action}</td>
                  <td className="p-2 border-b">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditHistory;
