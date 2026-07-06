import React from 'react';

interface LoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Processando...', isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[#8DC63F] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-700 dark:text-slate-200 font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
