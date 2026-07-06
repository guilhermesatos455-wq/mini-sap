import React, { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

const DesktopIndicator: React.FC = () => {
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running in Tauri environment
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      setIsTauri(true);
    }
  }, []);

  if (!isTauri) return null;

  return (
    <div className="absolute top-4 right-4 z-[70] flex items-center gap-2 px-3 py-1.5 bg-emerald-600/90 text-white text-xs font-medium rounded-full shadow-lg border border-emerald-500/20 backdrop-blur-sm">
      <Monitor className="w-3.5 h-3.5" />
      Modo Desktop Ativo
    </div>
  );
};

export default DesktopIndicator;
