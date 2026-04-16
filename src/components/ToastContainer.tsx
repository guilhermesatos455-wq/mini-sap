import React from 'react';
import { useAudit } from '../context/AuditContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastContainer: React.FC = () => {
  const { toasts, darkMode } = useAudit();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border min-w-[300px] max-w-md ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-200' 
                : 'bg-white border-gray-100 text-gray-800'
            }`}
          >
            <div className={`p-2 rounded-xl ${
              toast.type === 'success' ? 'bg-green-500/10 text-green-500' :
              toast.type === 'error' ? 'bg-red-500/10 text-red-500' :
              'bg-blue-500/10 text-blue-500'
            }`}>
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <p className="text-sm font-medium flex-1">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
