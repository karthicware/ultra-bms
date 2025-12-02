/**
 * Tests for OccupancyKpiCards component
 * Story 8.3: Occupancy Dashboard
 * AC-1 to AC-4: KPI card rendering and functionality
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { OccupancyKpiCards } from '../OccupancyKpiCards';
import type { OccupancyKpis, OccupancyKpiValue } from '@/types';
import { TrendDirection } from '@/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock data
const mockKpiValue = (
  value: number,
  formattedValue: string,
  trend: TrendDirection = TrendDirection.UP,
  changePercentage: number = 5.0
): OccupancyKpiValue => ({
  value,
  previousValue: value * 0.95,
  changePercentage,
  trend,
  formattedValue,
  unit: '%'
});

const mockOccupancyKpis: OccupancyKpis = {
  portfolioOccupancy: mockKpiValue(92.5, '92.5%', TrendDirection.UP, 2.5),
  vacantUnits: mockKpiValue(8, '8', TrendDirection.DOWN, -20),
  leasesExpiring: mockKpiValue(15, '15', TrendDirection.UP, 10),
  averageRentPerSqft: mockKpiValue(20.5, 'AED 20.50', TrendDirection.UP, 3.2)
};

describe('OccupancyKpiCards', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
  });

  describe('Rendering', () => {
    it('should render all four KPI cards - AC-1 to AC-4', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      // AC-1: Portfolio Occupancy
      expect(screen.getByText('Portfolio Occupancy')).toBeInTheDocument();

      // AC-2: Vacant Units
      expect(screen.getByText('Vacant Units')).toBeInTheDocument();

      // AC-3: Leases Expiring
      expect(screen.getByText(/Leases Expiring/)).toBeInTheDocument();

      // AC-4: Avg Rent/SqFt
      expect(screen.getByText('Avg Rent/SqFt')).toBeInTheDocument();
    });

    it('should display formatted values for each KPI', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      expect(screen.getByText('92.5%')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('AED 20.50')).toBeInTheDocument();
    });

    it('should render loading skeletons when isLoading is true', () => {
      const { container } = render(
        <OccupancyKpiCards kpis={null} isLoading={true} />
      );

      // Should render 4 card skeletons
      const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
      expect(cards.length).toBe(4);
    });

    it('should have data-testid attributes for testing', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      expect(screen.getByTestId('occupancy-kpi-cards')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-portfolio-occupancy')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-vacant-units')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-leases-expiring')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-avg-rent-sqft')).toBeInTheDocument();
    });
  });

  describe('AC-1: Portfolio Occupancy with Progress', () => {
    it('should display progress indicator for portfolio occupancy', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      const progressBar = screen.getByTestId('kpi-portfolio-occupancy-progress');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show occupied percentage text', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      expect(screen.getByText('92.5% occupied')).toBeInTheDocument();
    });
  });

  describe('AC-2: Vacant Units Click Navigation', () => {
    it('should navigate to units page when vacant units card is clicked', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      const vacantUnitsCard = screen.getByTestId('kpi-vacant-units');
      fireEvent.click(vacantUnitsCard);

      expect(mockPush).toHaveBeenCalledWith('/units?status=vacant');
    });

    it('should have cursor-pointer class on clickable card', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      const vacantUnitsCard = screen.getByTestId('kpi-vacant-units');
      expect(vacantUnitsCard).toHaveClass('cursor-pointer');
    });
  });

  describe('AC-3: Configurable Expiry Period', () => {
    it('should display configurable expiry period in title', () => {
      render(
        <OccupancyKpiCards
          kpis={mockOccupancyKpis}
          isLoading={false}
          expiryPeriodDays={90}
        />
      );

      expect(screen.getByText('Leases Expiring (90 days)')).toBeInTheDocument();
    });

    it('should default to 100 days if not specified', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      expect(screen.getByText('Leases Expiring (100 days)')).toBeInTheDocument();
    });
  });

  describe('Trend Indicators', () => {
    it('should show trend indicators with correct styling', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      // Trend indicators should be present
      const trendIndicators = screen.getAllByTestId('trend-indicator');
      expect(trendIndicators.length).toBeGreaterThan(0);
    });

    it('should display change percentages', () => {
      render(<OccupancyKpiCards kpis={mockOccupancyKpis} isLoading={false} />);

      // Should display trend percentages
      expect(screen.getByText('2.5%')).toBeInTheDocument();
    });
  });
});
