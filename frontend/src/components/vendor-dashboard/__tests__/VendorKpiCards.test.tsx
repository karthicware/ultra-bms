/**
 * Unit tests for VendorKpiCards component
 * Story 8.5: Vendor Dashboard (AC-1 to AC-4, AC-19)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VendorKpiCards } from '../VendorKpiCards';
import type { VendorKpi } from '@/types/vendor-dashboard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('VendorKpiCards', () => {
  const mockKpis: VendorKpi = {
    totalActiveVendors: 25,
    avgSlaCompliance: 87.5,
    topPerformingVendor: {
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'Acme Plumbing',
      rating: 4.8,
      totalJobsCompleted: 150,
    },
    expiringDocuments: {
      count: 5,
      hasCriticalExpiring: false,
    },
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('AC-1: Active Vendors KPI', () => {
    it('should display active vendor count', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Active Vendors')).toBeInTheDocument();
    });

    it('should navigate to active vendors list on click', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      const card = screen.getByTestId('vendor-kpi-active-vendors');
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith('/vendors?status=ACTIVE');
    });
  });

  describe('AC-2: SLA Compliance KPI', () => {
    it('should display SLA compliance percentage', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      expect(screen.getByText('87.5%')).toBeInTheDocument();
      expect(screen.getByText('Avg SLA Compliance')).toBeInTheDocument();
    });
  });

  describe('AC-3: Top Performer KPI', () => {
    it('should display top performing vendor name', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      expect(screen.getByText('Acme Plumbing')).toBeInTheDocument();
    });

    it('should display star rating badge', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      expect(screen.getByText('★ 4.8')).toBeInTheDocument();
    });

    it('should navigate to vendor profile on click', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      const card = screen.getByTestId('vendor-kpi-top-performer');
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith('/vendors/123e4567-e89b-12d3-a456-426614174000');
    });

    it('should show N/A when no top vendor', () => {
      const kpisNoTop = { ...mockKpis, topPerformingVendor: null };
      render(<VendorKpiCards kpis={kpisNoTop} />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('AC-4: Expiring Documents KPI', () => {
    it('should display expiring documents count', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Expiring Documents')).toBeInTheDocument();
    });

    it('should highlight in red when critical documents expiring', () => {
      const kpisCritical = {
        ...mockKpis,
        expiringDocuments: { count: 3, hasCriticalExpiring: true },
      };
      render(<VendorKpiCards kpis={kpisCritical} />);
      const card = screen.getByTestId('vendor-kpi-expiring-docs');
      expect(card).toHaveClass('border-red-500');
    });

    it('should navigate to expiring documents on click', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      const card = screen.getByTestId('vendor-kpi-expiring-docs');
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith('/vendors/documents?expiring=true');
    });
  });

  describe('AC-19: Data Test IDs', () => {
    it('should have data-testid on all KPI cards', () => {
      render(<VendorKpiCards kpis={mockKpis} />);
      expect(screen.getByTestId('vendor-kpi-active-vendors')).toBeInTheDocument();
      expect(screen.getByTestId('vendor-kpi-sla-compliance')).toBeInTheDocument();
      expect(screen.getByTestId('vendor-kpi-top-performer')).toBeInTheDocument();
      expect(screen.getByTestId('vendor-kpi-expiring-docs')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should render skeleton loaders when loading', () => {
      render(<VendorKpiCards kpis={undefined} isLoading={true} />);
      // Should have 4 skeleton cards
      const cards = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('animate-pulse')
      );
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});
