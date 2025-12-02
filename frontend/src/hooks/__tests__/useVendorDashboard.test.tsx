/**
 * Unit tests for useVendorDashboard hooks
 * Story 8.5: Vendor Dashboard
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useVendorDashboard,
  useVendorKpis,
  useJobsBySpecialization,
  usePerformanceSnapshot,
  useExpiringDocuments,
  useTopVendors,
  vendorDashboardKeys,
} from '../useVendorDashboard';
import * as vendorDashboardService from '@/services/vendor-dashboard.service';
import type { VendorDashboard, VendorKpi } from '@/types/vendor-dashboard';
import { PerformanceTier, VendorDocumentType } from '@/types/vendor-dashboard';

// Mock the service
jest.mock('@/services/vendor-dashboard.service');

const mockService = vendorDashboardService as jest.Mocked<typeof vendorDashboardService>;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
);

describe('useVendorDashboard hooks', () => {
  const mockDashboardData: VendorDashboard = {
    kpis: {
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
    },
    jobsBySpecialization: [
      {
        specialization: 'PLUMBING' as any,
        displayName: 'Plumbing',
        jobCount: 50,
        vendorCount: 8,
      },
    ],
    performanceSnapshot: [
      {
        vendorId: '123e4567-e89b-12d3-a456-426614174000',
        vendorName: 'Acme Plumbing',
        slaCompliance: 92.5,
        rating: 4.5,
        jobCount: 100,
        performanceTier: PerformanceTier.GREEN,
      },
    ],
    expiringDocuments: [
      {
        documentId: '223e4567-e89b-12d3-a456-426614174001',
        vendorId: 'vendor-001',
        vendorName: 'Acme Plumbing',
        documentType: VendorDocumentType.TRADE_LICENSE,
        documentTypeName: 'Trade License',
        expiryDate: '2025-01-15',
        daysUntilExpiry: 5,
        isCritical: true,
      },
    ],
    topVendors: [
      {
        rank: 1,
        vendorId: '123e4567-e89b-12d3-a456-426614174000',
        vendorName: 'Acme Plumbing',
        jobsCompletedThisMonth: 25,
        avgRating: 4.8,
        totalJobsCompleted: 150,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('vendorDashboardKeys', () => {
    it('should generate correct query keys', () => {
      expect(vendorDashboardKeys.all).toEqual(['vendorDashboard']);
      expect(vendorDashboardKeys.dashboard()).toEqual(['vendorDashboard', 'dashboard']);
      expect(vendorDashboardKeys.kpis()).toEqual(['vendorDashboard', 'kpis']);
      expect(vendorDashboardKeys.jobsBySpecialization()).toEqual([
        'vendorDashboard',
        'jobsBySpecialization',
      ]);
      expect(vendorDashboardKeys.performanceSnapshot()).toEqual([
        'vendorDashboard',
        'performanceSnapshot',
      ]);
      expect(vendorDashboardKeys.expiringDocuments({ days: 30 })).toEqual([
        'vendorDashboard',
        'expiringDocuments',
        { days: 30 },
      ]);
      expect(vendorDashboardKeys.topVendors({ limit: 5 })).toEqual([
        'vendorDashboard',
        'topVendors',
        { limit: 5 },
      ]);
    });
  });

  describe('useVendorDashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      mockService.fetchVendorDashboard.mockResolvedValue(mockDashboardData);

      const { result } = renderHook(() => useVendorDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData);
      expect(mockService.fetchVendorDashboard).toHaveBeenCalledTimes(1);
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch');
      mockService.fetchVendorDashboard.mockRejectedValue(error);

      const { result } = renderHook(() => useVendorDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe('useVendorKpis', () => {
    it('should fetch KPIs successfully', async () => {
      mockService.fetchVendorKpis.mockResolvedValue(mockDashboardData.kpis);

      const { result } = renderHook(() => useVendorKpis(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.kpis);
    });
  });

  describe('useJobsBySpecialization', () => {
    it('should fetch jobs by specialization', async () => {
      mockService.fetchJobsBySpecialization.mockResolvedValue(
        mockDashboardData.jobsBySpecialization
      );

      const { result } = renderHook(() => useJobsBySpecialization(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.jobsBySpecialization);
    });
  });

  describe('usePerformanceSnapshot', () => {
    it('should fetch performance snapshot', async () => {
      mockService.fetchPerformanceSnapshot.mockResolvedValue(
        mockDashboardData.performanceSnapshot
      );

      const { result } = renderHook(() => usePerformanceSnapshot(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.performanceSnapshot);
    });
  });

  describe('useExpiringDocuments', () => {
    it('should fetch expiring documents with default params', async () => {
      mockService.fetchExpiringDocuments.mockResolvedValue(
        mockDashboardData.expiringDocuments
      );

      const { result } = renderHook(() => useExpiringDocuments(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.expiringDocuments);
      expect(mockService.fetchExpiringDocuments).toHaveBeenCalledWith(undefined);
    });

    it('should fetch with custom params', async () => {
      mockService.fetchExpiringDocuments.mockResolvedValue(
        mockDashboardData.expiringDocuments
      );

      const { result } = renderHook(
        () => useExpiringDocuments({ days: 60, limit: 20 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.fetchExpiringDocuments).toHaveBeenCalledWith({
        days: 60,
        limit: 20,
      });
    });
  });

  describe('useTopVendors', () => {
    it('should fetch top vendors with default params', async () => {
      mockService.fetchTopVendors.mockResolvedValue(mockDashboardData.topVendors);

      const { result } = renderHook(() => useTopVendors(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.topVendors);
      expect(mockService.fetchTopVendors).toHaveBeenCalledWith(undefined);
    });

    it('should fetch with custom limit', async () => {
      mockService.fetchTopVendors.mockResolvedValue(mockDashboardData.topVendors);

      const { result } = renderHook(() => useTopVendors({ limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockService.fetchTopVendors).toHaveBeenCalledWith({ limit: 10 });
    });
  });
});
