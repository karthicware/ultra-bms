/**
 * Tests for MaintenanceKpiCards component
 * Story 8.4: Maintenance Dashboard
 * AC-1 to AC-4: KPI card rendering and functionality
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MaintenanceKpiCards } from '../MaintenanceKpiCards';
import type { MaintenanceKpi } from '@/types/maintenance-dashboard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// Mock data
const mockKpis: MaintenanceKpi = {
  activeJobs: 45,
  overdueJobs: 8,
  pendingJobs: 12,
  completedThisMonth: 67,
  completedPreviousMonth: 58,
  monthOverMonthChange: 15.5
};

describe('MaintenanceKpiCards', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('should render all four KPI cards with correct values - AC-1 to AC-4', () => {
      render(<MaintenanceKpiCards kpis={mockKpis} isLoading={false} />);

      // AC-1: Active Jobs
      expect(screen.getByTestId('kpi-card-active-jobs')).toBeInTheDocument();
      expect(screen.getByText('Active Jobs')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();

      // AC-2: Overdue Jobs
      expect(screen.getByTestId('kpi-card-overdue-jobs')).toBeInTheDocument();
      expect(screen.getByText('Overdue Jobs')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      // AC-3: Pending Jobs
      expect(screen.getByTestId('kpi-card-pending-jobs')).toBeInTheDocument();
      expect(screen.getByText('Pending Jobs')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();

      // AC-4: Completed This Month
      expect(screen.getByTestId('kpi-card-completed-jobs')).toBeInTheDocument();
      expect(screen.getByText('Completed (This Month)')).toBeInTheDocument();
      expect(screen.getByText('67')).toBeInTheDocument();
    });

    it('should render loading skeletons when isLoading is true', () => {
      const { container } = render(
        <MaintenanceKpiCards kpis={undefined} isLoading={true} />
      );

      // Should render 4 card skeletons
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should display month-over-month trend indicator - AC-4', () => {
      render(<MaintenanceKpiCards kpis={mockKpis} isLoading={false} />);

      // Should show percentage change
      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });

    it('should highlight overdue jobs card when count > 0 - AC-2', () => {
      const { container } = render(
        <MaintenanceKpiCards kpis={mockKpis} isLoading={false} />
      );

      const overdueCard = screen.getByTestId('kpi-card-overdue-jobs');
      expect(overdueCard).toHaveClass('border-red-300');
    });

    it('should not highlight overdue jobs card when count is 0', () => {
      const kpisWithNoOverdue = { ...mockKpis, overdueJobs: 0 };
      render(<MaintenanceKpiCards kpis={kpisWithNoOverdue} isLoading={false} />);

      const overdueCard = screen.getByTestId('kpi-card-overdue-jobs');
      expect(overdueCard).not.toHaveClass('border-red-300');
    });
  });

  describe('Click navigation', () => {
    it('should navigate to active jobs filter when Active Jobs card is clicked', () => {
      render(<MaintenanceKpiCards kpis={mockKpis} isLoading={false} />);

      fireEvent.click(screen.getByTestId('kpi-card-active-jobs'));
      expect(mockPush).toHaveBeenCalledWith(
        '/maintenance/work-orders?status=OPEN,ASSIGNED,IN_PROGRESS'
      );
    });

    it('should navigate to overdue filter when Overdue Jobs card is clicked', () => {
      render(<MaintenanceKpiCards kpis={mockKpis} isLoading={false} />);

      fireEvent.click(screen.getByTestId('kpi-card-overdue-jobs'));
      expect(mockPush).toHaveBeenCalledWith('/maintenance/work-orders?overdue=true');
    });

    it('should navigate to pending filter when Pending Jobs card is clicked', () => {
      render(<MaintenanceKpiCards kpis={mockKpis} isLoading={false} />);

      fireEvent.click(screen.getByTestId('kpi-card-pending-jobs'));
      expect(mockPush).toHaveBeenCalledWith('/maintenance/work-orders?status=OPEN');
    });

    it('should navigate to completed filter when Completed card is clicked', () => {
      render(<MaintenanceKpiCards kpis={mockKpis} isLoading={false} />);

      fireEvent.click(screen.getByTestId('kpi-card-completed-jobs'));
      expect(mockPush).toHaveBeenCalledWith(
        '/maintenance/work-orders?status=COMPLETED,CLOSED'
      );
    });

    it('should call onKpiClick callback when provided', () => {
      const onKpiClick = jest.fn();
      render(
        <MaintenanceKpiCards kpis={mockKpis} isLoading={false} onKpiClick={onKpiClick} />
      );

      fireEvent.click(screen.getByTestId('kpi-card-active-jobs'));
      expect(onKpiClick).toHaveBeenCalledWith('active');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values gracefully', () => {
      const zeroKpis: MaintenanceKpi = {
        activeJobs: 0,
        overdueJobs: 0,
        pendingJobs: 0,
        completedThisMonth: 0,
        completedPreviousMonth: 0,
        monthOverMonthChange: null
      };

      render(<MaintenanceKpiCards kpis={zeroKpis} isLoading={false} />);

      // All cards should render with 0 values
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBe(4);
    });

    it('should handle undefined kpis', () => {
      render(<MaintenanceKpiCards kpis={undefined} isLoading={false} />);

      // Should still render cards with 0 values
      expect(screen.getByTestId('kpi-card-active-jobs')).toBeInTheDocument();
    });

    it('should format large numbers with locale string', () => {
      const largeKpis: MaintenanceKpi = {
        ...mockKpis,
        activeJobs: 1234567
      };

      render(<MaintenanceKpiCards kpis={largeKpis} isLoading={false} />);
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });
  });
});
