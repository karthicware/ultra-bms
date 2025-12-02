/**
 * Unit tests for useAssetsDashboard hooks
 * Story 8.7: Assets Dashboard
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useAssetsDashboard,
  useAssetKpis,
  useAssetsByCategory,
  useTopMaintenanceSpend,
  useOverduePmAssets,
  useRecentlyAddedAssets,
  useDepreciationSummary,
  assetsDashboardKeys,
} from '../useAssetsDashboard';
import * as assetsDashboardService from '@/services/assets-dashboard.service';
import type { AssetsDashboard } from '@/types/assets-dashboard';
import { AssetCategory } from '@/types/asset';

// Mock the service
jest.mock('@/services/assets-dashboard.service');

const mockService = assetsDashboardService as jest.Mocked<typeof assetsDashboardService>;

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

describe('useAssetsDashboard hooks', () => {
  const mockDashboardData: AssetsDashboard = {
    kpis: {
      totalRegisteredAssets: 150,
      totalAssetValue: 2500000,
      assetsWithOverduePm: 5,
      mostExpensiveAsset: {
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        assetName: 'Main HVAC Unit',
        assetNumber: 'AST-2024-0001',
        tco: 350000,
      },
    },
    assetsByCategory: [
      {
        category: AssetCategory.HVAC,
        categoryDisplayName: 'HVAC',
        count: 50,
        percentage: 33.33,
      },
      {
        category: AssetCategory.ELEVATOR,
        categoryDisplayName: 'Elevator',
        count: 30,
        percentage: 20,
      },
    ],
    topMaintenanceSpend: [
      {
        assetId: '123e4567-e89b-12d3-a456-426614174000',
        assetName: 'Main HVAC Unit',
        assetNumber: 'AST-2024-0001',
        category: AssetCategory.HVAC,
        categoryDisplayName: 'HVAC',
        maintenanceCost: 75000,
      },
    ],
    overduePmAssets: [
      {
        assetId: '223e4567-e89b-12d3-a456-426614174001',
        assetName: 'Elevator 1',
        assetNumber: 'AST-2024-0002',
        category: AssetCategory.ELEVATOR,
        categoryDisplayName: 'Elevator',
        propertyId: '323e4567-e89b-12d3-a456-426614174002',
        propertyName: 'Tower A',
        lastPmDate: '2024-10-01',
        nextPmDate: '2024-11-01',
        daysOverdue: 31,
        isCritical: true,
      },
    ],
    recentlyAddedAssets: [
      {
        assetId: '423e4567-e89b-12d3-a456-426614174003',
        assetName: 'New Generator',
        assetNumber: 'AST-2024-0003',
        category: AssetCategory.GENERATOR,
        categoryDisplayName: 'Generator',
        propertyId: '323e4567-e89b-12d3-a456-426614174002',
        propertyName: 'Tower B',
        addedDate: '2024-12-01T10:00:00',
        value: 150000,
      },
    ],
    depreciationSummary: {
      originalValueTotal: 2000000,
      currentValueTotal: 1500000,
      totalDepreciation: 500000,
      depreciationPercentage: 25,
      totalDepreciableAssets: 100,
      fullyDepreciatedAssets: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assetsDashboardKeys', () => {
    it('should generate correct query keys', () => {
      expect(assetsDashboardKeys.all).toEqual(['assetsDashboard']);
      expect(assetsDashboardKeys.dashboard()).toEqual(['assetsDashboard', 'dashboard']);
      expect(assetsDashboardKeys.kpis()).toEqual(['assetsDashboard', 'kpis']);
      expect(assetsDashboardKeys.byCategory()).toEqual(['assetsDashboard', 'byCategory']);
      expect(assetsDashboardKeys.topMaintenanceSpend()).toEqual([
        'assetsDashboard',
        'topMaintenanceSpend',
      ]);
      expect(assetsDashboardKeys.overduePm()).toEqual(['assetsDashboard', 'overduePm']);
      expect(assetsDashboardKeys.recentlyAdded()).toEqual(['assetsDashboard', 'recentlyAdded']);
      expect(assetsDashboardKeys.depreciationSummary()).toEqual([
        'assetsDashboard',
        'depreciationSummary',
      ]);
    });
  });

  describe('useAssetsDashboard', () => {
    it('should fetch dashboard data successfully', async () => {
      mockService.fetchAssetsDashboard.mockResolvedValue(mockDashboardData);

      const { result } = renderHook(() => useAssetsDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData);
      expect(mockService.fetchAssetsDashboard).toHaveBeenCalledTimes(1);
    });

    it('should handle error state', async () => {
      const error = new Error('Failed to fetch');
      mockService.fetchAssetsDashboard.mockRejectedValue(error);

      const { result } = renderHook(() => useAssetsDashboard(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(error);
    });
  });

  describe('useAssetKpis', () => {
    it('should fetch KPIs successfully', async () => {
      mockService.fetchAssetKpis.mockResolvedValue(mockDashboardData.kpis);

      const { result } = renderHook(() => useAssetKpis(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.kpis);
    });
  });

  describe('useAssetsByCategory', () => {
    it('should fetch assets by category', async () => {
      mockService.fetchAssetsByCategory.mockResolvedValue(mockDashboardData.assetsByCategory);

      const { result } = renderHook(() => useAssetsByCategory(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.assetsByCategory);
    });
  });

  describe('useTopMaintenanceSpend', () => {
    it('should fetch top maintenance spend', async () => {
      mockService.fetchTopMaintenanceSpend.mockResolvedValue(mockDashboardData.topMaintenanceSpend);

      const { result } = renderHook(() => useTopMaintenanceSpend(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.topMaintenanceSpend);
    });
  });

  describe('useOverduePmAssets', () => {
    it('should fetch overdue PM assets', async () => {
      mockService.fetchOverduePmAssets.mockResolvedValue(mockDashboardData.overduePmAssets);

      const { result } = renderHook(() => useOverduePmAssets(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.overduePmAssets);
    });
  });

  describe('useRecentlyAddedAssets', () => {
    it('should fetch recently added assets', async () => {
      mockService.fetchRecentlyAddedAssets.mockResolvedValue(
        mockDashboardData.recentlyAddedAssets
      );

      const { result } = renderHook(() => useRecentlyAddedAssets(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.recentlyAddedAssets);
    });
  });

  describe('useDepreciationSummary', () => {
    it('should fetch depreciation summary', async () => {
      mockService.fetchDepreciationSummary.mockResolvedValue(
        mockDashboardData.depreciationSummary
      );

      const { result } = renderHook(() => useDepreciationSummary(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardData.depreciationSummary);
    });
  });
});
