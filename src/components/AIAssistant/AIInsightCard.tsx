
import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';

interface AIInsightCardProps {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

const AIInsightCard: React.FC<AIInsightCardProps> = ({ 
  title, 
  description, 
  type, 
  actionLabel, 
  onAction 
}) => {
  const { darkMode, branding } = useAudit();

  const colors = {
    success: {
      bg: darkMode ? 'bg-green-500/10' : 'bg-green-50',
      border: darkMode ? 'border-green-500/20' : 'border-green-100',
      icon: 'text-green-500',
    },
    warning: {
      bg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50',
      border: darkMode ? 'border-amber-500/20' : 'border-amber-100',
      icon: 'text-amber-500',
    },
    info: {
      bg: darkMode ? 'bg-blue-500/10' : 'bg-blue-50',
      border: darkMode ? 'border-blue-500/20' : 'border-blue-100',
      icon: 'text-blue-500',
    }
  };

  const config = colors[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl border ${config.bg} ${config.border} relative overflow-hidden group`}
    >
      {/* Background Sparkle Effect */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Sparkles className="w-12 h-12" />
      </div>

      <div className="flex items-start gap-3 relative z-10">
        <div className={`p-2 rounded-xl bg-white shadow-sm ${config.icon}`}>
          {type === 'success' && <TrendingUp className="w-5 h-5" />}
          {type === 'warning' && <AlertCircle className="w-5 h-5" />}
          {type === 'info' && <Sparkles className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500 text-white font-bold uppercase tracking-wider">NatuAssist Insight</span>
          </div>
          <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            {description}
          </p>
          
          {actionLabel && (
            <button
              onClick={onAction}
              className="mt-3 flex items-center gap-1 text-xs font-bold transition-all hover:gap-2"
              style={{ color: branding.primaryColor }}
            >
              {actionLabel}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AIInsightCard;
