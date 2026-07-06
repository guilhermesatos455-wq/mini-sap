import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAudit } from '../context/AuditContext';

const SyncStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { darkMode } = useAudit();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`fixed bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm transition-all ${
      isOnline 
        ? darkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
        : darkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-50 text-amber-700'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" /> Online
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" /> Offline (Modo Local)
        </>
      )}
    </div>
  );
};

export default SyncStatus;
