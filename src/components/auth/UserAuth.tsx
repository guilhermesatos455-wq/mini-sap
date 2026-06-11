import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

export const UserAuth: React.FC = () => {
  const { user, signInWithGoogle, signOutUser } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-700 bg-slate-800/50">
        <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-10 h-10 rounded-full" />
        <div>
          <p className="text-sm font-bold text-white">{user.displayName}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
        </div>
        <button onClick={signOutUser} className="ml-auto p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={signInWithGoogle}
      className="flex items-center gap-3 w-full p-4 rounded-xl bg-[#8DC63F] text-white font-bold hover:bg-[#78AF32] transition-all"
    >
      <LogIn className="w-5 h-5" />
      Lincar Conta Google
    </button>
  );
};
