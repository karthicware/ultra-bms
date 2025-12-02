/**
 * Tests for KpiCard and KpiCardsGrid components
 * Story 8.1: Executive Summary Dashboard
 * AC-1 to AC-4: KPI card rendering and functionality
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { KpiCard, KpiCardsGrid } from '../KpiCard';
import type { KpiCards, KpiCard as KpiCardType, ReceivablesKpi, TrendDirection } from '@/types/dashboard';

// Mock data matching the actual type definitions
const mockKpiCardData: KpiCardType = {
  value: 150000,
  previousValue: 130000,
  changePercentage: 15.4,
  trend: 'UP' as TrendDirection,
  formattedValue: 'AED 150,000',
  unit: 'AED'
};

const mockReceivablesKpi: ReceivablesKpi = {
  totalAmount: 35000,
  changePercentage: 5.2,
  trend: 'UP' as TrendDirection,
  aging: {
    current: 15000,
    thirtyPlus: 10000,
    sixtyPlus: 5000,
    ninetyPlus: 5000
  }
};

const mockKpiCards: KpiCards = {
  netProfitLoss: {
    value: 150000,
    previousValue: 130000,
    changePercentage: 15.4,
    trend: 'UP' as TrendDirection,
    formattedValue: 'AED 150,000',
    unit: 'AED'
  },
  occupancyRate: {
    value: 92.5,
    previousValue: 90,
    changePercentage: 2.8,
    trend: 'UP' as TrendDirection,
    formattedValue: '92.5%',
    unit: '%'
  },
  overdueMaintenance: {
    value: 8,
    previousValue: 12,
    changePercentage: -33.3,
    trend: 'DOWN' as TrendDirection,
    formattedValue: '8',
    unit: 'items'
  },
  outstandingReceivables: mockReceivablesKpi
};

describe('KpiCard', () => {
  it('should render title and formatted value', () => {
    render(
      <KpiCard
        title="Net Profit/Loss"
        data={mockKpiCardData}
        isLoading={false}
      />
    );

    expect(screen.getByText('Net Profit/Loss')).toBeInTheDocument();
    expect(screen.getByText('AED 150,000')).toBeInTheDocument();
  });

  it('should render skeleton when loading', () => {
    const { container } = render(
      <KpiCard
        title="Net Profit/Loss"
        data={mockKpiCardData}
        isLoading={true}
      />
    );

    // Should have skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render trend indicator for UP trend', () => {
    render(
      <KpiCard
        title="Net Profit/Loss"
        data={mockKpiCardData}
        isLoading={false}
        higherIsBetter={true}
      />
    );

    // Should show percentage change
    expect(screen.getByText('15.4%')).toBeInTheDocument();
  });
});

describe('KpiCardsGrid', () => {
  it('should render all four KPI cards when data is provided - AC-1 to AC-4', () => {
    render(<KpiCardsGrid kpis={mockKpiCards} isLoading={false} />);

    // AC-1: Net Profit/Loss
    expect(screen.getByText('Net Profit/Loss')).toBeInTheDocument();

    // AC-2: Occupancy Rate
    expect(screen.getByText('Occupancy Rate')).toBeInTheDocument();

    // AC-3: Overdue Maintenance
    expect(screen.getByText('Overdue Maintenance')).toBeInTheDocument();

    // AC-4: Outstanding Receivables
    expect(screen.getByText('Outstanding Receivables')).toBeInTheDocument();
  });

  it('should render loading skeletons when isLoading is true', () => {
    const { container } = render(<KpiCardsGrid kpis={null} isLoading={true} />);

    // Should render 4 card skeletons
    const cards = container.querySelectorAll('[class*="card"], [class*="Card"]');
    expect(cards.length).toBe(4);
  });

  it('should render receivables aging breakdown - AC-4', () => {
    render(<KpiCardsGrid kpis={mockKpiCards} isLoading={false} />);

    // Check for aging breakdown labels
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('30+')).toBeInTheDocument();
    expect(screen.getByText('60+')).toBeInTheDocument();
    expect(screen.getByText('90+')).toBeInTheDocument();
  });

  it('should display formatted currency values', () => {
    render(<KpiCardsGrid kpis={mockKpiCards} isLoading={false} />);

    expect(screen.getByText('AED 150,000')).toBeInTheDocument();
  });

  it('should display percentage values for occupancy rate', () => {
    render(<KpiCardsGrid kpis={mockKpiCards} isLoading={false} />);

    expect(screen.getByText('92.5%')).toBeInTheDocument();
  });
});
