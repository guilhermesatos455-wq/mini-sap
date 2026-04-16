import React from 'react';
import { render, screen } from '@testing-library/react';
import HelpPage from '../pages/Help';
import { useAudit } from '../context/AuditContext';

// Mock the useAudit hook
jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

describe('HelpPage', () => {
  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
    });
  });

  it('renders the help page title', () => {
    render(<HelpPage />);
    expect(screen.getByText('Central de Ajuda')).toBeInTheDocument();
  });

  it('renders the help sections', () => {
    render(<HelpPage />);
    expect(screen.getByText('Como Iniciar uma Auditoria')).toBeInTheDocument();
    expect(screen.getByText('Configurando o Mapeamento')).toBeInTheDocument();
    expect(screen.getByText('Entendendo os Resultados')).toBeInTheDocument();
  });

  it('renders the support link', () => {
    render(<HelpPage />);
    const link = screen.getByRole('link', { name: /chamar no teams/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://teams.microsoft.com/l/chat/0/0?users=guilhermesouza@natulab.com.br');
  });
});
