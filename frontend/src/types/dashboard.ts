/**
 * Executive Dashboard Types and Interfaces
 * Story 8.1: Executive Summary Dashboard
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * KPI trend direction for change indicators
 */
export enum TrendDirection {
  UP = 'UP',
  DOWN = 'DOWN',
  NEUTRAL = 'NEUTRAL'
}

/**
 * Alert severity levels for color-coding
 */
export enum AlertSeverity {
  URGENT = 'URGENT',   // Red
  WARNING = 'WARNING', // Yellow
  INFO = 'INFO'        // Blue
}

/**
 * Alert types for categorization
 */
export enum AlertType {
  OVERDUE_COMPLIANCE = 'OVERDUE_COMPLIANCE',
  BOUNCED_CHEQUES = 'BOUNCED_CHEQUES',
  EXPIRED_VENDOR_LICENSES = 'EXPIRED_VENDOR_LICENSES',
  DOCUMENTS_EXPIRING_SOON = 'DOCUMENTS_EXPIRING_SOON',
  HIGH_VALUE_INVOICE_OVERDUE = 'HIGH_VALUE_INVOICE_OVERDUE',
  LOW_OCCUPANCY = 'LOW_OCCUPANCY',
  HIGH_MAINTENANCE_COST = 'HIGH_MAINTENANCE_COST'
}

/**
 * Property performance ranking
 */
export enum PerformanceRank {
  TOP = 'TOP',
  MIDDLE = 'MIDDLE',
  BOTTOM = 'BOTTOM'
}

// ============================================================================
// KPI INTERFACES
// ============================================================================

/**
 * Single KPI card data with trend indicator
 */
export interface KpiCard {
  value: number;
  previousValue?: number | null;
  changePercentage?: number | null;
  trend: TrendDirection;
  formattedValue: string;
  unit: string;
}

/**
 * Aging breakdown for receivables
 */
export interface AgingBreakdown {
  current: number;       // 0-30 days
  thirtyPlus: number;    // 30-60 days
  sixtyPlus: number;     // 60-90 days
  ninetyPlus: number;    // 90+ days
}

/**
 * Receivables KPI with aging breakdown (AC-4)
 */
export interface ReceivablesKpi {
  totalAmount: number;
  changePercentage?: number | null;
  trend: TrendDirection;
  aging: AgingBreakdown;
}

/**
 * All KPI cards data (AC-12)
 */
export interface KpiCards {
  netProfitLoss: KpiCard;
  occupancyRate: KpiCard;
  overdueMaintenance: KpiCard;
  outstandingReceivables: ReceivablesKpi;
}

// ============================================================================
// MAINTENANCE QUEUE INTERFACES
// ============================================================================

/**
 * Priority maintenance queue item (AC-5, AC-13)
 */
export interface MaintenanceQueueItem {
  id: string;
  workOrderNumber: string;
  propertyName: string;
  unitNumber?: string | null;
  title: string;
  description: string;
  priority: string;
  status: string;
  scheduledDate?: string | null;
  daysOverdue: number;
  isOverdue: boolean;
}

// ============================================================================
// PM JOBS CHART INTERFACES
// ============================================================================

/**
 * PM jobs chart data by category (AC-6, AC-14)
 */
export interface PmJobChartData {
  category: string;
  scheduledCount: number;
  overdueCount: number;
  totalCount: number;
}

// ============================================================================
// LEASE EXPIRATION INTERFACES
// ============================================================================

/**
 * Lease expiration timeline data (AC-7, AC-15)
 */
export interface LeaseExpirationTimeline {
  year: number;
  month: number;
  monthName: string;
  expirationCount: number;
  needsRenewalPlanning: boolean;
}

// ============================================================================
// ALERT INTERFACES
// ============================================================================

/**
 * Critical alert data (AC-8, AC-16)
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  count: number;
  actionUrl: string;
}

// ============================================================================
// PROPERTY COMPARISON INTERFACES
// ============================================================================

/**
 * Property comparison data (AC-9, AC-17)
 */
export interface PropertyComparison {
  propertyId: string;
  propertyName: string;
  occupancyRate: number;
  maintenanceCost: number;
  revenue: number;
  openWorkOrders: number;
  rank: PerformanceRank;
}

// ============================================================================
// EXECUTIVE DASHBOARD INTERFACES
// ============================================================================

/**
 * Complete executive dashboard data (AC-11)
 */
export interface ExecutiveDashboard {
  kpis: KpiCards;
  priorityMaintenanceQueue: MaintenanceQueueItem[];
  upcomingPmJobs: PmJobChartData[];
  leaseExpirations: LeaseExpirationTimeline[];
  criticalAlerts: Alert[];
  propertyComparison: PropertyComparison[];
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Dashboard filter parameters
 */
export interface DashboardFilter {
  propertyId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Maintenance queue filter parameters
 */
export interface MaintenanceQueueFilter {
  propertyId?: string;
  limit?: number;
}

/**
 * PM jobs filter parameters
 */
export interface PmJobsFilter {
  propertyId?: string;
  days?: number;
}

/**
 * Lease expirations filter parameters
 */
export interface LeaseExpirationsFilter {
  propertyId?: string;
  months?: number;
}

/**
 * Property comparison filter parameters
 */
export interface PropertyComparisonFilter {
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * Executive dashboard response
 */
export interface ExecutiveDashboardResponse {
  success: boolean;
  message: string;
  data: ExecutiveDashboard;
  timestamp: string;
}

/**
 * KPI cards response
 */
export interface KpiCardsResponse {
  success: boolean;
  message: string;
  data: KpiCards;
  timestamp: string;
}

/**
 * Maintenance queue response
 */
export interface MaintenanceQueueResponse {
  success: boolean;
  message: string;
  data: MaintenanceQueueItem[];
  timestamp: string;
}

/**
 * PM jobs response
 */
export interface PmJobsResponse {
  success: boolean;
  message: string;
  data: PmJobChartData[];
  timestamp: string;
}

/**
 * Lease expirations response
 */
export interface LeaseExpirationsResponse {
  success: boolean;
  message: string;
  data: LeaseExpirationTimeline[];
  timestamp: string;
}

/**
 * Alerts response
 */
export interface AlertsResponse {
  success: boolean;
  message: string;
  data: Alert[];
  timestamp: string;
}

/**
 * Property comparison response
 */
export interface PropertyComparisonResponse {
  success: boolean;
  message: string;
  data: PropertyComparison[];
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Alert severity display information
 */
export interface AlertSeverityInfo {
  value: AlertSeverity;
  label: string;
  color: 'red' | 'amber' | 'blue';
  bgClass: string;
  textClass: string;
}

/**
 * Alert severity options for display
 */
export const ALERT_SEVERITY_OPTIONS: AlertSeverityInfo[] = [
  {
    value: AlertSeverity.URGENT,
    label: 'Urgent',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900',
    textClass: 'text-red-800 dark:text-red-200'
  },
  {
    value: AlertSeverity.WARNING,
    label: 'Warning',
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900',
    textClass: 'text-amber-800 dark:text-amber-200'
  },
  {
    value: AlertSeverity.INFO,
    label: 'Info',
    color: 'blue',
    bgClass: 'bg-blue-100 dark:bg-blue-900',
    textClass: 'text-blue-800 dark:text-blue-200'
  }
];

/**
 * Performance rank display information
 */
export interface PerformanceRankInfo {
  value: PerformanceRank;
  label: string;
  color: 'green' | 'gray' | 'red';
  bgClass: string;
}

/**
 * Performance rank options for display
 */
export const PERFORMANCE_RANK_OPTIONS: PerformanceRankInfo[] = [
  {
    value: PerformanceRank.TOP,
    label: 'Top Performer',
    color: 'green',
    bgClass: 'bg-green-50 dark:bg-green-900/20'
  },
  {
    value: PerformanceRank.MIDDLE,
    label: 'Average',
    color: 'gray',
    bgClass: ''
  },
  {
    value: PerformanceRank.BOTTOM,
    label: 'Needs Attention',
    color: 'red',
    bgClass: 'bg-red-50 dark:bg-red-900/20'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get alert severity info by value
 */
export function getAlertSeverityInfo(severity: AlertSeverity): AlertSeverityInfo {
  return ALERT_SEVERITY_OPTIONS.find(opt => opt.value === severity) ?? ALERT_SEVERITY_OPTIONS[2];
}

/**
 * Get performance rank info by value
 */
export function getPerformanceRankInfo(rank: PerformanceRank): PerformanceRankInfo {
  return PERFORMANCE_RANK_OPTIONS.find(opt => opt.value === rank) ?? PERFORMANCE_RANK_OPTIONS[1];
}

/**
 * Get trend indicator icon and color
 */
export function getTrendIndicator(trend: TrendDirection, higherIsBetter: boolean = true): {
  icon: 'arrow-up' | 'arrow-down' | 'minus';
  color: 'green' | 'red' | 'gray';
  label: string;
} {
  switch (trend) {
    case TrendDirection.UP:
      return {
        icon: 'arrow-up',
        color: higherIsBetter ? 'green' : 'red',
        label: 'Increased'
      };
    case TrendDirection.DOWN:
      return {
        icon: 'arrow-down',
        color: higherIsBetter ? 'red' : 'green',
        label: 'Decreased'
      };
    default:
      return {
        icon: 'minus',
        color: 'gray',
        label: 'No change'
      };
  }
}

/**
 * Format currency as AED
 */
export function formatDashboardCurrency(amount: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format percentage for dashboard display
 */
export function formatDashboardPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Get month name from month number
 */
export function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] ?? '';
}
