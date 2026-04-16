import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ToastContainer from './ToastContainer';
import AIAssistant from './AIAssistant/AIAssistant';
import { useAudit } from '../context/AuditContext';

const Layout: React.FC = () => {
  const { darkMode } = useAudit();

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
      <AIAssistant />
    </div>
  );
};

export default Layout;
