import React, { createContext, useContext, useState, useEffect } from 'react';

export interface LogEntry {
  id: string;
  type: 'error' | 'warn' | 'info';
  message: string;
  timestamp: Date;
  stack?: string;
}

interface DebugLogContextType {
  logs: LogEntry[];
  clearLogs: () => void;
  addLog: (type: 'error' | 'warn' | 'info', message: string, stack?: string) => void;
}

const DebugLogContext = createContext<DebugLogContextType | undefined>(undefined);

export const DebugLogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (type: 'error' | 'warn' | 'info', message: string, stack?: string) => {
    setLogs((prev) => {
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        message,
        timestamp: new Date(),
        stack,
      };
      const updated = [...prev, newEntry];
      if (updated.length > 20) {
        return updated.slice(updated.length - 20);
      }
      return updated;
    });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      originalError.apply(console, args);

      const message = args
        .map((arg) => {
          if (arg instanceof Error) return arg.message;
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');
      
      const errorObj = args.find((arg) => arg instanceof Error);
      const stack = errorObj ? errorObj.stack : undefined;
      
      // Prevent infinite loops if react-dom itself prints errors during rendering of logs
      if (!message.includes('useDebugLogs')) {
        addLog('error', message, stack);
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn.apply(console, args);

      const message = args
        .map((arg) => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(' ');

      if (!message.includes('useDebugLogs')) {
        addLog('warn', message);
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      addLog('error', event.message, event.error?.stack);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason);
      const stack = reason instanceof Error ? reason.stack : undefined;
      addLog('error', `Unhandled Promise Rejection: ${message}`, stack);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <DebugLogContext.Provider value={{ logs, clearLogs, addLog }}>
      {children}
    </DebugLogContext.Provider>
  );
};

export const useDebugLogs = () => {
  const context = useContext(DebugLogContext);
  if (context === undefined) {
    throw new Error('useDebugLogs must be used within a DebugLogProvider');
  }
  return context;
};
