import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UploadCloud, 
  ClipboardList, 
  Box,
  RefreshCcw,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { useAudit } from '../context/AuditContext';

const BottomNav: React.FC = React.memo(() => {
  const { darkMode, setDarkMode, branding, showMaterialsPMM } = useAudit();

  const navItems = useMemo(() => [
    { to: '/', icon: <UploadCloud className="w-5 h-5" />, label: 'Upload' },
    { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dash' },
    ...(showMaterialsPMM ? [{ to: '/material-dashboard', icon: <Box className="w-5 h-5" />, label: 'Materiais' }] : []),
    { to: '/details', icon: <ClipboardList className="w-5 h-5" />, label: 'Tabela' },
    { to: '/movements', icon: <RefreshCcw className="w-5 h-5" />, label: 'Mvm' },
    { to: '/settings', icon: <Settings className="w-5 h-5" />, label: 'Config' },
  ], [showMaterialsPMM]);

  // const navItems = [
  //   { to: '/', icon: <UploadCloud className="w-6 h-6" />, label: 'Upload' },
  //   { to: '/dashboard', icon: <LayoutDashboard className="w-6 h-6" />, label: 'Dash' },
  //   { to: '/details', icon: <ClipboardList className="w-6 h-6" />, label: 'Detalhes' },
  //   { to: '/history', icon: <History className="w-6 h-6" />, label: 'Histórico' },
  //   { to: '/settings', icon: <Settings className="w-6 h-6" />, label: 'Config' },
  //   { to: '/help', icon: <HelpCircle className="w-6 h-6" />, label: 'Ajuda' },
  // ];

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex items-center justify-around px-1 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-md ${darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'}`}>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `
            flex flex-col items-center gap-1 transition-all duration-300 relative
            ${isActive 
              ? 'scale-110' 
              : (darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600')
            }
          `}
          style={({ isActive }) => isActive ? { color: branding.primaryColor } : {}}
        >
          {({ isActive }) => (
            <>
              {item.icon}
              <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
              <div
                className={`
                  absolute -bottom-1 w-1 h-1 rounded-full transition-all duration-300
                  ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                `}
                style={{ backgroundColor: branding.primaryColor }}
              />
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className={`flex flex-col items-center gap-1 transition-all duration-300 ${darkMode ? 'text-slate-500 hover:text-[#8DC63F]' : 'text-gray-400 hover:text-gray-600'}`}
      >
        {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        <span className="text-[10px] font-bold uppercase tracking-tighter">Tema</span>
      </button>
    </nav>
  );
});

export default BottomNav;
