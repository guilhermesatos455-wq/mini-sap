import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  Table as TableIcon, 
  History, 
  Settings, 
  Calculator,
  Box,
  Moon, 
  Sun,
  HelpCircle,
  Github
} from 'lucide-react';
import Logo from './Logo';
import { useAudit } from '../context/AuditContext';

const navItems = [
  { to: '/', icon: <UploadCloud className="w-5 h-5" />, label: 'Upload' },
  { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/details', icon: <TableIcon className="w-5 h-5" />, label: 'Detalhes' },
  { to: '/movements', icon: <Box className="w-5 h-5" />, label: 'Movimentos' },
  { to: '/history', icon: <History className="w-5 h-5" />, label: 'Histórico' },
  { to: '/simulator', icon: <Calculator className="w-5 h-5" />, label: 'Simulador' },
  { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Configurações' },
  { to: '/help', icon: <HelpCircle className="w-5 h-5" />, label: 'Ajuda' },
];

const Sidebar: React.FC = React.memo(() => {
  const { darkMode, setDarkMode, branding } = useAudit();

  return (
    <aside className={`hidden md:flex w-64 flex-shrink-0 border-r transition-all duration-300 flex flex-col ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-transparent">
        <div className={`p-2 rounded-xl ${darkMode ? 'bg-slate-800 text-[#8DC63F]' : 'bg-slate-50 text-[#78AF32]'}`}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
          ) : (
            <Logo className="w-6 h-6" />
          )}
        </div>
        <span className={`font-bold text-lg tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {branding.companyName}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
              ${isActive 
                ? (darkMode ? 'bg-[#8DC63F] text-slate-900 shadow-lg' : 'bg-[#8DC63F] text-white shadow-md')
                : (darkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900')
              }
            `}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-transparent">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${darkMode ? 'bg-slate-800 text-[#8DC63F] hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
