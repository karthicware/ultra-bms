/**
 * Executive Dashboard API Service
 * Story 8.1: Executive Summary Dashboard
 *
 * All dashboard-related API calls with comprehensive JSDoc documentation
 */

import { apiClient } from '@/lib/api';
import type {
  ExecutiveDashboard,
  ExecutiveDashboardResponse,
  KpiCards,
  KpiCardsResponse,
  MaintenanceQueueItem,
  MaintenanceQueueResponse,
  PmJobChartData,
  PmJobsResponse,
  LeaseExpirationTimeline,
  LeaseExpirationsResponse,
  Alert,
  AlertsResponse,
  PropertyComparison,
  PropertyComparisonResponse,
  DashboardFilter,
  MaintenanceQueueFilter,
  PmJobsFilter,
  LeaseExpirationsFilter,
  PropertyComparisonFilter
} from '@/types/dashboard';

const DASHBOARD_BASE_PATH = '/v1/dashboard';

// ============================================================================
// COMPLETE DASHBOARD (AC-11)
// ============================================================================

/**
 * Get complete executive dashboard data in a single call
 *
 * @param filter - Optional filter parameters (propertyId, startDate, endDate)
 *
 * @returns Promise that resolves to complete ExecutiveDashboard data
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get dashboard for all properties
 * const dashboard = await getExecutiveDashboard();
 *
 * // Get dashboard for specific property
 * const dashboard = await getExecutiveDashboard({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000'
 * });
 *
 * // Get dashboard for specific date range
 * const dashboard = await getExecutiveDashboard({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 * ```
 */
export async function getExecutiveDashboard(
  filter?: DashboardFilter
): Promise<ExecutiveDashboard> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/executive${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<ExecutiveDashboardResponse>(url);
  return response.data.data;
}

// ============================================================================
// KPI DATA (AC-12)
// ============================================================================

/**
 * Get KPI cards data with trend indicators
 *
 * @param filter - Optional filter parameters (propertyId, startDate, endDate)
 *
 * @returns Promise that resolves to KpiCards with values and trends
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const kpis = await getKpiCards();
 *
 * console.log(kpis.netProfitLoss.formattedValue); // "AED 125,000"
 * console.log(kpis.occupancyRate.value); // 92.5
 * console.log(kpis.overdueMaintenance.value); // 3
 * console.log(kpis.outstandingReceivables.totalAmount); // 45000
 * ```
 */
export async function getKpiCards(
  filter?: DashboardFilter
): Promise<KpiCards> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/kpis${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<KpiCardsResponse>(url);
  return response.data.data;
}

// ============================================================================
// PRIORITY MAINTENANCE QUEUE (AC-13)
// ============================================================================

/**
 * Get high priority maintenance queue
 *
 * @param filter - Optional filter parameters (propertyId, limit)
 *
 * @returns Promise that resolves to list of MaintenanceQueueItem
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get top 5 priority items (default)
 * const queue = await getMaintenanceQueue();
 *
 * // Get top 10 items for specific property
 * const queue = await getMaintenanceQueue({
 *   propertyId: '550e8400-e29b-41d4-a716-446655440000',
 *   limit: 10
 * });
 *
 * queue.forEach(item => {
 *   console.log(`${item.workOrderNumber}: ${item.title} - ${item.daysOverdue} days overdue`);
 * });
 * ```
 */
export async function getMaintenanceQueue(
  filter?: MaintenanceQueueFilter
): Promise<MaintenanceQueueItem[]> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.limit) params.append('limit', filter.limit.toString());

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/maintenance-queue${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<MaintenanceQueueResponse>(url);
  return response.data.data;
}

// ============================================================================
// PM JOBS CHART DATA (AC-14)
// ============================================================================

/**
 * Get upcoming PM jobs by category for chart visualization
 *
 * @param filter - Optional filter parameters (propertyId, days)
 *
 * @returns Promise that resolves to list of PmJobChartData
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get PM jobs for next 30 days (default)
 * const pmJobs = await getUpcomingPmJobs();
 *
 * // Get PM jobs for next 60 days
 * const pmJobs = await getUpcomingPmJobs({ days: 60 });
 *
 * // Use data for bar chart
 * pmJobs.forEach(job => {
 *   console.log(`${job.category}: ${job.scheduledCount} scheduled, ${job.overdueCount} overdue`);
 * });
 * ```
 */
export async function getUpcomingPmJobs(
  filter?: PmJobsFilter
): Promise<PmJobChartData[]> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.days) params.append('days', filter.days.toString());

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/pm-jobs${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<PmJobsResponse>(url);
  return response.data.data;
}

// ============================================================================
// LEASE EXPIRATIONS TIMELINE (AC-15)
// ============================================================================

/**
 * Get lease expiration timeline for chart visualization
 *
 * @param filter - Optional filter parameters (propertyId, months)
 *
 * @returns Promise that resolves to list of LeaseExpirationTimeline
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * // Get expirations for next 12 months (default)
 * const expirations = await getLeaseExpirations();
 *
 * // Get expirations for next 6 months
 * const expirations = await getLeaseExpirations({ months: 6 });
 *
 * expirations.forEach(month => {
 *   console.log(`${month.monthName} ${month.year}: ${month.expirationCount} expirations`);
 *   if (month.needsRenewalPlanning) {
 *     console.log('  ⚠️ Needs renewal planning');
 *   }
 * });
 * ```
 */
export async function getLeaseExpirations(
  filter?: LeaseExpirationsFilter
): Promise<LeaseExpirationTimeline[]> {
  const params = new URLSearchParams();

  if (filter?.propertyId) params.append('propertyId', filter.propertyId);
  if (filter?.months) params.append('months', filter.months.toString());

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/lease-expirations${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<LeaseExpirationsResponse>(url);
  return response.data.data;
}

// ============================================================================
// CRITICAL ALERTS (AC-16)
// ============================================================================

/**
 * Get critical alerts panel data
 *
 * @param propertyId - Optional property filter
 *
 * @returns Promise that resolves to list of Alert sorted by severity
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const alerts = await getCriticalAlerts();
 *
 * // Alerts are sorted by severity: URGENT first, then WARNING, then INFO
 * alerts.forEach(alert => {
 *   console.log(`[${alert.severity}] ${alert.title}: ${alert.count} items`);
 *   console.log(`  Action: ${alert.actionUrl}`);
 * });
 * ```
 */
export async function getCriticalAlerts(
  propertyId?: string
): Promise<Alert[]> {
  const params = new URLSearchParams();

  if (propertyId) params.append('propertyId', propertyId);

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/alerts${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<AlertsResponse>(url);
  return response.data.data;
}

// ============================================================================
// PROPERTY COMPARISON (AC-17)
// ============================================================================

/**
 * Get property performance comparison data for table visualization
 *
 * @param filter - Optional filter parameters (startDate, endDate)
 *
 * @returns Promise that resolves to list of PropertyComparison with rankings
 *
 * @throws {UnauthorizedException} When JWT token is missing or invalid (401)
 * @throws {ForbiddenException} When user lacks required role (403)
 *
 * @example
 * ```typescript
 * const comparison = await getPropertyComparison();
 *
 * // Properties are ranked as TOP, MIDDLE, or BOTTOM based on revenue
 * comparison.forEach(property => {
 *   console.log(`${property.propertyName}: ${property.occupancyRate}% occupancy`);
 *   console.log(`  Revenue: AED ${property.revenue.toLocaleString()}`);
 *   console.log(`  Rank: ${property.rank}`);
 * });
 * ```
 */
export async function getPropertyComparison(
  filter?: PropertyComparisonFilter
): Promise<PropertyComparison[]> {
  const params = new URLSearchParams();

  if (filter?.startDate) params.append('startDate', filter.startDate);
  if (filter?.endDate) params.append('endDate', filter.endDate);

  const queryString = params.toString();
  const url = `${DASHBOARD_BASE_PATH}/property-comparison${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<PropertyComparisonResponse>(url);
  return response.data.data;
}
