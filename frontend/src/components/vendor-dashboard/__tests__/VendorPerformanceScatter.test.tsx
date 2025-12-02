/**
 * Unit tests for VendorPerformanceScatter component
 * Story 8.5: Vendor Dashboard (AC-6, AC-14, AC-15, AC-17, AC-19)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { VendorPerformanceScatter } from '../VendorPerformanceScatter';
import type { VendorPerformanceSnapshot } from '@/types/vendor-dashboard';
import { PerformanceTier, calculateBubbleSize, BUBBLE_SIZE } from '@/types/vendor-dashboard';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ScatterChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter-chart">{children}</div>
  ),
  Scatter: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="scatter">{children}</div>
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  ZAxis: () => <div data-testid="z-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}));

describe('VendorPerformanceScatter', () => {
  const mockData: VendorPerformanceSnapshot[] = [
    {
      vendorId: '123e4567-e89b-12d3-a456-426614174000',
      vendorName: 'Top Plumber',
      slaCompliance: 92.5,
      rating: 4.5,
      jobCount: 100,
      performanceTier: PerformanceTier.GREEN,
    },
    {
      vendorId: '223e4567-e89b-12d3-a456-426614174001',
      vendorName: 'Average HVAC',
      slaCompliance: 65.0,
      rating: 3.5,
      jobCount: 50,
      performanceTier: PerformanceTier.YELLOW,
    },
    {
      vendorId: '323e4567-e89b-12d3-a456-426614174002',
      vendorName: 'Poor Electrician',
      slaCompliance: 40.0,
      rating: 2.5,
      jobCount: 20,
      performanceTier: PerformanceTier.RED,
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('AC-6: Scatter Plot Display', () => {
    it('should render scatter chart with data', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('should display chart title and description', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByText('Vendor Performance Snapshot')).toBeInTheDocument();
      expect(
        screen.getByText(/SLA compliance vs customer rating/)
      ).toBeInTheDocument();
    });
  });

  describe('AC-14: Uses Recharts ScatterChart', () => {
    it('should render ScatterChart component', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByTestId('scatter-chart')).toBeInTheDocument();
    });

    it('should have X and Y axes', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });
  });

  describe('AC-15: Bubble Size Proportional to Job Count', () => {
    it('should calculate bubble size correctly for minimum', () => {
      const size = calculateBubbleSize(0, 100);
      expect(size).toBe(BUBBLE_SIZE.MIN);
    });

    it('should calculate bubble size correctly for maximum', () => {
      const size = calculateBubbleSize(100, 100);
      expect(size).toBe(BUBBLE_SIZE.MAX);
    });

    it('should calculate bubble size correctly for mid-range', () => {
      const size = calculateBubbleSize(50, 100);
      const expected = BUBBLE_SIZE.MIN + 0.5 * (BUBBLE_SIZE.MAX - BUBBLE_SIZE.MIN);
      expect(size).toBe(expected);
    });
  });

  describe('AC-17: Tooltip Shows Vendor Details', () => {
    it('should render tooltip component', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('Performance Tier Color Coding', () => {
    it('should display legend with all performance tiers', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByText('High Performer')).toBeInTheDocument();
      expect(screen.getByText('Average Performer')).toBeInTheDocument();
      expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
    });
  });

  describe('AC-19: Data Test IDs', () => {
    it('should have data-testid on chart container', () => {
      render(<VendorPerformanceScatter data={mockData} />);
      expect(screen.getByTestId('vendor-performance-scatter-chart')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      render(<VendorPerformanceScatter data={undefined} isLoading={true} />);
      expect(screen.getByText('Vendor Performance Snapshot')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show message when no data', () => {
      render(<VendorPerformanceScatter data={[]} />);
      expect(screen.getByText('No vendor performance data available')).toBeInTheDocument();
    });
  });
});
