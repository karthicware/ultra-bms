/**
 * Occupancy Dashboard API Service
 * Story 8.3: Occupancy Dashboard
 *
 * All occupancy dashboard-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  OccupancyDashboard,
  OccupancyDashboardResponse,
  LeaseExpirationItem,
  LeaseActivityItem,
  OccupancyDashboardFilter,
  OccupancyLeaseExpirationsFilter,
  OccupancyLeaseExpirationsResponse,
  RecentActivityFilter,
  RecentActivityResponse
} from '@/types';

const OCCUPANCY_DASHBOARD_BASE_PATH = '/v1/dashboard/occupancy';

// ============================================================================
// COMPLETE DASHBOARD (AC-9)
// ============================================================================

/**
 * Get complete occupancy dashboard data in a single call
 *
 * @param filter - Optional filter parameters (propertyId)
 *
 * @returns Promise that resolves to complete OccupancyDashboard data
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get dashboard for all properties
 * const dashboard = await getOccupancyDashboard();
 *
 * // Get dashboard for specific property
 * const dashboard = await getOccupancyDashboard({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000'
 * });
 *
 * // Access KPIs
 * console.log(dashboard.kpis.portfolioOccupancy.formattedValue); // "92.5%"
 * console.log(dashboard.kpis.vacantUnits.value); // 8
 * console.log(dashboard.kpis.leasesExpiring.value); // 15
 * console.log(dashboard.kpis.averageRentPerSqft.formattedValue); // "AED 20.00/sqft"
 *
 * // Access chart data
 * console.log(dashboard.occupancyChart.totalUnits); // 100
 * console.log(dashboard.leaseExpirationChart.monthlyData); // [...]
 * ```
 */
export async function getOccupancyDashboard(
  filter?: OccupancyDashboardFilter
): Promise<OccupancyDashboard> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);

  const queryString = params.toString();
  const url = `${OCCUPANCY_DASHBOARD_BASE_PATH}${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<OccupancyDashboardResponse>(url);
  return response.data.data;
}

// ============================================================================
// LEASE EXPIRATIONS LIST (AC-10)
// ============================================================================

/**
 * Get upcoming lease expirations with pagination
 *
 * @param filter - Optional filter parameters (propertyId, days, page, size)
 *
 * @returns Promise that resolves to list of LeaseExpirationItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get expirations within default 100 days
 * const expirations = await getLeaseExpirations();
 *
 * // Get expirations within 60 days with pagination
 * const expirations = await getLeaseExpirations({
 *   days: 60,
 *   page: 0,
 *   size: 20
 * });
 *
 * expirations.forEach(item => {
 *   console.log(`${item.tenantName} - ${item.unitNumber}`);
 *   console.log(`  Expires: ${item.expiryDate}`);
 *   console.log(`  Days remaining: ${item.daysRemaining}`);
 *   console.log(`  Status: ${item.renewalStatus}`);
 * });
 * ```
 */
export async function getOccupancyLeaseExpirations(
  filter?: OccupancyLeaseExpirationsFilter
): Promise<LeaseExpirationItem[]> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.days) params.append('days', filter.days.toString());
  if (filter?.page !== undefined) params.append('page', filter.page.toString());
  if (filter?.size) params.append('size', filter.size.toString());

  const queryString = params.toString();
  const url = `${OCCUPANCY_DASHBOARD_BASE_PATH}/lease-expirations${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<OccupancyLeaseExpirationsResponse>(url);
  return response.data.data;
}

// ============================================================================
// RECENT ACTIVITY FEED (AC-11)
// ============================================================================

/**
 * Get recent lease activity feed
 *
 * @param filter - Optional filter parameters (propertyId, limit)
 *
 * @returns Promise that resolves to list of LeaseActivityItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get last 10 activities (default)
 * const activities = await getRecentActivity();
 *
 * // Get last 20 activities for specific property
 * const activities = await getRecentActivity({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   limit: 20
 * });
 *
 * activities.forEach(activity => {
 *   console.log(`[${activity.activityType}] ${activity.description}`);
 *   console.log(`  Tenant: ${activity.tenantName}`);
 *   console.log(`  Unit: ${activity.unitNumber}`);
 *   console.log(`  Time: ${activity.timestamp}`);
 * });
 * ```
 */
export async function getRecentActivity(
  filter?: RecentActivityFilter
): Promise<LeaseActivityItem[]> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.limit) params.append('limit', filter.limit.toString());

  const queryString = params.toString();
  const url = `${OCCUPANCY_DASHBOARD_BASE_PATH}/recent-activity${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<RecentActivityResponse>(url);
  return response.data.data;
}
