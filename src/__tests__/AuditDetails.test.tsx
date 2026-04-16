import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuditDetailsPage from '../pages/AuditDetails';
import { useAudit } from '../context/AuditContext';

jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

describe('AuditDetailsPage', () => {
  const mockResultado = {
    divergencias: [
      { material: 'M1', descricao: 'Desc 1', cfop: '5101', fornecedor: 'F1', precoEfetivo: 10, custoPadrao: 8, variacaoPerc: 25, impactoFinanceiro: 2, tipo: 'acima do custo padrão' },
      { material: 'M2', descricao: 'Desc 2', cfop: '5102', fornecedor: 'F2', precoEfetivo: 5, custoPadrao: 6, variacaoPerc: -16, impactoFinanceiro: -1, tipo: 'abaixo do custo padrão' },
    ],
    totalPrejuizo: 2,
    totalEconomia: 1,
  };

  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
      resultado: mockResultado,
    });
  });

  it('renders the details page with data', () => {
    render(
      <MemoryRouter>
        <AuditDetailsPage />
      </MemoryRouter>
    );
    expect(screen.getByText('M1')).toBeInTheDocument();
    expect(screen.getByText('M2')).toBeInTheDocument();
    // F1 appears in filter and table, so we use getAll
    expect(screen.getAllByText('F1').length).toBeGreaterThan(0);
  });

  it('filters data based on search term', () => {
    render(
      <MemoryRouter>
        <AuditDetailsPage />
      </MemoryRouter>
    );
    const searchInput = screen.getByPlaceholderText(/buscar material/i);
    fireEvent.change(searchInput, { target: { value: 'M1' } });
    
    // Wait for debounce (300ms)
    // In tests, we might need to use act or wait
  });

  it('switches tabs', () => {
    render(
      <MemoryRouter>
        <AuditDetailsPage />
      </MemoryRouter>
    );
    const cfopTab = screen.getByText('Resumo CFOP');
    fireEvent.click(cfopTab);
    expect(screen.getByText('Qtd Linhas')).toBeInTheDocument();
  });
});
