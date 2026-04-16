import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadPage from '../pages/Upload';
import { useAudit } from '../context/AuditContext';

jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

describe('UploadPage', () => {
  const mockIniciarProcessamento = jest.fn();
  const mockSetTolerancia = jest.fn();

  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
      filesNF: [],
      setFilesNF: jest.fn(),
      fileCKM3: null,
      setFileCKM3: jest.fn(),
      status: '',
      warnings: [],
      progressPercent: 0,
      isProcessing: false,
      tolerancia: 0.05,
      setTolerancia: mockSetTolerancia,
      cfops: '5101, 5102',
      setCfops: jest.fn(),
      dataInicio: '',
      setDataInicio: jest.fn(),
      dataFim: '',
      setDataFim: jest.fn(),
      colunaData: '',
      setColunaData: jest.fn(),
      mapColunas: { nfCfop: 'H', nfMat: 'K' },
      setMapColunas: jest.fn(),
      iniciarProcessamento: mockIniciarProcessamento,
    });
  });

  it('renders upload sections', () => {
    render(<UploadPage />);
    expect(screen.getByText('Notas Fiscais (Vários arquivos permitidos)')).toBeInTheDocument();
    expect(screen.getByText('Relatório CKM3 (Preço Médio SAP)')).toBeInTheDocument();
  });

  it('calls iniciarProcessamento when button is clicked', () => {
    render(<UploadPage />);
    const button = screen.getByRole('button', { name: /iniciar auditoria/i });
    fireEvent.click(button);
    expect(mockIniciarProcessamento).toHaveBeenCalled();
  });

  it('updates tolerance value', () => {
    render(<UploadPage />);
    const input = screen.getByLabelText(/tolerância de variação/i);
    fireEvent.change(input, { target: { value: '0.1' } });
    expect(mockSetTolerancia).toHaveBeenCalledWith(0.1);
  });
});
