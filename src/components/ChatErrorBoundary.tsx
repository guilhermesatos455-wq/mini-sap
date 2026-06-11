import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ChatErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chat Error Boundary caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-sm text-red-500">
          Ops, ocorreu um erro no chat. Tente recarregar.
          <button onClick={() => this.setState({ hasError: false })} className="block mx-auto mt-2 text-xs underline">Recarregar</button>
        </div>
      );
    }

    return this.props.children;
  }
}
