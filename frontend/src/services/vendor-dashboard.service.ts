/**
 * Vendor Dashboard API Service
 * Story 8.5: Vendor Dashboard
 *
 * Provides API client methods for vendor dashboard endpoints.
 */

import { apiClient } from '@/lib/api';
import {
  vendorDashboardSchema,
  jobsBySpecializationListSchema,
  performanceSnapshotListSchema,
  expiringDocumentsListSchema,
  topVendorsListSchema,
  vendorKpiSchema,
} from '@/lib/validations/vendor-dashboard';
import type {
  VendorDashboard,
  VendorKpi,
  JobsBySpecialization,
  VendorPerformanceSnapshot,
  ExpiringDocument,
  TopVendor,
  ExpiringDocumentsParams,
  TopVendorsParams,
} from '@/types/vendor-dashboard';

const BASE_URL = '/api/v1/dashboard/vendor';

/**
 * Fetch complete vendor dashboard data (AC-9)
 * GET /api/v1/dashboard/vendor
 */
export async function fetchVendorDashboard(): Promise<VendorDashboard> {
  const response = await apiClient.get<VendorDashboard>(BASE_URL);
  return vendorDashboardSchema.parse(response.data) as VendorDashboard;
}

/**
 * Fetch vendor KPIs only (AC-1 to AC-4)
 * GET /api/v1/dashboard/vendor/kpis
 */
export async function fetchVendorKpis(): Promise<VendorKpi> {
  const response = await apiClient.get<VendorKpi>(`${BASE_URL}/kpis`);
  return vendorKpiSchema.parse(response.data) as VendorKpi;
}

/**
 * Fetch jobs by specialization for bar chart (AC-5, AC-10)
 * GET /api/v1/dashboard/vendor/jobs-by-specialization
 */
export async function fetchJobsBySpecialization(): Promise<JobsBySpecialization[]> {
  const response = await apiClient.get<JobsBySpecialization[]>(`${BASE_URL}/jobs-by-specialization`);
  return jobsBySpecializationListSchema.parse(response.data) as JobsBySpecialization[];
}

/**
 * Fetch vendor performance snapshot for scatter plot (AC-6, AC-11)
 * GET /api/v1/dashboard/vendor/performance-snapshot
 */
export async function fetchPerformanceSnapshot(): Promise<VendorPerformanceSnapshot[]> {
  const response = await apiClient.get<VendorPerformanceSnapshot[]>(`${BASE_URL}/performance-snapshot`);
  return performanceSnapshotListSchema.parse(response.data) as VendorPerformanceSnapshot[];
}

/**
 * Fetch expiring documents list (AC-7, AC-12)
 * GET /api/v1/dashboard/vendor/expiring-documents
 */
export async function fetchExpiringDocuments(
  params?: ExpiringDocumentsParams
): Promise<ExpiringDocument[]> {
  const response = await apiClient.get<ExpiringDocument[]>(`${BASE_URL}/expiring-documents`, {
    params: {
      days: params?.days ?? 30,
      limit: params?.limit ?? 10,
    },
  });
  return expiringDocumentsListSchema.parse(response.data) as ExpiringDocument[];
}

/**
 * Fetch top vendors by jobs (AC-8, AC-13)
 * GET /api/v1/dashboard/vendor/top-vendors
 */
export async function fetchTopVendors(params?: TopVendorsParams): Promise<TopVendor[]> {
  const response = await apiClient.get<TopVendor[]>(`${BASE_URL}/top-vendors`, {
    params: {
      limit: params?.limit ?? 5,
    },
  });
  return topVendorsListSchema.parse(response.data) as TopVendor[];
}

// Export all functions as a service object for convenient importing
export const vendorDashboardService = {
  fetchVendorDashboard,
  fetchVendorKpis,
  fetchJobsBySpecialization,
  fetchPerformanceSnapshot,
  fetchExpiringDocuments,
  fetchTopVendors,
};

export default vendorDashboardService;
