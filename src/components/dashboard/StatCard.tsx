import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  color: 'primary' | 'success' | 'danger' | 'info' | 'warning';
  darkMode: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
  darkMode
}) => {
  const colorClasses = {
    primary: darkMode ? 'text-[#8DC63F] bg-[#8DC63F]/10' : 'text-[#78AF32] bg-[#8DC63F]/10',
    success: darkMode ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50',
    danger: darkMode ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-50',
    info: darkMode ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50',
    warning: darkMode ? 'text-orange-400 bg-orange-400/10' : 'text-orange-600 bg-orange-50',
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all hover:shadow-lg ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend === 'up' ? '+12%' : '-5%'}
          </div>
        )}
      </div>
      <div>
        <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          {title}
        </h4>
        <p className={`text-2xl font-bold ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
