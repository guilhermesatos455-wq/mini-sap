import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAudit } from '../context/AuditContext';

jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

describe('BottomNav', () => {
  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
    });
  });

  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    );
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Dash')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
  });
});
