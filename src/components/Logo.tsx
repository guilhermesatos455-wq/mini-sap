import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lente da Lupa */}
      <circle 
        cx="9" 
        cy="9" 
        r="7" 
        className="stroke-slate-400 dark:stroke-slate-500" 
        strokeWidth="2" 
      />
      
      {/* Grade/Células dentro da lente */}
      <rect x="6" y="6" width="2" height="2" rx="0.5" className="fill-slate-300 dark:fill-slate-600" />
      <rect x="10" y="6" width="2" height="2" rx="0.5" className="fill-[#8DC63F]" />
      <rect x="6" y="10" width="2" height="2" rx="0.5" className="fill-[#8DC63F]" />
      <rect x="10" y="10" width="2" height="2" rx="0.5" className="fill-slate-300 dark:fill-slate-600" />

      {/* Cabo da Lupa (Gráfico de Barras Ascendente) */}
      {/* Barra 1 */}
      <rect 
        x="14" 
        y="16" 
        width="2" 
        height="4" 
        rx="1" 
        className="fill-slate-400 dark:fill-slate-500" 
      />
      {/* Barra 2 */}
      <rect 
        x="17.5" 
        y="13" 
        width="2" 
        height="7" 
        rx="1" 
        className="fill-slate-400 dark:fill-slate-500" 
      />
      {/* Barra 3 (Destaque) */}
      <rect 
        x="21" 
        y="9" 
        width="2" 
        height="11" 
        rx="1" 
        className="fill-[#8DC63F]" 
      />
      
      {/* Conexão da Lupa ao Gráfico */}
      <path 
        d="M14 14L15.5 15.5" 
        className="stroke-slate-400 dark:stroke-slate-500" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
    </svg>
  );
};

export default Logo;
