import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAudit } from '../context/AuditContext';

jest.mock('../context/AuditContext', () => ({
  useAudit: jest.fn(),
}));

// Mock Sidebar and BottomNav to avoid their dependencies
jest.mock('../components/Sidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="sidebar">Sidebar</div>
}));
jest.mock('../components/BottomNav', () => ({
  __esModule: true,
  default: () => <div data-testid="bottom-nav">BottomNav</div>
}));

describe('Layout', () => {
  beforeEach(() => {
    (useAudit as jest.Mock).mockReturnValue({
      darkMode: false,
    });
  });

  it('renders sidebar and bottom nav', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
  });
});
