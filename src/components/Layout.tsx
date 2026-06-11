import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { ToastContainer } from './ToastContainer';
import { NatuAssistChat } from './NatuAssistChat';
import { useAudit } from '../context/AuditContext';
import { Bot } from 'lucide-react';

const Layout: React.FC = () => {
  const { darkMode } = useAudit();
  const [showChat, setShowChat] = useState(false);

  return (
    <div className={`flex h-screen overflow-hidden relative ${darkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-gray-900'}`}>
      <Sidebar />
      <ToastContainer />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      <BottomNav />
      {showChat ? (
        <NatuAssistChat onClose={() => setShowChat(false)} />
      ) : (
        <button 
          onClick={() => setShowChat(true)}
          className="fixed bottom-24 md:bottom-6 right-6 z-[60] p-4 bg-[#8DC63F] text-white rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default Layout;
