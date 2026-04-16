import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';

interface AlertsSectionProps {
  alerts: any[];
  darkMode: boolean;
  onDrillDown: (filters: any) => void;
}

const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts,
  darkMode,
  onDrillDown
}) => {
  if (alerts.length === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-2xl border ${darkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-100'}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        <h3 className={`text-lg font-bold ${darkMode ? 'text-orange-400' : 'text-orange-800'}`}>
          Alertas de Atenção
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.map((alert, idx) => (
          <button
            key={idx}
            onClick={() => onDrillDown(alert.filters)}
            className={`flex items-center justify-between p-4 rounded-xl text-left transition-all hover:scale-[1.02] ${darkMode ? 'bg-slate-900/50 hover:bg-slate-900' : 'bg-white hover:shadow-md'}`}
          >
            <div className="flex flex-col">
              <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                {alert.type}
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                {alert.message}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-500" />
          </button>
        ))}
      </div>
    </motion.section>
  );
};

export default AlertsSection;
