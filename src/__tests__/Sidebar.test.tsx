import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAudit } from '../context/AuditContext';

jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

describe('Sidebar', () => {
  const mockSetDarkMode = jest.fn();

  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
      setDarkMode: mockSetDarkMode,
    });
  });

  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Histórico')).toBeInTheDocument();
  });

  it('calls setDarkMode when toggle button is clicked', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    const toggleButton = screen.getByText('Modo Escuro');
    fireEvent.click(toggleButton);
    expect(mockSetDarkMode).toHaveBeenCalledWith(true);
  });
});
