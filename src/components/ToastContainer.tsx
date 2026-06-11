import React from 'react';
import { useAudit } from '../context/AuditContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, addToast } = useAudit();
  
  // Need to implement removeToast manually or just rely on existing structure of AuditContext's addToast logic?
  // AuditContext.addToast already handles auto-removal via setTimeout.
  // We need a way to remove manually if needed, but for now let's just render.
  // Actually, AuditContext does not have removeToast in the interface!
  
  // Let me re-read AuditContext.tsx
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-4 min-w-[300px] rounded-xl shadow-lg border ${
            toast.type === 'success' ? 'bg-white text-slate-800 border-green-200 shadow-green-100' :
            toast.type === 'error' ? 'bg-white text-slate-800 border-red-200 shadow-red-100' :
            'bg-white text-slate-800 border-blue-200 shadow-blue-100'
          }`}
        >
          <div className="flex items-center gap-3">
              {toast.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
              <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
