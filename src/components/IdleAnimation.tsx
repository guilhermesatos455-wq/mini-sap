import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Pill } from 'lucide-react';

interface IdleAnimationProps {
  darkMode: boolean;
}

export const IdleAnimation: React.FC<IdleAnimationProps> = ({ darkMode }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none backdrop-blur-md ${darkMode ? 'bg-slate-950/60' : 'bg-slate-200/70'}`}
    >
      <div className="relative flex items-center justify-center h-64 w-64">
        {/* Outer Rotating Rings (Data/Web) */}
        <motion.div
          className={`absolute inset-0 border ${darkMode ? 'border-emerald-500/20' : 'border-emerald-600/40'} rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className={`absolute inset-4 border ${darkMode ? 'border-emerald-400/10' : 'border-emerald-500/30'} rounded-full`}
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />

        {/* Orbiting "Data" Particles (Mini SAP) - More spheres, different sizes/radii */}
        {[
          { size: 'h-2 w-2', radius: '100%', duration: 8, delay: 0 },
          { size: 'h-1.5 w-1.5', radius: '115%', duration: 12, delay: 1 },
          { size: 'h-3 w-3', radius: '130%', duration: 10, delay: 2 },
          { size: 'h-1 w-1', radius: '85%', duration: 15, delay: 0.5 },
          { size: 'h-2.5 w-2.5', radius: '145%', duration: 18, delay: 3 },
          { size: 'h-1.5 w-1.5', radius: '70%', duration: 7, delay: 1.5 },
          { size: 'h-2 w-2', radius: '160%', duration: 22, delay: 4 },
          { size: 'h-1.2 w-1.2', radius: '175%', duration: 25, delay: 2.5 },
          { size: 'h-3.5 w-3.5', radius: '190%', duration: 14, delay: 5 },
          { size: 'h-1.8 w-1.8', radius: '60%', duration: 6, delay: 0.8 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute"
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
            style={{ width: p.radius, height: p.radius }}
          >
            <motion.div
              className={`absolute top-0 left-1/2 -ml-1 ${p.size} ${darkMode ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-emerald-700 shadow-[0_0_8px_rgba(4,120,87,0.5)]'} rounded-full`}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          </motion.div>
        ))}

        {/* Central Core: Leaf + Pill (Natulab) */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <Leaf className={`w-20 h-20 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'} fill-emerald-600/10`} strokeWidth={1.5} />
              <motion.div
                className={`absolute -bottom-2 -right-2 rounded-full p-1.5 shadow-lg border ${darkMode ? 'bg-slate-900 border-emerald-500/30' : 'bg-white border-emerald-100'}`}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              >
                <Pill className="w-8 h-8 text-emerald-500" />
              </motion.div>
            </div>
          </motion.div>

          {/* Text Labels */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 text-center"
          >
            <h2 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-[#004d2a]'}`}>
              NATULAB
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`h-[1px] w-4 ${darkMode ? 'bg-emerald-800' : 'bg-emerald-300'}`} />
              <span className={`text-[10px] font-mono uppercase tracking-[0.3em] font-semibold ${darkMode ? 'text-emerald-500/80' : 'text-emerald-800/70'}`}>
                Mini SAP Web
              </span>
              <span className={`h-[1px] w-4 ${darkMode ? 'bg-emerald-800' : 'bg-emerald-300'}`} />
            </div>
          </motion.div>
        </div>

        {/* Pulse Effect */}
        <motion.div
          className="absolute inset-0 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
};
