import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../pages/Dashboard';
import { useAudit } from '../context/AuditContext';

jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

// Mock recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
      isProcessing: false,
      status: '',
      progressPercent: 0,
      resultado: {
        qtdDiv: 10,
        totalPrejuizo: 1000,
        totalEconomia: 500,
        qtdAusentes: 2,
        materiaisNoCkm3: 100,
        dataProcessamento: new Date().toISOString(),
        divergencias: [
          { fornecedor: 'Forn 1', tipo: 'acima do custo padrão', impactoFinanceiro: 100, cfop: '5101', material: 'M1', descricao: 'Desc 1', variacaoPerc: 10 },
          { fornecedor: 'Forn 2', tipo: 'abaixo do custo padrão', impactoFinanceiro: -50, cfop: '5102', material: 'M2', descricao: 'Desc 2', variacaoPerc: 5 },
        ],
      },
    });
  });

  it('renders summary stats', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Linhas Divergentes')).toBeInTheDocument();
    expect(screen.getByText('Total Acima do Custo Padrão')).toBeInTheDocument();
    expect(screen.getByText('Total Abaixo do Custo Padrão')).toBeInTheDocument();
  });

  it('renders the charts', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders the top suppliers table', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Top 5 Fornecedores por Acima do Custo Padrão')).toBeInTheDocument();
    expect(screen.getByText('Forn 1')).toBeInTheDocument();
  });

  it('renders processing state', () => {
    (useAudit as jest.Mock).mockReturnValue({
      isProcessing: true,
      progressPercent: 45,
      status: 'Lendo arquivos...',
      darkMode: false,
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Processando Auditoria...')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
    expect(screen.getByText('Lendo arquivos...')).toBeInTheDocument();
  });
});
