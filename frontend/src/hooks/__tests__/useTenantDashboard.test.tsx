/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for useTenantDashboard hook
 */
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTenantDashboard } from '../useTenantDashboard';
import * as tenantPortalService from '@/services/tenant-portal.service';

// Mock the service
jest.mock('@/services/tenant-portal.service');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useTenantDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch dashboard data successfully', async () => {
    const mockData = {
      currentUnit: {
        propertyName: 'Test Property',
        address: 'Test Address',
        unitNumber: '101',
        floor: 1,
        bedrooms: 2,
        bathrooms: 2,
        leaseStartDate: '2025-01-01',
        leaseEndDate: '2026-01-01',
        daysRemaining: 365,
        leaseStatus: 'ACTIVE',
      },
      stats: {
        outstandingBalance: 0,
        nextPaymentDue: null,
        openRequestsCount: 0,
        upcomingBookingsCount: 0,
      },
      quickActions: [],
    };

    (tenantPortalService.getDashboardData as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useTenantDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
  });

  it('should handle errors gracefully', async () => {
    (tenantPortalService.getDashboardData as jest.Mock).mockRejectedValue(
      new Error('API Error')
    );

    const { result } = renderHook(() => useTenantDashboard(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
