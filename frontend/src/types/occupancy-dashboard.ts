/**
 * Occupancy Dashboard Types and Interfaces
 * Story 8.3: Occupancy Dashboard
 */

import { TrendDirection } from './dashboard';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Lease activity types for the activity feed
 */
export enum LeaseActivityType {
  LEASE_CREATED = 'LEASE_CREATED',
  LEASE_RENEWED = 'LEASE_RENEWED',
  LEASE_TERMINATED = 'LEASE_TERMINATED',
  NOTICE_GIVEN = 'NOTICE_GIVEN'
}

// ============================================================================
// KPI INTERFACES
// ============================================================================

/**
 * Individual KPI value with trend indicator
 */
export interface OccupancyKpiValue {
  value: number;
  previousValue?: number | null;
  changePercentage?: number | null;
  trend: TrendDirection;
  formattedValue: string;
  unit: string;
}

/**
 * Occupancy KPIs (AC-1 to AC-4)
 */
export interface OccupancyKpis {
  portfolioOccupancy: OccupancyKpiValue;  // AC-1
  vacantUnits: OccupancyKpiValue;          // AC-2
  leasesExpiring: OccupancyKpiValue;       // AC-3
  averageRentPerSqft: OccupancyKpiValue;   // AC-4
}

// ============================================================================
// CHART INTERFACES
// ============================================================================

/**
 * Occupancy segment for donut chart (AC-5)
 */
export interface OccupancySegment {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

/**
 * Portfolio occupancy donut chart data (AC-5)
 */
export interface PortfolioOccupancyChart {
  totalUnits: number;
  segments: OccupancySegment[];
}

/**
 * Monthly lease expiration data for bar chart (AC-6)
 */
export interface MonthlyExpiration {
  month: string;          // e.g., "Jan 2025"
  yearMonth: string;      // e.g., "2025-01"
  renewedCount: number;
  pendingCount: number;
  totalCount: number;
}

/**
 * Lease expirations bar chart data (AC-6)
 */
export interface LeaseExpirationChart {
  monthlyData: MonthlyExpiration[];
  totalExpiring: number;
}

// ============================================================================
// LIST INTERFACES
// ============================================================================

/**
 * Lease expiration list item (AC-7)
 */
export interface LeaseExpirationItem {
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  expiryDate: string;
  daysRemaining: number;
  isRenewed: boolean;
  renewalStatus: string;
}

/**
 * Lease activity feed item (AC-8)
 */
export interface LeaseActivityItem {
  id: string;
  activityType: LeaseActivityType;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  timestamp: string;
  description: string;
  icon: string;
  color: string;
}

// ============================================================================
// DASHBOARD INTERFACES
// ============================================================================

/**
 * Complete occupancy dashboard data (AC-9)
 */
export interface OccupancyDashboard {
  kpis: OccupancyKpis;
  occupancyChart: PortfolioOccupancyChart;
  leaseExpirationChart: LeaseExpirationChart;
  upcomingExpirations: LeaseExpirationItem[];
  recentActivity: LeaseActivityItem[];
  expiryPeriodDays: number;
}

// ============================================================================
// FILTER INTERFACES
// ============================================================================

/**
 * Occupancy dashboard filter parameters
 */
export interface OccupancyDashboardFilter {
  propertyId?: string;
}

/**
 * Lease expirations filter parameters (AC-10)
 */
export interface LeaseExpirationsFilter {
  propertyId?: string;
  days?: number;
  page?: number;
  size?: number;
}

/**
 * Recent activity filter parameters (AC-11)
 */
export interface RecentActivityFilter {
  propertyId?: string;
  limit?: number;
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

/**
 * Occupancy dashboard response (AC-9)
 */
export interface OccupancyDashboardResponse {
  success: boolean;
  message: string;
  data: OccupancyDashboard;
  timestamp: string;
}

/**
 * Lease expirations response (AC-10)
 */
export interface LeaseExpirationsResponse {
  success: boolean;
  message: string;
  data: LeaseExpirationItem[];
  page: number;
  size: number;
  timestamp: string;
}

/**
 * Recent activity response (AC-11)
 */
export interface RecentActivityResponse {
  success: boolean;
  message: string;
  data: LeaseActivityItem[];
  timestamp: string;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Activity type display information
 */
export interface ActivityTypeInfo {
  value: LeaseActivityType;
  label: string;
  icon: string;
  color: string;
  bgClass: string;
  textClass: string;
}

/**
 * Activity type options for display
 */
export const ACTIVITY_TYPE_OPTIONS: ActivityTypeInfo[] = [
  {
    value: LeaseActivityType.LEASE_CREATED,
    label: 'New Lease',
    icon: 'file-plus',
    color: '#22c55e',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300'
  },
  {
    value: LeaseActivityType.LEASE_RENEWED,
    label: 'Lease Renewed',
    icon: 'refresh-cw',
    color: '#3b82f6',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300'
  },
  {
    value: LeaseActivityType.LEASE_TERMINATED,
    label: 'Lease Terminated',
    icon: 'log-out',
    color: '#ef4444',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300'
  },
  {
    value: LeaseActivityType.NOTICE_GIVEN,
    label: 'Notice Given',
    icon: 'bell',
    color: '#f59e0b',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300'
  }
];

/**
 * Occupancy status color map for chart
 */
export const OCCUPANCY_STATUS_COLORS: Record<string, string> = {
  'Occupied': '#22c55e',       // Green
  'Vacant': '#ef4444',         // Red
  'Under Renovation': '#f59e0b', // Amber
  'Notice Period': '#3b82f6'   // Blue
};

/**
 * Renewal status display information
 */
export interface RenewalStatusInfo {
  value: string;
  label: string;
  color: 'green' | 'amber' | 'red';
  bgClass: string;
  textClass: string;
}

/**
 * Renewal status options
 */
export const RENEWAL_STATUS_OPTIONS: RenewalStatusInfo[] = [
  {
    value: 'Renewed',
    label: 'Renewed',
    color: 'green',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300'
  },
  {
    value: 'Pending',
    label: 'Pending',
    color: 'amber',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300'
  },
  {
    value: 'Expired',
    label: 'Expired',
    color: 'red',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300'
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get activity type info by value
 */
export function getActivityTypeInfo(type: LeaseActivityType): ActivityTypeInfo {
  return ACTIVITY_TYPE_OPTIONS.find(opt => opt.value === type) ?? ACTIVITY_TYPE_OPTIONS[0];
}

/**
 * Get renewal status info by value
 */
export function getRenewalStatusInfo(status: string): RenewalStatusInfo {
  return RENEWAL_STATUS_OPTIONS.find(opt => opt.value === status) ?? RENEWAL_STATUS_OPTIONS[1];
}

/**
 * Get occupancy status color
 */
export function getOccupancyStatusColor(status: string): string {
  return OCCUPANCY_STATUS_COLORS[status] ?? '#94a3b8';
}

/**
 * Format days remaining display
 */
export function formatDaysRemaining(days: number): string {
  if (days < 0) {
    return `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    return 'Expires today';
  } else if (days === 1) {
    return '1 day remaining';
  } else {
    return `${days} days remaining`;
  }
}

/**
 * Get days remaining urgency level
 */
export function getDaysRemainingUrgency(days: number): 'critical' | 'warning' | 'normal' {
  if (days <= 0) return 'critical';
  if (days <= 30) return 'warning';
  return 'normal';
}

/**
 * Get urgency color classes
 */
export function getUrgencyClasses(urgency: 'critical' | 'warning' | 'normal'): {
  bgClass: string;
  textClass: string;
} {
  switch (urgency) {
    case 'critical':
      return {
        bgClass: 'bg-red-100 dark:bg-red-900/30',
        textClass: 'text-red-700 dark:text-red-300'
      };
    case 'warning':
      return {
        bgClass: 'bg-amber-100 dark:bg-amber-900/30',
        textClass: 'text-amber-700 dark:text-amber-300'
      };
    default:
      return {
        bgClass: 'bg-gray-100 dark:bg-gray-800',
        textClass: 'text-gray-700 dark:text-gray-300'
      };
  }
}
