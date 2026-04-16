import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border-2 border-dashed border-red-200 dark:border-red-800 m-4">
          <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
            <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-sm text-red-600 dark:text-red-500 max-w-md mb-6">
            Ocorreu um erro inesperado ao renderizar esta parte da aplicação. 
            Tente recarregar a página ou limpar os filtros.
          </p>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-100 dark:border-red-900 text-left w-full max-w-lg overflow-auto max-h-40 mb-6">
            <p className="font-mono text-[10px] text-red-500 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
